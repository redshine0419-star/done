# 플레이버 싱크 (FlavorSync) — 세션 인수인계 문서

## 프로젝트 개요

한국 가정식 요리 앱. 냉장고 재료 기반 레시피 추천, 2구 병렬 조리 타이머, 블로그 자동 생성 기능을 제공하는 Next.js PWA.

- **도메인**: https://flavorsync.me (KO), https://en.flavorsync.me (EN)
- **저장소**: redshine0419-star/done
- **개발 브랜치**: `claude/review-gemini-content-be8XL` (작업 후 main에 push)
- **실제 배포 브랜치**: `main` (Vercel 자동 배포)

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
| `ADMIN_SECRET` | 관리자 화면 비밀번호 (`red615754!@#`) |
| `CRON_SECRET` | Vercel Cron 인증 토큰 |
| `NEXTAUTH_SECRET` | next-auth 세션 암호화 키 |
| `NEXTAUTH_URL` | next-auth 콜백 URL (`https://flavorsync.me`) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |

---

## DB 테이블 구조

```sql
-- 블로그 포스트
blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  thumbnail TEXT,
  summary TEXT,
  body TEXT,          -- 마크다운
  author TEXT,        -- nullable (AI 생성 글은 null)
  published_at TIMESTAMPTZ,
  tags TEXT[],
  read_time INTEGER,
  related_recipe_id TEXT,
  status TEXT,        -- 'draft' | 'published'
  generated_by TEXT,  -- 'gemini-api' | 'cron' | null
  updated_at TIMESTAMPTZ
)

-- 위키 등록 레시피
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
  status TEXT,        -- 'draft' | 'published' | 'rejected'
  submitted_by TEXT,
  author_id TEXT,     -- Google OAuth user ID
  author_name TEXT,
  forked_from TEXT,   -- 포크 원본 레시피 ID
  like_count INTEGER,
  made_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 레시피 재료
recipe_ingredients (
  id UUID PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT,
  name TEXT,
  base_amount NUMERIC,
  unit TEXT,
  type TEXT,          -- 'main' | 'seasoning' | 'garnish'
  sort_order INTEGER
)

-- 레시피 조리 단계
recipe_steps (
  id UUID PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  burner INTEGER,     -- 1 | 2 | null
  action TEXT,
  duration_sec INTEGER,
  description TEXT,
  sort_order INTEGER
)

-- 유저 즐겨찾기
user_favorites (
  user_id TEXT,
  recipe_id TEXT,
  PRIMARY KEY (user_id, recipe_id)
)

-- 유저 냉장고 아이템
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

## 주요 파일 구조

```
app/
  layout.tsx                    # 루트 레이아웃 (AdSense, GA, SessionProvider)
  providers.tsx                 # SessionProvider + AppProvider 래퍼
  (main)/
    page.tsx                    # 홈 (냉장고 기반 추천)
    recipe/page.tsx             # 레시피 목록
    recipe/submit/page.tsx      # 위키 레시피 등록
    blog/page.tsx               # 블로그 목록
    fridge/page.tsx             # 냉장고 관리
    cook/page.tsx               # 조리 타이머
    taste/page.tsx              # 미각 프로파일
    admin/page.tsx              # 관리자 화면 (비밀번호 보호)
  api/
    blog-posts/route.ts         # GET: 블로그 목록 (status 파라미터)
    blog-posts/[id]/route.ts    # PUT/DELETE/PATCH: 블로그 수정/삭제/상태변경
    recipes/route.ts            # GET/POST: 레시피 목록/등록
    recipes/[id]/route.ts       # PUT/DELETE/PATCH: 레시피 수정/삭제/상태변경
    generate-blog-post/route.ts # POST: Gemini 블로그 생성 / GET: Vercel Cron
    analyze-recipe-video/route.ts # POST: YouTube URL → Gemini 레시피 분석
    favorites/route.ts          # GET/POST: 유저 즐겨찾기 (로그인 필요)
    fridge/route.ts             # GET/PUT: 유저 냉장고 DB 동기화 (로그인 필요)
    publish-post/route.ts       # POST: 블로그 draft → published
    ocr-ingredients/route.ts    # POST: 영수증 OCR (Gemini Vision)
    admin/fix-blog-links/route.ts # GET/POST: 블로그 레시피 링크 자동수정
  blog/[slug]/page.tsx          # 블로그 상세 (SSR)
  recipe/[id]/page.tsx          # 레시피 상세 (SSR)
  auth/[...nextauth]/route.ts   # next-auth 핸들러

src/
  context/AppContext.tsx        # 전역 상태 (냉장고, 즐겨찾기, 조리세션)
  hooks/
    useRecipes.ts               # mockRecipes + DB 레시피 합산
    useBlogPosts.ts             # 블로그 포스트 훅
  data/
    mockRecipes.ts              # 하드코딩 레시피 10개 (r1~r10)
    mockRecipesExtra.ts         # 추가 레시피
  lib/auth.ts                   # next-auth authOptions
  types/index.ts                # TypeScript 타입 정의
  screens/AdminScreen.tsx       # 관리자 UI (블로그 생성/관리, 레시피 관리)
  components/auth/LoginButton.tsx # Google 로그인 버튼
```

---

## API 인증 방식

```
관리자 API: x-admin-secret: {ADMIN_SECRET} 헤더
Vercel Cron: Authorization: Bearer {CRON_SECRET} 헤더
로그인 필요 API: next-auth 세션 (getServerSession)
```

---

## 관리자 화면 (`/admin`)

비밀번호: `ADMIN_SECRET` 환경변수 값

**탭 구성:**
1. **블로그 생성** — 레시피 선택 → Gemini로 블로그 글 생성 (즉시 published)
2. **블로그 관리** — 전체 글 목록, 수정/삭제/공개·비공개 토글, 🔗 링크 자동수정 버튼
3. **레시피 관리** — 위키 등록 레시피 목록, 승인/거절/수정/삭제

---

## Vercel Cron

`vercel.json`에 설정. 매일 09:00 UTC(한국시간 18:00) 자동 블로그 생성.

```json
{ "crons": [{ "path": "/api/generate-blog-post", "schedule": "0 9 * * *" }] }
```

Vercel Pro 이상에서만 동작. 로그는 Vercel 대시보드 → Cron Jobs 탭에서 확인.

---

## 레시피 데이터 구조

**mockRecipes (하드코딩, DB 없음):**
- `r1`~`r10`: 기본 레시피 (combo 3개: r2, r4, r9 / single 7개)
- extra1~extra5: 추가 단품

**DB 레시피 (위키 등록):**
- `useRecipes()` 훅이 mockRecipes + DB published 레시피를 합산해서 반환
- 포크 레시피: `forked_from` 필드, ID에 알파벳 suffix ((A), (B)...)

---

## 인증/로그인

- Google OAuth (next-auth v4)
- 로그인 안 하면: 즐겨찾기, 레시피 수정 불가 (로그인 안내 표시)
- 냉장고: 로그인 시 DB 동기화, 비로그인 시 localStorage + 경고 배너

---

## 주의사항

- DB 컬럼 추가는 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`로 lazy migration 처리
- Gemini 모델: `gemini-2.5-flash` (2.0-flash는 deprecated)
- `maxOutputTokens: 4096` 필요 (한국어 JSON 생성 시 토큰 많이 사용)
- next-auth `session.user.id`는 `token.sub` (Google OAuth sub)
- 블로그 `author` 컬럼은 nullable (AI 생성 글)
- Google 프로필 이미지: `next.config.ts`에 `lh3.googleusercontent.com` remotePatterns 등록됨
