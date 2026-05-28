/**
 * Build a tel: href for USSD codes. Mobile dialers break when * is encoded as %2A.
 * Only "#" must be escaped (%23) because it is the URL fragment delimiter.
 */
export function buildTelUssdHref(ussd: string): string {
  const code = ussd.trim().replace(/^tel:/i, '')
  return `tel:${code.replace(/#/g, '%23')}`
}

/** Copy-friendly USSD (no tel: prefix). */
export function normalizeUssdDisplay(ussd: string): string {
  return ussd.trim().replace(/^tel:/i, '')
}
