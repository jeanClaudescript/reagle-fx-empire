import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCms } from '@/cms/CmsProvider'
import type { ValidationIssue } from '@/cms/validation'

interface CmsValidationContextValue {
  issues: ValidationIssue[]
  hasFieldError: (field: string) => boolean
  issuesForSection: (section: ValidationIssue['section']) => ValidationIssue[]
}

const CmsValidationContext = createContext<CmsValidationContextValue | null>(null)

export function CmsValidationProvider({ children }: { children: ReactNode }) {
  const { validationIssues } = useCms()

  const value = useMemo<CmsValidationContextValue>(
    () => ({
      issues: validationIssues,
      hasFieldError: (field: string) => validationIssues.some((i) => i.field === field),
      issuesForSection: (section) => validationIssues.filter((i) => i.section === section),
    }),
    [validationIssues],
  )

  return (
    <CmsValidationContext.Provider value={value}>{children}</CmsValidationContext.Provider>
  )
}

export function useCmsValidation() {
  const ctx = useContext(CmsValidationContext)
  if (!ctx) {
    return {
      issues: [] as ValidationIssue[],
      hasFieldError: () => false,
      issuesForSection: () => [] as ValidationIssue[],
    }
  }
  return ctx
}
