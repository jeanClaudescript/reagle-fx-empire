import { useCallback, useEffect, useState } from 'react'
import { BookOpen, GripVertical, RefreshCw, Sparkles, Trash2, Upload } from 'lucide-react'
import { educationApi, type EducationBook, type EducationSettings } from '@/services/api'
import { useAdminToast } from '@/admin/toast'
import { useAdminConfirm } from '@/admin/confirm'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminTextInput } from '@/components/admin/AdminInput'

export function EducationBooksEditor() {
  const { push } = useAdminToast()
  const { confirm } = useAdminConfirm()
  const [books, setBooks] = useState<EducationBook[]>([])
  const [settings, setSettings] = useState<EducationSettings | null>(null)
  const [progressRows, setProgressRows] = useState<
    Awaited<ReturnType<typeof educationApi.adminUserProgress>>['data']
  >([])
  const [loading, setLoading] = useState(true)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [booksRes, settingsRes, progressRes] = await Promise.all([
        educationApi.listBooks(),
        educationApi.adminSettings(),
        educationApi.adminUserProgress(),
      ])
      setBooks(booksRes.data)
      setSettings(settingsRes.data)
      setProgressRows(progressRes.data)
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to load education data', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    void load()
  }, [load])

  const uploadBook = async () => {
    if (!file || !title.trim()) return
    setUploadBusy(true)
    try {
      await educationApi.uploadBook(file, title.trim(), description.trim() || undefined)
      push('Book uploaded — lessons generated automatically', 'success')
      setTitle('')
      setDescription('')
      setFile(null)
      await load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setUploadBusy(false)
    }
  }

  const toggleAi = async () => {
    if (!settings) return
    try {
      const res = await educationApi.toggleAi(!settings.aiMode)
      setSettings((s) => (s ? { ...s, aiMode: res.data.aiMode } : s))
      push(res.data.aiMode ? 'AI mode enabled' : 'AI mode disabled — raw text only', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to toggle AI', 'error')
    }
  }

  const saveSettings = async (patch: Partial<EducationSettings>) => {
    try {
      const res = await educationApi.updateSettings(patch)
      setSettings(res.data)
      push('Lesson rules saved', 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to save settings', 'error')
    }
  }

  const moveBook = async (id: string, dir: -1 | 1) => {
    const idx = books.findIndex((b) => b.id === id)
    const target = idx + dir
    if (target < 0 || target >= books.length) return
    const ordered = books.slice()
    const [item] = ordered.splice(idx, 1)
    ordered.splice(target, 0, item)
    try {
      const res = await educationApi.reorderBooks(ordered.map((b) => b.id))
      setBooks(res.data)
    } catch (e) {
      push(e instanceof Error ? e.message : 'Reorder failed', 'error')
    }
  }

  const removeBook = async (book: EducationBook) => {
    const ok = await confirm({
      title: 'Delete book?',
      message: `"${book.title}" and all ${book.lessonCount} lessons will be removed.`,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      await educationApi.deleteBook(book.id)
      push('Book deleted', 'success')
      await load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Delete failed', 'error')
    }
  }

  const regenerate = async (book: EducationBook) => {
    try {
      push(`Regenerating lessons for "${book.title}"…`, 'info')
      const res = await educationApi.regenerateLessons(book.id)
      push(`${res.data.lessonCount} lessons generated`, 'success')
      await load()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Regeneration failed', 'error')
    }
  }

  if (loading) {
    return <p className="text-sm text-theme-muted">Loading daily lessons admin…</p>
  }

  return (
    <div className="admin-form-stack">
      <AdminCard>
        <div className="admin-card-body">
          <p className="admin-editor-card-intro">
            Upload forex books (PDF, TXT, EPUB). The system extracts text and splits into daily lessons — no AI
            required. Enable Gemini optionally to summarize and add quizzes.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-theme/40 bg-theme-surface/40 p-4">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div className="flex-1">
              <p className="font-semibold text-theme-primary">AI mode (Gemini)</p>
              <p className="text-sm text-theme-muted">
                {settings?.geminiConfigured
                  ? settings.aiMode
                    ? 'AI summaries and quizzes are active when lessons are generated.'
                    : 'Off — students see raw extracted text only.'
                  : 'Set GEMINI_API_KEY on Render to enable AI enhancement.'}
              </p>
            </div>
            <button
              type="button"
              className={`admin-btn ${settings?.aiMode ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
              onClick={() => void toggleAi()}
              disabled={!settings?.geminiConfigured}
            >
              {settings?.aiMode ? 'AI ON' : 'AI OFF'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="admin-field-label">Split mode</label>
              <select
                className="admin-input w-full"
                value={settings?.lessonSplitMode ?? 'words'}
                onChange={(e) =>
                  void saveSettings({ lessonSplitMode: e.target.value as 'chapter' | 'words' })
                }
              >
                <option value="words">Word-based (800–1200 words)</option>
                <option value="chapter">Chapter-based</option>
              </select>
            </div>
            <div>
              <label className="admin-field-label">Lessons per day</label>
              <AdminTextInput
                type="number"
                min={1}
                max={3}
                value={String(settings?.lessonsPerDay ?? 1)}
                onChange={(e) => void saveSettings({ lessonsPerDay: Number(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-lg font-bold text-theme-primary">Upload book</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="admin-field-label">Title</label>
              <AdminTextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Forex fundamentals" />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-field-label">Description</label>
              <AdminTextInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional summary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-field-label">File (PDF, TXT, EPUB)</label>
              <input
                type="file"
                accept=".pdf,.txt,.epub,application/pdf,text/plain,application/epub+zip"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary mt-4"
            disabled={uploadBusy || !file || !title.trim()}
            onClick={() => void uploadBook()}
          >
            <Upload className="h-4 w-4" />
            {uploadBusy ? 'Processing…' : 'Upload & generate lessons'}
          </button>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-lg font-bold text-theme-primary">Books & rotation order</h3>
          <p className="mt-1 text-sm text-theme-muted">
            Day 1 → Book 1 Lesson 1, Day 2 → Book 2 Lesson 1, Day 3 → Book 1 Lesson 2…
          </p>
          {books.length === 0 ? (
            <p className="mt-4 text-sm text-theme-muted">No books yet — upload your first forex guide above.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {books.map((book, idx) => (
                <li
                  key={book.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-theme/30 bg-theme-surface/30 p-3"
                >
                  <GripVertical className="h-4 w-4 text-theme-muted" />
                  <BookOpen className="h-5 w-5 text-sky-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-theme-primary">{book.title}</p>
                    <p className="text-xs text-theme-muted">
                      {book.lessonCount} lessons · {book.fileType.toUpperCase()}
                      {!book.enabled ? ' · hidden' : ''}
                    </p>
                  </div>
                  <div className="admin-editor-actions w-auto max-w-full shrink-0">
                    <button type="button" className="admin-btn admin-btn--ghost text-xs" onClick={() => void moveBook(book.id, -1)} disabled={idx === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost text-xs"
                      onClick={() => void moveBook(book.id, 1)}
                      disabled={idx === books.length - 1}
                    >
                      ↓
                    </button>
                    <button type="button" className="admin-btn admin-btn--ghost text-xs" onClick={() => void regenerate(book)}>
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost text-xs"
                      onClick={() =>
                        void educationApi
                          .updateBook(book.id, { enabled: !book.enabled })
                          .then(() => load())
                      }
                    >
                      {book.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" className="admin-btn admin-btn--danger text-xs" onClick={() => void removeBook(book)}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="admin-card-body">
          <h3 className="font-display text-lg font-bold text-theme-primary">Student progress</h3>
          {progressRows.length === 0 ? (
            <p className="mt-3 text-sm text-theme-muted">No student progress yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-theme-muted">
                    <th className="pb-2 pr-4">Student</th>
                    <th className="pb-2 pr-4">Completed</th>
                    <th className="pb-2 pr-4">Streak</th>
                    <th className="pb-2">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {progressRows.map((row) => (
                    <tr key={row.userId} className="border-t border-theme/20">
                      <td className="py-2 pr-4">{row.name || row.phone || row.email || row.userId}</td>
                      <td className="py-2 pr-4">{row.totalCompleted}</td>
                      <td className="py-2 pr-4">{row.streakCount} days</td>
                      <td className="py-2">{new Date(row.startedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}
