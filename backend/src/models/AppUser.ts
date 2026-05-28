import { Schema, model } from 'mongoose'

export type MembershipStatus = 'paid' | 'unpaid'

export interface AppUserDocument {
  phone?: string
  email?: string
  name?: string
  referralCode: string
  referredByCode?: string
  referredByUserId?: string
  membershipStatus: MembershipStatus
  paidAt?: Date
  notes?: string
  walletBalance: number
  createdAt: Date
  updatedAt: Date
}

const appUserSchema = new Schema<AppUserDocument>(
  {
    phone: { type: String, trim: true, sparse: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, unique: true, index: true },
    name: { type: String, trim: true },
    referralCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    referredByCode: { type: String, uppercase: true, trim: true },
    referredByUserId: { type: String, trim: true },
    membershipStatus: { type: String, enum: ['paid', 'unpaid'], required: true, default: 'unpaid', index: true },
    paidAt: { type: Date },
    notes: { type: String, trim: true, default: '' },
    walletBalance: { type: Number, required: true, default: 0, min: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'app_users' },
)

export const AppUserModel = model<AppUserDocument>('AppUser', appUserSchema)
