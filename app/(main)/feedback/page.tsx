'use client'
import { useState, useEffect, useCallback } from 'react'

const SERVICE_NAME = 'FlavorSync'
const SERVICE_DESC = '냉장고 재료 기반 레시피 플랫폼에 대한 의견을 남겨주세요.'
const API_BASE = '/api/feedback'

function makeCaptcha(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return Math.random() > 0.5
    ? { question: `${a} + ${b}`, answer: a + b }
    : { question: `${a + b} - ${b}`, answer: a + b - b }
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-2xl transition-colors ${(hover || value) >= n ? 'text-yellow-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>
          ★
        </button>
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [captcha, setCaptcha] = useState(makeCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitOk, setSubmitOk] = useState(false)

  const load = useCallback(async (pg: number) => {
    setLoading(true)
    try {
      const data = await (await fetch(`${API_BASE}?page=${pg}`, { cache: 'no-store' })).json()
      setPosts(data.rows ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, content, rating: rating || null, captchaQuestion: captcha.question, captchaAnswer: Number(captchaAnswer), honeypot }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error ?? '오류가 발생했습니다.'); return }
      setSubmitOk(true)
      setContent(''); setNickname(''); setRating(0); setCaptchaAnswer(''); setCaptcha(makeCaptcha())
      setTimeout(() => { setSubmitOk(false); setShowForm(false); load(1); setPage(1) }, 1500)
    } finally { setSubmitting(false) }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">💬 {SERVICE_NAME} 의견 게시판</h1>
          <p className="text-sm text-gray-500 mt-1">{SERVICE_DESC} 비회원 익명 작성 가능합니다.</p>
        </div>

        <div className="flex justify-end mb-4">
          <button onClick={() => setShowForm(v => !v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${showForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {showForm ? '✕ 닫기' : '✏️ 의견 작성'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-5 space-y-4">
            <h2 className="font-semibold text-gray-900">의견 작성</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">별점 <span className="text-gray-400 font-normal">(선택)</span></label>
              <Stars value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">닉네임 <span className="text-gray-400 font-normal">(선택)</span></label>
              <input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={30} placeholder="익명"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">내용 <span className="text-gray-400 font-normal">(5~1000자)</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} maxLength={1000} required
                placeholder="서비스 사용 후기, 개선 제안, 버그 제보 등 자유롭게 남겨주세요."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              <div className="text-right text-xs text-gray-400 mt-0.5">{content.length}/1000</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">자동 입력 방지: <span className="font-mono font-bold text-gray-900">{captcha.question} = ?</span></label>
              <div className="flex items-center gap-2">
                <input value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} required type="number" placeholder="답"
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" onClick={() => { setCaptcha(makeCaptcha()); setCaptchaAnswer('') }}
                  className="text-xs text-gray-400 hover:text-gray-600">🔄 새 문제</button>
              </div>
            </div>
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
            </div>
            {submitError && <p className="text-sm text-red-500">{submitError}</p>}
            {submitOk && <p className="text-sm text-green-600 font-medium">✓ 의견이 등록되었습니다!</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting || !content.trim() || !captchaAnswer}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? '등록 중...' : '등록'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">취소</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-3xl mb-3">💬</p><p>아직 의견이 없습니다.</p></div>
        ) : (
          <div className="space-y-3">
            {posts.map((p: any) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {p.rating && <Stars value={p.rating} />}
                  <span className="text-sm font-medium text-gray-800">{p.nickname || '익명'}</span>
                  <span className="ml-auto text-xs text-gray-400">{timeAgo(p.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← 이전</button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">다음 →</button>
          </div>
        )}
      </div>
    </div>
  )
}
