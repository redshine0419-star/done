import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const CLAUDE_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-admin-secret',
};

interface Recipe {
  id: string;
  title: string;
  story: string;
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { burner: number; label: string; durationMin: number }[];
  servings: number;
  isCombo: boolean;
  thumbnail: string;
}

interface BlogPost {
  title: string;
  category: string;
  thumbnail: string;
  summary: string;
  body: string;
  author: string;
  tags: string[];
  read_time: number;
  related_recipe_id?: string;
}

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

async function callClaude(prompt: string): Promise<BlogPost> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned) as BlogPost;
}

async function insertDraft(post: BlogPost, recipeId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      ...post,
      related_recipe_id: recipeId,
      status: 'draft',
      generated_by: 'claude-api',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert error ${res.status}: ${err}`);
  }

  const rows = await res.json() as Record<string, unknown>[];
  return rows[0];
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as { recipe?: Recipe; recipe_id?: string };

    // Accept either full recipe object or just recipe_id (for pg_cron)
    let recipe: Recipe | null = body.recipe ?? null;

    if (!recipe && body.recipe_id) {
      // Fetch recipe from Supabase recipes table (if stored there)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${body.recipe_id}&select=*`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });
      const rows = await res.json() as Recipe[];
      recipe = rows[0] ?? null;
    }

    if (!recipe) {
      return new Response(JSON.stringify({ error: 'recipe or recipe_id required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildPrompt(recipe);
    const post = await callClaude(prompt);
    const saved = await insertDraft(post, recipe.id);

    return new Response(JSON.stringify({ post: saved }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
