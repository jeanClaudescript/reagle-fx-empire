import { Schema, model } from 'mongoose'

export type MembershipStatus = 'paid' | 'unpaid'
export type UserRole = 'student' | 'admin'
export type ProgramPlanId = 'forex' | 'crypto' | 'bundle'

export interface AppUserDocument {
  _id: unknown
  phone?: string
  email?: string
  name?: string
  role: UserRole
  passwordHash?: string
  passwordSalt?: string
  isPrimaryAdmin?: boolean
  referralCode?: string
  referredByCode?: string
  referredByUserId?: string
  membershipStatus: MembershipStatus
  programType?: ProgramPlanId
  paidAt?: Date
  paidUntil?: Date
  notes?: string
  walletBalance: number
  referralPoints: number
  createdAt: Date
  updatedAt: Date
}

const appUserSchema = new Schema<AppUserDocument>(
  {
    phone: { type: String, trim: true, sparse: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, unique: true, index: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ['student', 'admin'], required: true, default: 'student', index: true },
    passwordHash: { type: String, select: false },
    passwordSalt: { type: String, select: false },
    isPrimaryAdmin: { type: Boolean, default: false },
    referralCode: { type: String, uppercase: true, trim: true, sparse: true, unique: true, index: true },
    referredByCode: { type: String, uppercase: true, trim: true },
    referredByUserId: { type: String, trim: true },
    membershipStatus: { type: String, enum: ['paid', 'unpaid'], required: true, default: 'unpaid', index: true },
    programType: { type: String, enum: ['forex', 'crypto', 'bundle'], index: true },
    paidAt: { type: Date },
    paidUntil: { type: Date, index: true },
    notes: { type: String, trim: true, default: '' },
    walletBalance: { type: Number, required: true, default: 0, min: 0 },
    referralPoints: { type: Number, required: true, default: 0, min: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'app_users' },
)

export const AppUserModel = model<AppUserDocument>('AppUser', appUserSchema)
