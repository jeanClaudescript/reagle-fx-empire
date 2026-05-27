import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { CMSData } from './types'
import { DEFAULT_CMS_DATA } from './defaultCms'
import {
  normalizeCmsData,
  loadDraftCMS,
  loadHistory,
  loadPublishedCMS,
  saveDraftCMS,
  saveHistory,
  savePublishedCMS,
  CmsStorageError,
  type CMSHistoryEntry,
} from './storage'
import { buildSectionStates, type SectionStateMap } from './sectionState'
import { mergeSectionIntoPublished } from './sectionPublish'
import {
  CONTENT_SECTIONS,
  pickSectionData,
  validatePublish,
  validateSection,
  type ContentSectionId,
  type PublishValidationResult,
  type ValidationIssue,
} from './validation'
import { cmsApi } from '@/services/api'

export type CmsRenderSource = 'published' | 'draft'

interface CmsContextValue {
  isHydrated: boolean
  renderSource: CmsRenderSource
  setRenderSource: (source: CmsRenderSource) => void
  previewLock: CmsRenderSource | null
  setPreviewLock: (source: CmsRenderSource | null) => void
  effectiveRenderSource: CmsRenderSource
  published: CMSData
  draft: CMSData
  activeContent: CMSData
  history: CMSHistoryEntry[]
  hasDraftChanges: boolean
  sectionStates: SectionStateMap
  validationIssues: ValidationIssue[]
  setValidationIssues: (issues: ValidationIssue[]) => void
  setDraft: (next: CMSData) => void
  updateDraft: (fn: (prev: CMSData) => CMSData) => void
  publish: () => void
  publishValidated: () => PublishValidationResult
  publishSectionValidated: (section: ContentSectionId) => PublishValidationResult
  undo: () => void
  resetDraft: () => void
}

const CmsContext = createContext<CmsContextValue | null>(null)

const SECTION_META_KEY = 'reagle-cms-section-updated'

function loadSectionMeta(): Partial<Record<ContentSectionId, number>> {
  try {
    const raw = localStorage.getItem(SECTION_META_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<Record<ContentSectionId, number>>
  } catch {
    return {}
  }
}

function saveSectionMeta(meta: Partial<Record<ContentSectionId, number>>) {
  localStorage.setItem(SECTION_META_KEY, JSON.stringify(meta))
}

function touchChangedSections(
  prev: CMSData,
  next: CMSData,
  meta: Partial<Record<ContentSectionId, number>>,
) {
  const now = Date.now()
  const updated = { ...meta }
  for (const section of CONTENT_SECTIONS) {
    if (JSON.stringify(pickSectionData(section, prev)) !== JSON.stringify(pickSectionData(section, next))) {
      updated[section] = now
    }
  }
  saveSectionMeta(updated)
  return updated
}

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [renderSource, setRenderSourceState] = useState<CmsRenderSource>('published')
  const [previewLock, setPreviewLockState] = useState<CmsRenderSource | null>(null)
  const [published, setPublished] = useState<CMSData>(DEFAULT_CMS_DATA)
  const [draft, setDraftState] = useState<CMSData>(DEFAULT_CMS_DATA)
  const [history, setHistory] = useState<CMSHistoryEntry[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [sectionMeta, setSectionMeta] = useState<Partial<Record<ContentSectionId, number>>>({})
  const prevDraftRef = useRef<CMSData>(DEFAULT_CMS_DATA)
  const draftSyncTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const hydrate = async () => {
      const localPublished = normalizeCmsData(loadPublishedCMS())
      const localDraft = normalizeCmsData(loadDraftCMS())
      const h = loadHistory()
      const meta = loadSectionMeta()

      setPublished(localPublished)
      setDraftState(localDraft)
      prevDraftRef.current = localDraft
      setHistory(h)
      setSectionMeta(meta)
      setIsHydrated(true)

      try {
        const [publishedRes, draftRes] = await Promise.all([cmsApi.getPublished(), cmsApi.getDraft()])
        const remotePublished = normalizeCmsData(publishedRes.data as CMSData)
        const remoteDraft = normalizeCmsData(draftRes.data as CMSData)
        setPublished(remotePublished)
        setDraftState(remoteDraft)
        prevDraftRef.current = remoteDraft
        savePublishedCMS(remotePublished)
        saveDraftCMS(remoteDraft)
      } catch {
        // Backend not reachable: keep localStorage mode.
      }
    }
    void hydrate()
  }, [])

  useEffect(() => {
    return () => {
      if (draftSyncTimeoutRef.current) {
        window.clearTimeout(draftSyncTimeoutRef.current)
      }
    }
  }, [])

  const effectiveRenderSource: CmsRenderSource = previewLock ?? renderSource

  const activeContent = effectiveRenderSource === 'draft' ? draft : published

  const hasDraftChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(published),
    [draft, published],
  )

  const sectionStates = useMemo(
    () => buildSectionStates(draft, published, sectionMeta),
    [draft, published, sectionMeta],
  )

  const setPreviewLock = useCallback((source: CmsRenderSource | null) => {
    setPreviewLockState(source)
  }, [])

  const setDraft = useCallback((next: CMSData) => {
    setDraftState((prev) => {
      setSectionMeta((meta) => touchChangedSections(prev, next, meta))
      prevDraftRef.current = next
      return next
    })
    saveDraftCMS(next)
    setRenderSourceState('draft')
    setValidationIssues([])
  }, [])

  const updateDraft = useCallback((fn: (prev: CMSData) => CMSData) => {
    setDraftState((prev) => {
      const next = fn(prev)
      setSectionMeta((meta) => touchChangedSections(prev, next, meta))
      prevDraftRef.current = next
      try {
        saveDraftCMS(next)
      } catch (err) {
        if (!(err instanceof CmsStorageError)) throw err
        console.error(err)
      }
      return next
    })
    setRenderSourceState('draft')
    setValidationIssues([])

    if (draftSyncTimeoutRef.current) {
      window.clearTimeout(draftSyncTimeoutRef.current)
    }
    draftSyncTimeoutRef.current = window.setTimeout(() => {
      void cmsApi.putDraft(prevDraftRef.current).catch(() => {
        // Keep local mode if API fails.
      })
    }, 450)
  }, [])

  const setRenderSource = useCallback((source: CmsRenderSource) => {
    setRenderSourceState(source)
  }, [])

  const publish = useCallback(() => {
    const entry: CMSHistoryEntry = {
      id: `hist-${Math.random().toString(16).slice(2)}`,
      at: Date.now(),
      data: published,
    }
    const nextHistory = [entry, ...history].slice(0, 20)
    setHistory(nextHistory)
    saveHistory(nextHistory)

    const nextPublished = normalizeCmsData(draft)
    setPublished(nextPublished)
    savePublishedCMS(nextPublished)

    setDraftState(nextPublished)
    saveDraftCMS(nextPublished)
    prevDraftRef.current = nextPublished

    setRenderSourceState('published')
    setValidationIssues([])
    void cmsApi.putDraft(nextPublished).catch(() => {})
    void cmsApi.publish().catch(() => {})
  }, [draft, history, published])

  const publishValidated = useCallback((): PublishValidationResult => {
    const result = validatePublish(draft)
    if (!result.ok) {
      setValidationIssues(result.issues)
      return result
    }
    publish()
    setValidationIssues([])
    return result
  }, [draft, publish])

  const publishSectionValidated = useCallback(
    (section: ContentSectionId): PublishValidationResult => {
      const issues = validateSection(section, draft)
      if (issues.length > 0) {
        const result = { ok: false as const, issues }
        setValidationIssues(issues)
        return result
      }

      const entry: CMSHistoryEntry = {
        id: `hist-${Math.random().toString(16).slice(2)}`,
        at: Date.now(),
        data: published,
      }
      const nextHistory = [entry, ...history].slice(0, 20)
      setHistory(nextHistory)
      saveHistory(nextHistory)

      const nextPublished = mergeSectionIntoPublished(published, draft, section)
      setPublished(nextPublished)
      savePublishedCMS(nextPublished)
      setValidationIssues([])
      void cmsApi.putDraft(draft).catch(() => {})
      void cmsApi.publish().catch(() => {})
      return { ok: true, issues: [] }
    },
    [draft, history, published],
  )

  const undo = useCallback(() => {
    if (history.length === 0) return
    const [latest, ...rest] = history
    const nextPublished = normalizeCmsData(latest.data)
    setHistory(rest)
    saveHistory(rest)

    setPublished(nextPublished)
    setDraftState(nextPublished)
    savePublishedCMS(nextPublished)
    saveDraftCMS(nextPublished)
    prevDraftRef.current = nextPublished
    setRenderSourceState('published')
    setValidationIssues([])
  }, [history])

  const resetDraft = useCallback(() => {
    setDraftState(published)
    saveDraftCMS(published)
    prevDraftRef.current = published
    setRenderSourceState('published')
    setValidationIssues([])
    void cmsApi.resetDraft().catch(() => {})
  }, [published])

  const value = useMemo<CmsContextValue>(
    () => ({
      isHydrated,
      renderSource,
      setRenderSource,
      previewLock,
      setPreviewLock,
      effectiveRenderSource,
      published,
      draft,
      activeContent,
      history,
      hasDraftChanges,
      sectionStates,
      validationIssues,
      setValidationIssues,
      setDraft,
      updateDraft,
      publish,
      publishValidated,
      publishSectionValidated,
      undo,
      resetDraft,
    }),
    [
      activeContent,
      draft,
      effectiveRenderSource,
      hasDraftChanges,
      history,
      isHydrated,
      previewLock,
      publish,
      publishValidated,
      publishSectionValidated,
      published,
      renderSource,
      resetDraft,
      sectionStates,
      setDraft,
      setPreviewLock,
      setRenderSource,
      undo,
      updateDraft,
      validationIssues,
    ],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within CmsProvider')
  return ctx
}

/** Active CMS payload for public sections (respects preview lock + render source). */
export function useCmsContent(): CMSData {
  const { activeContent } = useCms()
  return activeContent
}
