import { useCallback, useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronLeft, Flame, Loader2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import {
  educationApi,
  type EducationLesson,
  type EducationProgress,
  type LessonEmptyReason,
  type LessonHistoryItem,
  type TodayLessonPayload,
} from '@/services/api'

type Tab = 'today' | 'history' | 'progress'

type LessonViewProps = {
  lesson: EducationLesson
  bookTitle?: string
  dateLabel?: string
  completed?: boolean
  aiMode?: boolean
  streakCount?: number
  showComplete?: boolean
  completing?: boolean
  onComplete?: () => void
  quizAnswers: Record<number, number>
  onQuizAnswer: (qi: number, oi: number) => void
}

function emptyMessage(reason: LessonEmptyReason | undefined, dl: ReturnType<typeof useLanguage>['t']['dailyLessons']) {
  if (reason === 'disabled') return dl.emptyDisabled
  if (reason === 'no_books' || reason === 'no_lessons') return dl.emptyNoBooks
  if (reason === 'finished') return dl.emptyFinished
  return dl.noLesson
}

function LessonView({
  lesson,
  bookTitle,
  dateLabel,
  completed,
  aiMode,
  streakCount,
  showComplete,
  completing,
  onComplete,
  quizAnswers,
  onQuizAnswer,
}: LessonViewProps) {
  const { t } = useLanguage()
  const dl = t.dailyLessons

  return (
    <>
      <div className="vip-lesson-card__meta">
        {dateLabel ? <span className="vip-lesson-card__date">{dateLabel}</span> : null}
        {streakCount && streakCount > 0 ? (
          <span className="vip-lesson-streak">
            <Flame className="h-4 w-4" />
            {dl.streak.replace('{n}', String(streakCount))}
          </span>
        ) : null}
        {aiMode ? <span className="vip-lesson-ai-badge">{dl.aiEnhanced}</span> : null}
      </div>

      <div className="vip-lesson-card__book">
        <BookOpen className="h-5 w-5 shrink-0 text-sky-400" />
        <div className="min-w-0">
          {bookTitle ? (
            <p className="text-xs uppercase tracking-wide text-theme-muted">{bookTitle}</p>
          ) : lesson.bookTitle ? (
            <p className="text-xs uppercase tracking-wide text-theme-muted">{lesson.bookTitle}</p>
          ) : null}
          <h3 className="font-display text-xl font-bold text-theme-primary">{lesson.title}</h3>
          {lesson.subtitle ? (
            <p className="vip-lesson-card__subtitle">{lesson.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="vip-lesson-content">
        {lesson.content.split('\n').map((para, i) =>
          para.trim() ? (
            <p key={i} className="mb-3 text-sm leading-relaxed text-theme-muted">
              {para}
            </p>
          ) : null,
        )}
      </div>

      {lesson.aiQuiz && lesson.aiQuiz.length > 0 ? (
        <div className="vip-lesson-quiz">
          <h4 className="mb-3 font-semibold text-theme-primary">{dl.quizTitle}</h4>
          {lesson.aiQuiz.map((q, qi) => (
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
                    onClick={() => onQuizAnswer(qi, oi)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showComplete ? (
        completed ? (
          <div className="vip-lesson-done">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            {dl.completed}
          </div>
        ) : (
          <button
            type="button"
            className="vip-btn vip-btn--primary mt-4"
            disabled={completing}
            onClick={onComplete}
          >
            {completing ? dl.completing : dl.markComplete}
          </button>
        )
      ) : completed ? (
        <div className="vip-lesson-done">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {dl.completed}
        </div>
      ) : null}
    </>
  )
}

export function VipDailyLessonPanel() {
  const { t } = useLanguage()
  const dl = t.dailyLessons
  const [tab, setTab] = useState<Tab>('today')
  const [today, setToday] = useState<TodayLessonPayload | null>(null)
  const [history, setHistory] = useState<LessonHistoryItem[]>([])
  const [progress, setProgress] = useState<EducationProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [selectedDay, setSelectedDay] = useState<LessonHistoryItem | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [todayRes, progressRes, historyRes] = await Promise.all([
        educationApi.todayLesson(),
        educationApi.progress(),
        educationApi.lessonHistory(),
      ])
      setToday(todayRes.data)
      setProgress(progressRes.data)
      setHistory(historyRes.data)
    } catch (e) {
      setToday(null)
      setProgress(null)
      setHistory([])
      setLoadError(e instanceof Error ? e.message : dl.loadError)
    } finally {
      setLoading(false)
    }
  }, [dl.loadError])

  useEffect(() => {
    void load()
  }, [load])

  const openHistoryItem = async (item: LessonHistoryItem) => {
    if (item.dayIndex === today?.dayIndex && today.lesson) {
      setSelectedDay(item)
      setTab('today')
      return
    }
    setHistoryLoading(true)
    try {
      const res = await educationApi.lessonForDay(item.dayIndex)
      setSelectedDay({
        dayIndex: res.data.dayIndex,
        assignedDate: res.data.date,
        completed: res.data.completed,
        lesson: res.data.lesson,
        book: res.data.book!,
      })
      setTab('history')
    } catch {
      setSelectedDay(item)
      setTab('history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const complete = async (lessonId: string) => {
    setCompleting(true)
    try {
      await educationApi.completeLesson(lessonId)
      setQuizAnswers({})
      await load()
      setSelectedDay(null)
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

  if (loadError && !today) {
    return (
      <div className="vip-lesson-card">
        <p className="text-sm text-red-400">{loadError}</p>
        <button type="button" className="vip-btn vip-btn--secondary mt-4" onClick={() => void load()}>
          {dl.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="vip-lessons">
      <div className="vip-lessons__tabs">
        <button
          type="button"
          className={`vip-lessons__tab ${tab === 'today' ? 'vip-lessons__tab--active' : ''}`}
          onClick={() => {
            setSelectedDay(null)
            setTab('today')
          }}
        >
          {dl.todayTab}
        </button>
        <button
          type="button"
          className={`vip-lessons__tab ${tab === 'history' ? 'vip-lessons__tab--active' : ''}`}
          onClick={() => setTab('history')}
        >
          {dl.historyTab}
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
          {!today?.lesson ? (
            <p className="text-sm text-theme-muted">{emptyMessage(today?.emptyReason, dl)}</p>
          ) : (
            <LessonView
              lesson={today.lesson}
              bookTitle={today.book?.title}
              dateLabel={today.date}
              completed={today.completed}
              aiMode={today.aiMode}
              streakCount={today.streakCount}
              showComplete={!today.completed}
              completing={completing}
              onComplete={() => void complete(today.lesson!.id)}
              quizAnswers={quizAnswers}
              onQuizAnswer={(qi, oi) => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
            />
          )}
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="vip-lesson-history">
          {historyLoading ? (
            <div className="vip-lesson-loading">
              <Loader2 className="h-5 w-5 animate-spin text-theme-muted" />
            </div>
          ) : selectedDay ? (
            <div className="vip-lesson-card">
              <button
                type="button"
                className="vip-lesson-history__back mb-3 flex items-center gap-1 text-sm text-theme-accent"
                onClick={() => setSelectedDay(null)}
              >
                <ChevronLeft size={16} />
                {dl.backToList}
              </button>
              <LessonView
                lesson={selectedDay.lesson}
                bookTitle={selectedDay.book.title}
                dateLabel={selectedDay.assignedDate}
                completed={selectedDay.completed}
                aiMode={today?.aiMode}
                streakCount={today?.streakCount}
                showComplete={selectedDay.dayIndex === today?.dayIndex && !selectedDay.completed}
                completing={completing}
                onComplete={() => void complete(selectedDay.lesson.id)}
                quizAnswers={quizAnswers}
                onQuizAnswer={(qi, oi) => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
              />
            </div>
          ) : (
            <>
              {history.length === 0 ? (
                <p className="text-sm text-theme-muted">{dl.noHistory}</p>
              ) : (
                <ul className="vip-lesson-history__list">
                  {history.map((item) => (
                    <li key={`${item.dayIndex}-${item.lesson.id}`}>
                      <button
                        type="button"
                        className="vip-lesson-history__item"
                        onClick={() => void openHistoryItem(item)}
                      >
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs text-theme-muted">{item.assignedDate}</p>
                          <p className="font-semibold text-theme-primary">{item.lesson.title}</p>
                          {item.lesson.subtitle ? (
                            <p className="vip-lesson-history__subtitle">{item.lesson.subtitle}</p>
                          ) : null}
                        </div>
                        {item.completed ? (
                          <span className="vip-lesson-history__done">{dl.doneBadge}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : null}

      {tab === 'progress' ? (
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
      ) : null}
    </div>
  )
}
