import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

// Node.js runtime — youtube-transcript requires Node APIs; Edge blocks YouTube requests
export const runtime = 'nodejs';
// Extend timeout: Vercel hobby allows up to 60s, pro allows 300s
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    handler: 'analyze-recipe-video-GET-v7',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
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

function isSpamOembed(title: string, channel: string): boolean {
  const text = `${title} ${channel}`;
  return [
    /\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    /\bad[\s_-]*(upload|channel)\b/i,
    /advertisement/i,
    /sponsored\s+by/i,
  ].some(p => p.test(text));
}

async function fetchTranscript(videoId: string): Promise<string> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('transcript timeout')), 8000)
  );
  try {
    let segments;
    try {
      segments = await Promise.race([
        YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' }),
        timeout,
      ]);
    } catch {
      segments = await Promise.race([
        YoutubeTranscript.fetchTranscript(videoId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
    }
    return (segments as { text: string }[])
      .map(s => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);
  } catch {
    return '';
  }
}

async function fetchDescription(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return '';
    const html = await res.text();
    const m = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (m) {
      return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').slice(0, 3000);
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
양파 1/2개, 대파 1/2대
고추장 2큰술, 고춧가루 1큰술, 간장 1큰술, 설탕 1큰술, 참기름 1큰술, 다진마늘 1큰술

예시 출력:
{
  "title": "백종원 제육볶음",
  "story": "백종원 셰프의 제육볶음은 고추장과 고춧가루를 함께 써서 깊은 붉은 색과 매콤달콤한 맛이 특징입니다.",
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
    {"name": "다진마늘", "base_amount": 1, "unit": "큰술", "type": "seasoning"}
  ],
  "steps": [
    {"burner": 1, "action": "양념장 만들기", "duration_sec": 120, "description": "볼에 고추장 2큰술, 고춧가루 1큰술, 간장 1큰술, 설탕 1큰술, 다진마늘 1큰술을 섞어 양념장을 만든다."},
    {"burner": 1, "action": "밑간 재우기", "duration_sec": 600, "description": "돼지고기에 양념장을 넣고 10분 재운다."},
    {"burner": 1, "action": "강불 볶기", "duration_sec": 300, "description": "팬을 강불로 달궈 고기를 5분 볶는다."},
    {"burner": 1, "action": "채소 마무리", "duration_sec": 180, "description": "양파·대파 넣고 중불 3분, 참기름 두르고 완성."}
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

    // Fetch oEmbed, transcript, and description in parallel
    const [oembedResult, transcript, description] = await Promise.all([
      Promise.all([
        fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`, { signal: AbortSignal.timeout(4000) })
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/shorts/${videoId}`)}&format=json`, { signal: AbortSignal.timeout(4000) })
          .then(r => r.ok ? r.json() : null).catch(() => null),
      ]).then(([watch, shorts]) => {
        const data = (watch ?? shorts) as { title?: string; author_name?: string } | null;
        return { title: data?.title ?? '', channelName: data?.author_name ?? '', succeeded: !!data };
      }),
      fetchTranscript(videoId),
      fetchDescription(videoId),
    ]);

    const { title: videoTitle, channelName, succeeded: oembedSucceeded } = oembedResult;

    // Build context for Gemini — transcript is the primary source
    const hasTranscript = transcript.length > 100;
    const hasDescription = description.length > 50;

    const videoInfoSection = [
      videoTitle ? `영상 제목: "${videoTitle}"` : `영상 ID: ${videoId}`,
      channelName ? `채널명: ${channelName}` : '',
      hasDescription ? `\n[더보기 설명]\n${description}` : '',
      hasTranscript ? `\n[영상 자막 — 이 내용을 최우선으로 사용]\n${transcript}` : '',
    ].filter(Boolean).join('\n');

    const dataQuality = hasTranscript
      ? '자막이 제공됨 — 자막 내용을 최우선으로 사용해서 정확한 재료와 단계를 추출해줘.'
      : hasDescription
        ? '자막 없음, 더보기 설명 기반으로 추출해줘.'
        : '자막·설명 없음 — 제목과 채널명으로만 추론하되 불확실한 수치는 "적당량"으로 표기해.';

    const systemInstruction = `너는 유튜브 영상 자막(스크립트)과 더보기란 텍스트를 기반으로 정확한 레시피를 추출하는 전문 셰프야.

제약 조건:
1. 자막에 명시된 재료·단계·수량을 그대로 추출해. 없는 내용은 추가하지 마.
2. 수량이 불명확하면 base_amount는 반드시 숫자 0으로 쓰고, unit 필드에 "적당량"을 표기해.
3. 자막에 불 세기(강불/중불/약불)와 시간(분)이 있으면 steps에 반드시 포함.
4. 더보기에 재료 목록이 있으면 그 목록을 우선으로 사용하고 자막으로 수량 보완.
5. ${dataQuality}`;

    const userPrompt = `다음 정보를 기반으로 레시피를 추출해서 JSON으로 반환해줘.

${videoInfoSection}

${FEW_SHOT_EXAMPLE}

위 예시처럼 순수 JSON만 응답해 (마크다운 코드블록 없이):
{
  "title": "요리명",
  "story": "이 요리의 매력 2-3문장",
  "servings": 2,
  "thumbnail": "이모지 1개",
  "ingredients": [
    {"name": "재료명", "base_amount": 숫자(불명확하면 0), "unit": "단위(불명확하면 '적당량')", "type": "main|seasoning|garnish"}
  ],
  "steps": [
    {"burner": 1, "action": "단계명(3-6자)", "duration_sec": 초, "description": "구체적 방법"}
  ]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: AbortSignal.timeout(25000),
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
      return NextResponse.json({ error: `Gemini 오류: ${geminiData.error.message}` }, { status: 500 });
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!content) {
      return NextResponse.json({ error: 'AI 응답이 비어 있습니다. 다시 시도해 주세요.' }, { status: 500 });
    }

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
      // Debug info shown in preview
      _source: hasTranscript ? 'transcript' : hasDescription ? 'description' : 'title_only',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
