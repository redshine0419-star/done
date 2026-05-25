import type { VReq, VRes } from './_types';

interface ExtractedItem {
  name: string;
  icon: string;
  amount: number;
  unit: string;
}

export default async function handler(req: VReq, res: VRes) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mimeType } = req.body as { image?: string; mimeType?: string };
  if (!image) return res.status(400).json({ error: 'image required' });

  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `이 이미지에서 식재료(음식 재료)만 추출해서 JSON 배열로 반환해주세요.
이미지는 마트 영수증, 냉장고 사진, 장바구니 사진, 배송 박스 사진일 수 있습니다.
식재료가 아닌 항목(세제, 생활용품, 음료, 과자, 가공식품)은 제외하세요.
신선 식재료(채소, 육류, 생선, 달걀, 두부 등)와 양념류(간장, 고추장, 된장 등)를 포함하세요.

각 항목 형식:
{ "name": "재료명(한국어, 간결하게)", "icon": "관련 이모지 1개", "amount": 수량(숫자), "unit": "g·개·대·ml·팩·봉 중 적절한 것" }

마크다운 코드블록 없이 순수 JSON 배열만 반환하세요.
식재료를 찾을 수 없으면 빈 배열 []을 반환하세요.`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType ?? 'image/jpeg', data: image } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) throw new Error(`Gemini error ${geminiRes.status}`);

    const data = await geminiRes.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const ingredients = JSON.parse(cleaned) as ExtractedItem[];

    res.json({ ingredients });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
