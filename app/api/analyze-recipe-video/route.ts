import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    handler: 'analyze-recipe-video-GET-v3',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiKeyPrefix: process.env.GEMINI_API_KEY?.slice(0, 6) ?? 'NOT_SET',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeVersion: process.version,
    ts: Date.now(),
  });
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { youtube_url?: string };
    const youtube_url = body?.youtube_url;
    if (!youtube_url) {
      return NextResponse.json({ error: 'youtube_url이 필요합니다.' }, { status: 400 });
    }

    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return NextResponse.json({ error: '유효한 유튜브 URL이 아닙니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    // oEmbed: video title & channel (optional — continue without it)
    let videoTitle = '';
    let channelName = '';
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json() as { title?: string; author_name?: string };
        videoTitle = oembedData.title ?? '';
        channelName = oembedData.author_name ?? '';
      }
    } catch {
      // ignore — proceed with Gemini using video ID only
    }

    const videoInfo = videoTitle
      ? `영상 제목: ${videoTitle}\n채널명: ${channelName}`
      : `유튜브 영상 ID: ${videoId}`;

    const prompt = `당신은 한식 레시피 전문가입니다. 아래 유튜브 영상 정보를 참고해서, 해당 요리를 독자적으로 재현한 레시피를 JSON 형식으로 작성해 주세요. 영상 내용을 직접 복사하지 말고, 일반적으로 알려진 조리법을 바탕으로 창작해 주세요.

${videoInfo}

반드시 다음 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:
{
  "title": "요리명 (간결하게)",
  "story": "이 요리의 매력과 특징을 2-3문장으로 설명",
  "servings": 2,
  "thumbnail": "대표 이모지 1개",
  "ingredients": [
    {"name": "재료명", "base_amount": 숫자, "unit": "단위", "type": "main|seasoning|garnish"}
  ],
  "steps": [
    {"burner": 1, "action": "단계명 (3-5자)", "duration_sec": 초, "description": "상세 설명"}
  ]
}

주의사항:
- ingredients의 type은 main(주재료), seasoning(양념), garnish(고명) 중 하나
- steps의 burner는 항상 1 (단품 레시피)
- duration_sec은 해당 단계의 예상 시간(초)
- 재료는 5-10개, 단계는 4-7개로 구성`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Gemini API 오류 (${geminiRes.status}): ${errText.slice(0, 300)}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (geminiData.error) {
      return NextResponse.json(
        { error: `Gemini 오류: ${geminiData.error.message}` },
        { status: 500 }
      );
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!content) {
      return NextResponse.json(
        { error: 'AI 응답이 비어 있습니다. 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    // Strip markdown code fences if present, then find outermost JSON object
    const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: `AI가 레시피 형식으로 응답하지 않았습니다: ${content.slice(0, 150)}` },
        { status: 500 }
      );
    }

    const recipe = JSON.parse(jsonMatch[0].trim()) as {
      title: string;
      story: string;
      servings: number;
      thumbnail: string;
      ingredients: { name: string; base_amount: number; unit: string; type: string }[];
      steps: { burner: number | null; action: string; duration_sec: number; description: string }[];
    };

    return NextResponse.json({
      recipe: {
        ...recipe,
        youtube_id: videoId,
        youtube_credit: channelName,
        ingredients: recipe.ingredients.map((ing, i) => ({
          ...ing,
          ingredient_id: `auto_${i}`,
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
