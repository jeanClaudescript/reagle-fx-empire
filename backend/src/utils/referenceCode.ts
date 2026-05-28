import { randomBytes } from 'node:crypto'

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateReferenceCode() {
  const bytes = randomBytes(8)
  let suffix = ''
  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[bytes[i]! % alphabet.length]
  }
  return `RFX-${suffix}`
}
