import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

interface Recipe {
  id: string;
  title: string;
  story: string;
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { burner: number; label: string; durationMin: number }[];
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
    steps: [{ burner: 1, label: '찌개 끓이기', durationMin: 20 }, { burner: 2, label: '계란말이', durationMin: 8 }],
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
    steps: [{ burner: 1, label: '제육볶음', durationMin: 15 }, { burner: 2, label: '계란찜', durationMin: 12 }],
    servings: 2,
    isCombo: true,
  },
];

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

function buildPrompt(recipe: Recipe): string {
  const totalMin = recipe.steps.reduce((s, st) => Math.max(s, st.durationMin), 0);
  const ingredientList = recipe.ingredients.map(i => `${i.name} ${i.amount}${i.unit}`).join(', ');
  return `당신은 한국 푸드 매거진 수석 에디터입니다. 식품 과학, 문화적 맥락, 실용적 팁을 따뜻하고 친근한 어조로 담아냅니다.

다음 레시피 정보를 바탕으로 블로그 포스트 JSON을 생성해주세요.

레시피 정보:
- 이름: ${recipe.title}
- 소개: ${recipe.story}
- 재료: ${ingredientList}
- 조리 시간: 약 ${totalMin}분
- 계절: ${getSeason()}
- 인원: ${recipe.servings}인분

JSON 형식으로 아래 필드를 반환하세요 (마크다운 코드블록 없이 순수 JSON만):
{
  "title": "블로그 포스트 제목 (20자 이내, 호기심을 자극하는 제목)",
  "category": "요리팁 | 식재료이야기 | 건강식 | 시즌레시피 | 미각탐구 중 하나",
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);

  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
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
        'draft',
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
  try {
    const cronAuth = req.headers.get('authorization');
    if (cronAuth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const recipe = CRON_RECIPES[Math.floor(Math.random() * CRON_RECIPES.length)];
    const prompt = buildPrompt(recipe);
    const post = await callGemini(prompt);
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO blog_posts (title, category, thumbnail, summary, body, author, tags, read_time, related_recipe_id, status, generated_by)
      VALUES (
        ${post.title as string}, ${post.category as string}, ${post.thumbnail as string},
        ${post.summary as string}, ${post.body as string}, ${post.author as string},
        ${post.tags as string[]}, ${post.read_time as number}, ${recipe.id}, 'draft', 'cron'
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
