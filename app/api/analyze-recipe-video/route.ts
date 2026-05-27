import { NextRequest, NextResponse } from 'next/server';

// Video analysis needs more time than edge allows
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    handler: 'analyze-recipe-video-GET-v5',
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

async function fetchVideoDescription(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return '';
    const html = await res.text();

    // ytInitialData contains shortDescription in player microformat
    const microformatMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (microformatMatch) {
      return microformatMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .slice(0, 2000);
    }

    // Fallback: ytInitialPlayerResponse description
    const playerMatch = html.match(/"description":\s*\{"simpleText":"((?:[^"\\]|\\.)*)"\}/);
    if (playerMatch) {
      return playerMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .slice(0, 2000);
    }

    return '';
  } catch {
    return '';
  }
}

const FEW_SHOT_EXAMPLE = `
예시 입력:
영상 제목: "백종원의 제육볶음 레시피"
채널명: 백종원의 요리비책
더보기 설명:
제육볶음 재료 (2인분)
돼지고기 앞다리살 300g
양파 1/2개
대파 1/2대
고추장 2큰술, 고춧가루 1큰술, 간장 1큰술, 설탕 1큰술, 참기름 1큰술, 다진마늘 1큰술, 후추 약간

예시 출력:
{
  "title": "백종원 제육볶음",
  "story": "백종원 셰프의 제육볶음은 고추장과 고춧가루를 함께 써서 깊은 붉은 색과 매콤달콤한 맛이 특징입니다. 양파와 대파를 넉넉히 넣어 채소의 단맛이 돼지고기와 어우러집니다.",
  "servings": 2,
  "thumbnail": "🥩",
  "ingredients": [
    {"name": "돼지고기 앞다리살", "base_amount": 300, "unit": "g", "type": "main"},
    {"name": "양파", "base_amount": 0.5, "unit": "개", "type": "main"},
    {"name": "대파", "base_amount": 0.5, "unit": "대", "type": "main"},
    {"name": "고추장", "base_amount": 2, "unit": "큰술", "type": "seasoning"},
    {"name": "고춧가루", "base_amount": 1, "unit": "큰술", "type": "seasoning"},
    {"name": "간장", "base_amount": 1, "unit": "큰술", "type": "seasoning"},
    {"name": "설탕", "base_amount": 1, "unit": "큰술", "type": "seasoning"},
    {"name": "참기름", "base_amount": 1, "unit": "큰술", "type": "seasoning"},
    {"name": "다진마늘", "base_amount": 1, "unit": "큰술", "type": "seasoning"},
    {"name": "후추", "base_amount": 0.1, "unit": "약간", "type": "seasoning"}
  ],
  "steps": [
    {"burner": 1, "action": "양념장 만들기", "duration_sec": 120, "description": "볼에 고추장 2큰술, 고춧가루 1큰술, 간장 1큰술, 설탕 1큰술, 다진마늘 1큰술, 후추 약간을 섞어 양념장을 만든다."},
    {"burner": 1, "action": "재료 밑간", "duration_sec": 600, "description": "돼지고기에 양념장을 넣고 10분간 재워 밑간한다."},
    {"burner": 1, "action": "강불에 볶기", "duration_sec": 300, "description": "팬을 강불로 달군 뒤 밑간한 돼지고기를 넣고 5분간 볶는다."},
    {"burner": 1, "action": "채소 추가", "duration_sec": 180, "description": "양파와 대파를 넣고 중불에서 3분간 함께 볶은 뒤 참기름 1큰술을 두르고 마무리한다."}
  ]
}`.trim();

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
      // ignore
    }

    // Fetch video description from YouTube page for grounding
    const videoDescription = await fetchVideoDescription(videoId);

    const videoInfoSection = [
      videoTitle ? `영상 제목: "${videoTitle}"` : `영상 ID: ${videoId}`,
      channelName ? `채널명: ${channelName}` : '',
      videoDescription ? `\n더보기 설명:\n${videoDescription}` : '',
    ].filter(Boolean).join('\n');

    const systemInstruction = `너는 유튜브 영상 스크립트와 더보기란 정보를 기반으로 정확한 레시피를 추출하는 전문 셰프이자 데이터 분석가야.

제약 조건:
1. 제공된 텍스트(더보기 설명, 영상 제목)에 존재하지 않는 재료나 조리 단계는 절대 임의로 추가하지 마. (환각 방지)
2. 정보가 부족해 유추해야 하는 부분이 있다면 소설을 쓰지 말고 구체적 수치 대신 "적당량" 또는 "취향에 따라"로만 표기해.
3. 양념 비율은 반드시 영상 속 언급된 기준(밥숟가락, g, 컵, 종이컵 등)을 그대로 명시해.
4. 불 조절(강불, 중불, 약불)과 조리 시간(분 단위) 정보가 있으면 무조건 steps의 action과 description에 포함해.
5. 더보기 설명에 재료 목록이 명시된 경우, 그 목록을 최우선으로 사용해.
6. 구글 검색은 크리에이터 채널 스타일 파악 및 부족한 정보 보완에만 활용해. 관계없는 다른 레시피로 대체하지 마.`;

    const userPrompt = `아래 유튜브 영상의 레시피를 추출해서 정확한 JSON으로 반환해줘.

${videoInfoSection}

${FEW_SHOT_EXAMPLE}

위 예시처럼 아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만:
{
  "title": "요리명 (간결하게, 영상 제목 기반)",
  "story": "이 요리의 매력과 특징을 2-3문장으로 설명",
  "servings": 2,
  "thumbnail": "대표 이모지 1개",
  "ingredients": [
    {"name": "재료명", "base_amount": 숫자, "unit": "단위(g/ml/개/큰술/작은술 등)", "type": "main|seasoning|garnish"}
  ],
  "steps": [
    {"burner": 1, "action": "단계명 (3-6자, 불 세기 포함 예: 강불에 볶기)", "duration_sec": 초, "description": "구체적인 조리 방법. 불 세기와 시간 명시."}
  ]
}

주의:
- title은 영상 제목에서 추출한 실제 요리명
- ingredients type: main(주재료), seasoning(양념/소스), garnish(고명/마무리)
- 재료는 더보기에 나온 것만 사용 (없으면 영상 제목 기반으로 최소한만)
- base_amount는 영상 언급 기준 그대로 (예: 고추장 2큰술이면 2, 돼지고기 300g이면 300)
- duration_sec은 실제 조리 시간 (볶기 5분=300, 끓이기 20분=1200)`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const baseConfig = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    };

    // Primary: pass the actual YouTube video to Gemini for native video understanding
    const videoUri = `https://www.youtube.com/watch?v=${videoId}`;
    let geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseConfig,
        contents: [{
          role: 'user',
          parts: [
            { fileData: { fileUri: videoUri } },
            { text: userPrompt },
          ],
        }],
      }),
    });

    // Fallback: text-only with Google Search if video is inaccessible
    if (!geminiRes.ok) {
      geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...baseConfig,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          tools: [{ google_search: {} }],
        }),
      });
    }

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
      .replace(/\[\d+\]/g, '')
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
