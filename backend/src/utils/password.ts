import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LEN = 64

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex')
  return { salt, hash }
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const attempt = scryptSync(password, salt, KEY_LEN)
    const stored = Buffer.from(hash, 'hex')
    if (attempt.length !== stored.length) return false
    return timingSafeEqual(attempt, stored)
  } catch {
    return false
  }
}
