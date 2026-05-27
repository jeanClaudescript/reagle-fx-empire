import type { DeepPartial } from './types'

export function deepMerge<T>(base: T, patch: DeepPartial<T> | undefined | null): T {
  if (patch === undefined || patch === null) return base
  if (Array.isArray(base) || Array.isArray(patch)) {
    return (patch as T) ?? base
  }

  if (typeof base !== 'object' || typeof patch !== 'object') {
    return (patch as T) ?? base
  }

  const out: any = { ...(base as any) }
  for (const key of Object.keys(patch as any)) {
    const bVal = (base as any)[key]
    const pVal = (patch as any)[key]
    if (pVal === undefined) continue
    if (typeof pVal === 'object' && pVal !== null && !Array.isArray(pVal)) {
      out[key] = deepMerge(bVal, pVal)
    } else {
      out[key] = pVal
    }
  }
  return out as T
}

