import { useCallback, useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Flame, Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { educationApi, type EducationProgress, type TodayLessonPayload } from '@/services/api'

type Tab = 'today' | 'progress'

export function VipDailyLessonPanel() {
  const { t } = useLanguage()
  const dl = t.dailyLessons
  const [tab, setTab] = useState<Tab>('today')
  const [today, setToday] = useState<TodayLessonPayload | null>(null)
  const [progress, setProgress] = useState<EducationProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [todayRes, progressRes] = await Promise.all([
        educationApi.todayLesson(),
        educationApi.progress(),
      ])
      setToday(todayRes.data)
      setProgress(progressRes.data)
    } catch {
      setToday(null)
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const complete = async () => {
    if (!today?.lesson || today.completed) return
    setCompleting(true)
    try {
      await educationApi.completeLesson(today.lesson.id)
      await load()
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="vip-lesson-loading">
        <Loader2 className="h-6 w-6 animate-spin text-theme-muted" />
        <span>{dl.loading}</span>
      </div>
    )
  }

  return (
    <div className="vip-lessons">
      <div className="vip-lessons__tabs">
        <button
          type="button"
          className={`vip-lessons__tab ${tab === 'today' ? 'vip-lessons__tab--active' : ''}`}
          onClick={() => setTab('today')}
        >
          {dl.todayTab}
        </button>
        <button
          type="button"
          className={`vip-lessons__tab ${tab === 'progress' ? 'vip-lessons__tab--active' : ''}`}
          onClick={() => setTab('progress')}
        >
          {dl.progressTab}
        </button>
      </div>

      {tab === 'today' ? (
        <div className="vip-lesson-card">
          <div className="vip-lesson-card__meta">
            <span className="vip-lesson-card__date">{today?.date}</span>
            {today && today.streakCount > 0 ? (
              <span className="vip-lesson-streak">
                <Flame className="h-4 w-4" />
                {dl.streak.replace('{n}', String(today.streakCount))}
              </span>
            ) : null}
            {today?.aiMode ? <span className="vip-lesson-ai-badge">{dl.aiEnhanced}</span> : null}
          </div>

          {!today?.lesson ? (
            <p className="text-sm text-theme-muted">{dl.noLesson}</p>
          ) : (
            <>
              <div className="vip-lesson-card__book">
                <BookOpen className="h-5 w-5 text-sky-400" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-theme-muted">{today.book?.title}</p>
                  <h3 className="font-display text-xl font-bold text-theme-primary">{today.lesson.title}</h3>
                </div>
              </div>

              <div className="vip-lesson-content">
                {today.lesson.content.split('\n').map((para, i) =>
                  para.trim() ? (
                    <p key={i} className="mb-3 text-sm leading-relaxed text-theme-muted">
                      {para}
                    </p>
                  ) : null,
                )}
              </div>

              {today.lesson.aiQuiz && today.lesson.aiQuiz.length > 0 ? (
                <div className="vip-lesson-quiz">
                  <h4 className="mb-3 font-semibold text-theme-primary">{dl.quizTitle}</h4>
                  {today.lesson.aiQuiz.map((q, qi) => (
                    <div key={qi} className="mb-4 rounded-xl border border-theme/30 p-3">
                      <p className="mb-2 text-sm font-medium text-theme-primary">{q.question}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            type="button"
                            className={`vip-lesson-quiz__opt ${
                              quizAnswers[qi] === oi
                                ? oi === q.answerIndex
                                  ? 'vip-lesson-quiz__opt--correct'
                                  : 'vip-lesson-quiz__opt--wrong'
                                : ''
                            }`}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {today.completed ? (
                <div className="vip-lesson-done">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  {dl.completed}
                </div>
              ) : (
                <button
                  type="button"
                  className="vip-btn vip-btn--primary mt-4"
                  disabled={completing}
                  onClick={() => void complete()}
                >
                  {completing ? dl.completing : dl.markComplete}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="vip-lesson-progress">
          <div className="vip-lesson-stats">
            <div>
              <p className="text-xs text-theme-muted">{dl.totalCompleted}</p>
              <p className="text-2xl font-bold text-theme-primary">{progress?.state.totalCompleted ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-theme-muted">{dl.currentStreak}</p>
              <p className="text-2xl font-bold text-amber-400">{progress?.state.streakCount ?? 0}</p>
            </div>
          </div>

          {(progress?.books ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-theme-muted">{dl.noProgress}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {progress?.books.map((book) => (
                <li key={book.bookId} className="vip-lesson-progress__row">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-theme-primary">{book.title}</span>
                    <span className="text-xs text-theme-muted">
                      {book.completedLessons}/{book.totalLessons}
                    </span>
                  </div>
                  <div className="vip-lesson-progress__bar">
                    <div className="vip-lesson-progress__fill" style={{ width: `${book.percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
