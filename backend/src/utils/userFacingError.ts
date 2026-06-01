export function isMongoDuplicateKeyError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const code = (err as { code?: number }).code
  if (code === 11000) return true
  const message = err instanceof Error ? err.message : String((err as { message?: string }).message ?? '')
  return /E11000|duplicate key/i.test(message)
}

const BAD_REQUEST_PREFIX =
  /^(Invalid |Phone |Email |Daily lessons |Lesson not |This lesson |Payment not found|Only pending|Transaction ID|Amount must|Custom amounts|Payments are temporarily|Merchant phone|Default amount|Referral reward|USSD template|already registered|is required|No matching|Student not found|status must be|Media upload|No file uploaded|Cloudinary is not configured|Account already|Could not create|Wrong password|Sign in|Membership expired|Device id|Full name|You cannot use|This referral|Not signed in|Unauthorized|Classroom is not live|Open classroom)/

/** Map internal / database errors to short messages for clients. */
export function toUserFacingError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isMongoDuplicateKeyError(err)) {
    return 'This was already saved. Refresh the page or try again in a moment.'
  }

  if (err instanceof Error) {
    if (/E11000|duplicate key|Mongo(Server)?Error|mongodb/i.test(err.message)) {
      return 'Something went wrong. Please try again.'
    }
    if (err.message.length > 220) {
      return fallback
    }
    return err.message
  }

  return fallback
}

export function isUserFacingBadRequest(message: string): boolean {
  return BAD_REQUEST_PREFIX.test(message)
}
