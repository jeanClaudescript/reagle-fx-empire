/** tel: link for USSD — do not encode * (breaks Android/iOS dialers on hosted HTTPS sites). */
export function buildTelUssdHref(ussd: string): string {
  const code = ussd.trim().replace(/^tel:/i, '')
  return `tel:${code.replace(/#/g, '%23')}`
}
