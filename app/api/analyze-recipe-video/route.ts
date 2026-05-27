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

function isSpamOembed(title: string, channel: string): boolean {
  const text = `${title} ${channel}`;
  const spamPatterns = [
    /\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    /\bad[\s_-]*(upload|channel)\b/i,
    /advertisement/i,
    /sponsored\s+by/i,
  ];
  return spamPatterns.some(p => p.test(text));
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
    // Try both watch URL and Shorts URL — Shorts sometimes only work with the Shorts format
    let videoTitle = '';
    let channelName = '';
    let oembedSucceeded = false;
    try {
      const oembedCandidates = [
        `https://www.youtube.com/watch?v=${videoId}`,
        `https://www.youtube.com/shorts/${videoId}`,
      ];
      for (const candidate of oembedCandidates) {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(candidate)}&format=json`);
        if (oembedRes.ok) {
          const data = await oembedRes.json() as { title?: string; author_name?: string };
          videoTitle = data.title ?? '';
          channelName = data.author_name ?? '';
          oembedSucceeded = true;
          break;
        }
      }
    } catch {
      // ignore — proceed with Gemini using video ID only
    }

    const videoInfo = videoTitle
      ? `유튜브 영상 제목: "${videoTitle}"\n채널명: ${channelName}`
      : `유튜브 영상 ID: ${videoId}`;

    const prompt = `당신은 한식 레시피 전문가입니다. 아래 유튜브 영상의 요리를 구글 검색을 활용해서 가능한 정확하게 재현한 레시피를 JSON으로 작성해 주세요.

${videoInfo}

위 영상에서 다루는 요리를 분석하고, 실제 해당 요리의 정확한 재료와 조리법을 작성해 주세요.
채널 크리에이터의 스타일과 실제 레시피에 충실하게 작성하되, 재료 양은 2인분 기준 현실적인 수치로 작성하세요.

반드시 다음 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만:
{
  "title": "요리명 (간결하게, 영상 제목 기반)",
  "story": "이 요리의 매력과 특징을 2-3문장으로 설명",
  "servings": 2,
  "thumbnail": "대표 이모지 1개",
  "ingredients": [
    {"name": "재료명", "base_amount": 숫자, "unit": "단위(g/ml/개/큰술/작은술 등)", "type": "main|seasoning|garnish"}
  ],
  "steps": [
    {"burner": 1, "action": "단계명 (3-5자)", "duration_sec": 초, "description": "구체적인 조리 방법 설명"}
  ]
}

주의사항:
- title은 영상 제목에서 추출한 실제 요리명으로 작성
- ingredients의 type: main(주재료), seasoning(양념/소스), garnish(고명/마무리)
- 재료는 6-12개, 단계는 5-8개로 실제 레시피에 맞게 구성
- base_amount는 2인분 기준 실제 사용하는 양 (예: 돼지고기 200, 간장 2, 소금 0.5)
- duration_sec은 실제 조리에 필요한 시간 (볶기 5분=300, 끓이기 20분=1200)`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
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

    // Strip markdown fences and search-grounding citations, then extract JSON
    const stripped = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .replace(/\[\d+\]/g, '')   // remove [1], [2] citation markers
      .trim();
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

    // Only reject youtube_id when oEmbed succeeded AND returned spam content.
    // If oEmbed failed entirely (e.g. Shorts, private video), still save the id —
    // the user explicitly submitted a valid YouTube URL.
    const includeVideo = !oembedSucceeded || !isSpamOembed(videoTitle, channelName);

    return NextResponse.json({
      recipe: {
        ...recipe,
        youtube_id: includeVideo ? videoId : undefined,
        youtube_credit: includeVideo ? channelName : '',
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
