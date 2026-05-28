export function normalizeRwPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('250') && digits.length === 12) return digits
  if (digits.startsWith('07') && digits.length === 10) return `250${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith('7')) return `250${digits}`
  return digits
}

export function formatDisplayPhone(e164: string) {
  if (e164.startsWith('250') && e164.length === 12) {
    return `0${e164.slice(3)}`
  }
  return e164
}
