import { NextRequest, NextResponse } from 'next/server';

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
    const { youtube_url } = await req.json() as { youtube_url: string };
    if (!youtube_url) {
      return NextResponse.json({ error: 'youtube_url is required' }, { status: 400 });
    }

    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return NextResponse.json({ error: '유효한 유튜브 URL이 아닙니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    // Get video metadata via oEmbed (no API key needed)
    // Properly encode the video URL as a query parameter
    const videoUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${videoUrl}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );

    let videoTitle = '';
    let channelName = '';

    if (oembedRes.ok) {
      const contentType = oembedRes.headers.get('content-type') ?? '';
      if (contentType.includes('application/json') || contentType.includes('text/javascript')) {
        try {
          const oembedData = await oembedRes.json() as { title?: string; author_name?: string };
          videoTitle = oembedData.title ?? '';
          channelName = oembedData.author_name ?? '';
        } catch {
          // oEmbed parse failed, continue with empty metadata
        }
      }
    }

    // If oEmbed didn't give us a title, use a generic prompt
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Gemini API 오류 (${geminiRes.status}): ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const geminiContentType = geminiRes.headers.get('content-type') ?? '';
    if (!geminiContentType.includes('application/json')) {
      const errText = await geminiRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Gemini 응답 형식 오류: ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (geminiData.error) {
      return NextResponse.json({ error: `Gemini: ${geminiData.error.message}` }, { status: 500 });
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AI가 올바른 레시피 형식을 반환하지 않았습니다. 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    const recipe = JSON.parse(jsonMatch[0]) as {
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
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'AI 분석 시간이 초과되었습니다. 다시 시도해 주세요.' }, { status: 504 });
    }
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'AI 분석 시간이 초과되었습니다. 다시 시도해 주세요.' }, { status: 504 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
