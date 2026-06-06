# 플레이버 싱크 (FlavorSync) — 관리 세션 인수인계 문서

이 문서는 **다른 저장소의 Claude Code 세션**에서 플레이버 싱크 서비스를 관리할 수 있도록 작성된 독립 문서입니다.

---

## 저장소 정보

- **GitHub**: `redshine0419-star/done`
- **배포**: Vercel (main 브랜치 자동 배포)
- **도메인**: https://flavorsync.me (KO), https://en.flavorsync.me (EN)
- **작업 시 push 브랜치**: `main`

코드 변경 시 GitHub MCP 도구(`mcp__github__*`)를 사용하거나, 저장소를 clone하여 작업 후 push합니다.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| DB | Neon PostgreSQL (`@neondatabase/serverless`) |
| Auth | next-auth v4 (Google OAuth) |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| PWA | @ducanh2912/next-pwa |
| 배포 | Vercel |

---

## 환경변수 (Vercel에 설정됨)

| 변수명 | 용도 |
|--------|------|
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 |
| `GEMINI_API_KEY` | Google Gemini API 키 |
| `ADMIN_SECRET` | 관리자 API 인증 (`x-admin-secret` 헤더) |
| `CRON_SECRET` | Vercel Cron 인증 (`Authorization: Bearer` 헤더) |
| `NEXTAUTH_SECRET` | next-auth 세션 암호화 키 |
| `NEXTAUTH_URL` | `https://flavorsync.me` |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |

---

## API 엔드포인트

### 블로그

```
GET  /api/blog-posts              — 공개 블로그 목록 (published만)
GET  /api/blog-posts?status=all   — 전체 목록 (x-admin-secret 필요)
GET  /api/blog-posts?status=draft — 초안 목록 (x-admin-secret 필요)
PUT  /api/blog-posts/[id]         — 수정 (x-admin-secret 필요)
DELETE /api/blog-posts/[id]       — 삭제 (x-admin-secret 필요)
PATCH /api/blog-posts/[id]        — 상태변경 body: {status: 'draft'|'published'}
POST /api/generate-blog-post      — Gemini 블로그 생성 (x-admin-secret 필요)
GET  /api/generate-blog-post      — Vercel Cron 엔드포인트
POST /api/publish-post            — draft → published body: {post_id}
GET  /api/admin/fix-blog-links    — 레시피 링크 자동수정 미리보기
POST /api/admin/fix-blog-links    — 레시피 링크 자동수정 적용
```

### 레시피

```
GET  /api/recipes                 — published 레시피 목록
GET  /api/recipes?status=all      — 전체 (x-admin-secret 필요)
POST /api/recipes                 — 위키 등록 (draft로 저장)
PUT  /api/recipes/[id]            — 수정 (x-admin-secret 필요)
DELETE /api/recipes/[id]          — 삭제 (x-admin-secret 필요)
PATCH /api/recipes/[id]           — 상태변경 body: {status: 'published'|'rejected'}
POST /api/analyze-recipe-video    — YouTube URL → Gemini 레시피 분석
```

### 유저 (로그인 필요, next-auth 세션)

```
GET  /api/favorites               — 즐겨찾기 목록
POST /api/favorites               — 즐겨찾기 토글 body: {recipe_id}
GET  /api/fridge                  — 냉장고 아이템
PUT  /api/fridge                  — 냉장고 전체 교체 body: {items: [...]}
POST /api/ocr-ingredients         — 영수증 OCR
```

---

## 주요 소스 파일 경로

```
app/layout.tsx                        루트 레이아웃 (AdSense, GA, SessionProvider)
app/providers.tsx                     SessionProvider + AppProvider
app/(main)/admin/page.tsx             관리자 페이지 진입점
app/api/blog-posts/route.ts           블로그 목록 API
app/api/blog-posts/[id]/route.ts      블로그 수정/삭제/상태변경
app/api/recipes/route.ts              레시피 목록/등록
app/api/recipes/[id]/route.ts         레시피 수정/삭제/상태변경
app/api/generate-blog-post/route.ts   Gemini 블로그 자동생성 + Cron
app/api/analyze-recipe-video/route.ts YouTube → 레시피 분석
app/api/favorites/route.ts            즐겨찾기
app/api/fridge/route.ts               냉장고 DB 동기화
app/api/admin/fix-blog-links/route.ts 레시피 링크 자동수정
app/blog/[slug]/page.tsx              블로그 상세 (SSR)
app/recipe/[id]/page.tsx              레시피 상세 (SSR)

src/context/AppContext.tsx            전역 상태 (냉장고, 즐겨찾기, 조리세션)
src/hooks/useRecipes.ts               mockRecipes + DB 레시피 합산 훅
src/data/mockRecipes.ts               하드코딩 레시피 (r1~r10)
src/data/mockRecipesExtra.ts          추가 레시피 (extra1~extra5)
src/lib/auth.ts                       next-auth authOptions
src/types/index.ts                    TypeScript 타입 정의
src/screens/AdminScreen.tsx           관리자 UI (3개 탭)
src/components/auth/LoginButton.tsx   Google 로그인 버튼
src/components/layout/NavBar.tsx      사이드바 + 하단 탭 네비게이션
vercel.json                           Cron 설정
next.config.ts                        PWA + remotePatterns 설정
```

---

## DB 테이블 구조

```sql
blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  thumbnail TEXT,
  summary TEXT,
  body TEXT,            -- 마크다운
  author TEXT,          -- nullable (AI 생성 글은 null)
  published_at TIMESTAMPTZ,
  tags TEXT[],
  read_time INTEGER,
  related_recipe_id TEXT,
  status TEXT,          -- 'draft' | 'published'
  generated_by TEXT,    -- 'gemini-api' | 'cron' | null
  updated_at TIMESTAMPTZ
)

recipes (
  id TEXT PRIMARY KEY,
  title TEXT,
  story TEXT,
  thumbnail TEXT,
  is_combo BOOLEAN,
  servings INTEGER,
  youtube_id TEXT,
  youtube_credit TEXT,
  parent_combo_id TEXT,
  status TEXT,          -- 'draft' | 'published' | 'rejected'
  submitted_by TEXT,
  author_id TEXT,       -- Google OAuth user ID
  author_name TEXT,
  forked_from TEXT,
  like_count INTEGER,
  made_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

recipe_ingredients (
  id UUID PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT,
  name TEXT,
  base_amount NUMERIC,
  unit TEXT,
  type TEXT,            -- 'main' | 'seasoning' | 'garnish'
  sort_order INTEGER
)

recipe_steps (
  id UUID PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  burner INTEGER,       -- 1 | 2 | null
  action TEXT,
  duration_sec INTEGER,
  description TEXT,
  sort_order INTEGER
)

user_favorites (
  user_id TEXT,
  recipe_id TEXT,
  PRIMARY KEY (user_id, recipe_id)
)

user_fridge_items (
  user_id TEXT,
  ingredient_id TEXT,
  name TEXT,
  amount NUMERIC,
  unit TEXT,
  expire_date TEXT,
  icon TEXT,
  registered_at TEXT,
  PRIMARY KEY (user_id, ingredient_id)
)
```

---

## 관리자 화면

URL: `https://flavorsync.me/admin`  
비밀번호: `ADMIN_SECRET` 환경변수 값

**탭 구성:**
1. **블로그 생성** — 레시피 선택 → Gemini 블로그 자동 생성 (즉시 published)
2. **블로그 관리** — 전체 글 수정/삭제/공개·비공개, 🔗 링크 자동수정
3. **레시피 관리** — 위키 등록 레시피 승인/거절/수정/삭제

---

## Vercel Cron

매일 09:00 UTC (한국시간 18:00) 자동 블로그 생성.  
Vercel Pro 이상 필요. 로그: Vercel 대시보드 → 프로젝트 → Cron Jobs 탭.

---

## 코딩 컨벤션 및 주의사항

1. **DB 컬럼 추가** — `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`로 lazy migration 처리 (운영 중 무중단)
2. **Gemini 모델** — `gemini-2.5-flash` 사용. `gemini-2.0-flash` 이하는 deprecated
3. **maxOutputTokens** — `4096` 이상 필요 (한국어 JSON 생성 시 토큰 많이 사용)
4. **next-auth 세션** — `session.user.id`는 `token.sub` (Google OAuth sub 값)
5. **레시피 데이터** — `useRecipes()` 훅이 `mockRecipes` + DB published 레시피를 합산 반환
6. **포크 레시피 ID** — 알파벳 suffix: `{원본id}_(A)`, `{원본id}_(B)` ...
7. **Google 프로필 이미지** — `next.config.ts`에 `lh3.googleusercontent.com` remotePatterns 등록됨
8. **tags 컬럼** — PostgreSQL `TEXT[]` 배열 타입. COALESCE 사용 시 별도 UPDATE 쿼리로 분리
9. **관리자 인증** — `x-admin-secret: {ADMIN_SECRET}` 헤더
10. **로그인 필요 기능** — 즐겨찾기, 레시피 수정(포크), 냉장고 DB 동기화

---

## TypeScript 핵심 타입

```typescript
interface Recipe {
  id: string;
  title: string;
  story: string;
  thumbnail: string;
  isCombo: boolean;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  youtube_id?: string;
  youtube_credit?: string;
  related_single_ids?: string[];
  parent_combo_id?: string;
  author_id?: string;
  author_name?: string;
}

interface BlogPost {
  id: string;
  title: string;
  category: '요리팁' | '식재료이야기' | '건강식' | '시즌레시피' | '미각탐구';
  thumbnail: string;
  summary: string;
  body: string;           // 마크다운
  author: string;
  published_at: string;
  tags: string[];
  readTime: number;
  related_recipe_id?: string;
}

interface FridgeItem {
  ingredient_id: string;
  name: string;
  amount: number;
  unit: string;
  expire_date: string;    // ISO: "2026-05-21"
  icon: string;
  registered_at: string;
}
```
