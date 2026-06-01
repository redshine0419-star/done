import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Recipe {
  id: string;
  title: string;
  story: string;
  ingredients: { name: string; base_amount?: number; amount?: number; unit: string }[];
  steps: { burner: number | null; action?: string; label?: string; duration_sec?: number; durationMin?: number; description?: string }[];
  servings: number;
  isCombo: boolean;
}

const CRON_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: '묵은지 김치찌개 + 계란말이',
    story: '잘 익은 묵은지로 끓인 깊은 맛의 김치찌개와 폭신한 계란말이의 조합',
    ingredients: [
      { name: '묵은지', amount: 300, unit: 'g' },
      { name: '돼지고기', amount: 200, unit: 'g' },
      { name: '두부', amount: 150, unit: 'g' },
      { name: '계란', amount: 3, unit: '개' },
    ],
    steps: [{ burner: 1, action: '찌개 끓이기', duration_sec: 1200 }, { burner: 2, action: '계란말이', duration_sec: 480 }],
    servings: 2,
    isCombo: true,
  },
  {
    id: 'r2',
    title: '제육볶음 + 계란찜',
    story: '매콤달콤 제육볶음과 부드러운 계란찜으로 완성하는 집밥 정식',
    ingredients: [
      { name: '돼지고기', amount: 300, unit: 'g' },
      { name: '고추장', amount: 2, unit: '큰술' },
      { name: '계란', amount: 3, unit: '개' },
    ],
    steps: [{ burner: 1, action: '제육볶음', duration_sec: 900 }, { burner: 2, action: '계란찜', duration_sec: 720 }],
    servings: 2,
    isCombo: true,
  },
  {
    id: 'r3',
    title: '된장찌개',
    story: '두부와 애호박이 가득한 구수한 된장찌개',
    ingredients: [
      { name: '된장', amount: 2, unit: '큰술' },
      { name: '두부', amount: 200, unit: 'g' },
      { name: '애호박', amount: 1, unit: '개' },
      { name: '대파', amount: 1, unit: '대' },
    ],
    steps: [{ burner: 1, action: '찌개 끓이기', duration_sec: 900 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'r4',
    title: '불고기 + 미역국',
    story: '달콤한 불고기와 시원한 미역국의 균형 잡힌 한 상',
    ingredients: [
      { name: '소고기', amount: 300, unit: 'g' },
      { name: '간장', amount: 3, unit: '큰술' },
      { name: '미역', amount: 20, unit: 'g' },
      { name: '참기름', amount: 1, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '불고기 볶기', duration_sec: 600 }, { burner: 2, action: '미역국 끓이기', duration_sec: 1200 }],
    servings: 2,
    isCombo: true,
  },
  {
    id: 'r5',
    title: '순두부찌개',
    story: '부드러운 순두부와 해물이 어우러진 얼큰한 찌개',
    ingredients: [
      { name: '순두부', amount: 300, unit: 'g' },
      { name: '해물믹스', amount: 150, unit: 'g' },
      { name: '고춧가루', amount: 2, unit: '큰술' },
      { name: '계란', amount: 1, unit: '개' },
    ],
    steps: [{ burner: 1, action: '찌개 끓이기', duration_sec: 900 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'r6',
    title: '잡채',
    story: '형형색색 채소와 당면이 어우러진 명절 잡채',
    ingredients: [
      { name: '당면', amount: 200, unit: 'g' },
      { name: '소고기', amount: 100, unit: 'g' },
      { name: '시금치', amount: 100, unit: 'g' },
      { name: '양파', amount: 1, unit: '개' },
      { name: '간장', amount: 3, unit: '큰술' },
      { name: '참기름', amount: 2, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '당면·고기 볶기', duration_sec: 600 }],
    servings: 4,
    isCombo: false,
  },
  {
    id: 'r7',
    title: '감자조림',
    story: '간장 양념이 쏙 밴 달콤짭조름한 감자조림',
    ingredients: [
      { name: '감자', amount: 3, unit: '개' },
      { name: '간장', amount: 2, unit: '큰술' },
      { name: '설탕', amount: 1, unit: '큰술' },
      { name: '참기름', amount: 1, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '감자 조리기', duration_sec: 900 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'r8',
    title: '콩나물국밥',
    story: '뜨끈한 국물에 아삭한 콩나물이 가득한 해장 국밥',
    ingredients: [
      { name: '콩나물', amount: 200, unit: 'g' },
      { name: '밥', amount: 2, unit: '공기' },
      { name: '대파', amount: 1, unit: '대' },
      { name: '다진마늘', amount: 1, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '국 끓이기', duration_sec: 900 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'r9',
    title: '삼겹살 구이 + 된장찌개',
    story: '노릇노릇 삼겹살과 구수한 된장찌개로 완성하는 삼겹살 정식',
    ingredients: [
      { name: '삼겹살', amount: 400, unit: 'g' },
      { name: '된장', amount: 2, unit: '큰술' },
      { name: '두부', amount: 150, unit: 'g' },
      { name: '쌈채소', amount: 1, unit: '봉' },
    ],
    steps: [{ burner: 1, action: '삼겹살 굽기', duration_sec: 900 }, { burner: 2, action: '된장찌개 끓이기', duration_sec: 1200 }],
    servings: 2,
    isCombo: true,
  },
  {
    id: 'r10',
    title: '시금치 된장국',
    story: '봄 시금치의 향긋함과 된장의 깊은 맛이 조화로운 국',
    ingredients: [
      { name: '시금치', amount: 150, unit: 'g' },
      { name: '된장', amount: 1, unit: '큰술' },
      { name: '조개', amount: 100, unit: 'g' },
    ],
    steps: [{ burner: 1, action: '국 끓이기', duration_sec: 600 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'extra1',
    title: '닭볶음탕',
    story: '매콤한 양념이 쏙 밴 닭볶음탕, 감자와 함께 끓여 더욱 든든한',
    ingredients: [
      { name: '닭', amount: 500, unit: 'g' },
      { name: '감자', amount: 2, unit: '개' },
      { name: '고추장', amount: 2, unit: '큰술' },
      { name: '고춧가루', amount: 1, unit: '큰술' },
      { name: '간장', amount: 2, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '닭 조리기', duration_sec: 1500 }],
    servings: 3,
    isCombo: false,
  },
  {
    id: 'extra2',
    title: '참치김치볶음밥',
    story: '냉장고 속 김치와 참치캔으로 뚝딱 만드는 고소한 볶음밥',
    ingredients: [
      { name: '밥', amount: 2, unit: '공기' },
      { name: '김치', amount: 150, unit: 'g' },
      { name: '참치캔', amount: 1, unit: '캔' },
      { name: '계란', amount: 2, unit: '개' },
      { name: '참기름', amount: 1, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '볶음밥 볶기', duration_sec: 600 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'extra3',
    title: '떡볶이',
    story: '쫄깃한 떡과 어묵이 어우러진 매콤달콤 국민 간식',
    ingredients: [
      { name: '떡볶이 떡', amount: 300, unit: 'g' },
      { name: '어묵', amount: 100, unit: 'g' },
      { name: '고추장', amount: 2, unit: '큰술' },
      { name: '설탕', amount: 1, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '떡볶이 끓이기', duration_sec: 900 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'extra4',
    title: '소고기 미역국',
    story: '생일상에 빠질 수 없는 진한 소고기 미역국',
    ingredients: [
      { name: '소고기', amount: 150, unit: 'g' },
      { name: '미역', amount: 30, unit: 'g' },
      { name: '참기름', amount: 1, unit: '큰술' },
      { name: '국간장', amount: 1, unit: '큰술' },
    ],
    steps: [{ burner: 1, action: '미역국 끓이기', duration_sec: 1800 }],
    servings: 2,
    isCombo: false,
  },
  {
    id: 'extra5',
    title: '계란볶음밥 + 미소국',
    story: '고소한 계란볶음밥과 따뜻한 일식풍 미소국의 간편 한 끼',
    ingredients: [
      { name: '밥', amount: 2, unit: '공기' },
      { name: '계란', amount: 3, unit: '개' },
      { name: '대파', amount: 1, unit: '대' },
      { name: '된장', amount: 1, unit: '큰술' },
      { name: '두부', amount: 100, unit: 'g' },
    ],
    steps: [{ burner: 1, action: '볶음밥 볶기', duration_sec: 480 }, { burner: 2, action: '미소국 끓이기', duration_sec: 600 }],
    servings: 2,
    isCombo: true,
  },
];

const BLOG_CATEGORIES = ['요리팁', '식재료이야기', '건강식', '시즌레시피', '미각탐구'] as const;
type BlogCategory = typeof BLOG_CATEGORIES[number];

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

const CATEGORY_GUIDES: Record<BlogCategory, string> = {
  '요리팁':    '이 레시피에서 활용할 수 있는 실용적인 조리 기술, 시간 절약 노하우, 실패하지 않는 팁을 중심으로 작성하세요.',
  '식재료이야기': '이 레시피의 핵심 재료(원산지, 영양 성분, 고르는 법, 보관법, 제철 정보)를 심층적으로 다루세요.',
  '건강식':    '이 레시피의 영양 균형, 건강 효능, 칼로리, 다이어트·면역·장 건강 측면을 과학적으로 설명하세요.',
  '시즌레시피': '현재 계절에 이 레시피가 특히 맛있는 이유, 제철 재료 활용법, 계절 변형 아이디어를 담으세요.',
  '미각탐구':  '이 레시피의 맛 구조(짠맛·단맛·감칠맛·신맛·쓴맛의 조화), 향미 과학, 풍미를 극대화하는 비법을 탐구하세요.',
};

function getTodayCategory(): BlogCategory {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return BLOG_CATEGORIES[dayOfYear % BLOG_CATEGORIES.length];
}

function buildPrompt(recipe: Recipe, category?: BlogCategory): string {
  const resolvedCategory = category ?? getTodayCategory();
  const totalSec = recipe.steps.reduce((s, st) => s + (st.duration_sec ?? (st.durationMin ?? 0) * 60), 0);
  const totalMin = Math.round(totalSec / 60) || 20;
  const ingredientList = recipe.ingredients.map(i => `${i.name} ${i.base_amount ?? i.amount ?? ''}${i.unit}`).join(', ');
  return `당신은 한국 푸드 매거진 수석 에디터입니다. 식품 과학, 문화적 맥락, 실용적 팁을 따뜻하고 친근한 어조로 담아냅니다.

다음 레시피 정보를 바탕으로 카테고리 "${resolvedCategory}" 블로그 포스트 JSON을 생성해주세요.

레시피 정보:
- 이름: ${recipe.title}
- 소개: ${recipe.story}
- 재료: ${ingredientList}
- 조리 시간: 약 ${totalMin}분
- 계절: ${getSeason()}
- 인원: ${recipe.servings}인분

카테고리 작성 방향: ${CATEGORY_GUIDES[resolvedCategory]}

JSON 형식으로 아래 필드를 반환하세요 (마크다운 코드블록 없이 순수 JSON만):
{
  "title": "블로그 포스트 제목 (20자 이내, 호기심을 자극하는 제목)",
  "category": "${resolvedCategory}",
  "thumbnail": "레시피를 표현하는 이모지 1개",
  "summary": "포스트 요약 (80자 이내, 독자를 끌어들이는 한 줄)",
  "body": "마크다운 본문 (400~600자, ## 헤딩 2개 이상 포함, 식품 과학 또는 문화적 배경 포함)",
  "author": "에디터 이름 (한국 이름, 예: 김지연 에디터)",
  "tags": ["태그1", "태그2", "태그3"],
  "read_time": 읽기 소요 분 (숫자, 3~7 사이)
}`;
}

async function callGemini(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: '당신은 한국 푸드 매거진 수석 에디터입니다. 요청된 JSON만 반환하고, 절대 마크다운 코드블록을 사용하지 마세요.' }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  const rawText = await res.text();

  if (!res.ok || rawText.trimStart().startsWith('<')) {
    const preview = rawText.slice(0, 200);
    throw new Error(`Gemini API error (status ${res.status}): ${preview}`);
  }

  const data = JSON.parse(rawText) as { candidates: { content: { parts: { text: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const adminSecret = req.headers.get('x-admin-secret');
    const cronAuth = req.headers.get('authorization');
    const isAdmin = adminSecret === process.env.ADMIN_SECRET;
    const isCron = cronAuth === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAdmin && !isCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' }, { status: 500 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다' }, { status: 500 });
    }

    const body = await req.json() as { recipe?: Recipe };
    const recipe: Recipe = body.recipe ?? CRON_RECIPES[Math.floor(Math.random() * CRON_RECIPES.length)];

    const prompt = buildPrompt(recipe);
    const post = await callGemini(prompt);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO blog_posts (title, category, thumbnail, summary, body, author, tags, read_time, related_recipe_id, status, generated_by)
      VALUES (
        ${post.title as string},
        ${post.category as string},
        ${post.thumbnail as string},
        ${post.summary as string},
        ${post.body as string},
        ${post.author as string},
        ${post.tags as string[]},
        ${post.read_time as number},
        ${recipe.id},
        'published',
        'gemini-api'
      )
      RETURNING *
    `;
    return NextResponse.json({ post: rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Vercel Cron
export async function GET(req: NextRequest) {
  // 진단용: 인증 없이 라우트 상태 확인
  const cronAuth = req.headers.get('authorization');
  if (!cronAuth) {
    return NextResponse.json({
      status: 'route_ok',
      runtime: 'nodejs',
      hasGemini: !!process.env.GEMINI_API_KEY,
      hasDb: !!process.env.DATABASE_URL,
      hasAdmin: !!process.env.ADMIN_SECRET,
    });
  }
  try {
    if (cronAuth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const recipe = CRON_RECIPES[Math.floor(Math.random() * CRON_RECIPES.length)];
    const prompt = buildPrompt(recipe);
    const post = await callGemini(prompt);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO blog_posts (title, category, thumbnail, summary, body, author, tags, read_time, related_recipe_id, status, generated_by)
      VALUES (
        ${post.title as string}, ${post.category as string}, ${post.thumbnail as string},
        ${post.summary as string}, ${post.body as string}, ${post.author as string},
        ${post.tags as string[]}, ${post.read_time as number}, ${recipe.id}, 'published', 'cron'
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
