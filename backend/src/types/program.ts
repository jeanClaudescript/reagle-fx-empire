export type ProgramPlanId = 'forex' | 'crypto' | 'bundle'

export const PROGRAM_PLAN_IDS: ProgramPlanId[] = ['forex', 'crypto', 'bundle']

export function isProgramPlanId(value: unknown): value is ProgramPlanId {
  return typeof value === 'string' && PROGRAM_PLAN_IDS.includes(value as ProgramPlanId)
}
