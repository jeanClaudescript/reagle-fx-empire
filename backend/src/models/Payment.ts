import { Schema, model } from 'mongoose'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
export type PaymentProvider = 'MTN' | 'AIRTEL' | 'MANUAL' | 'WEBHOOK'
export type ProgramPlanId = 'forex' | 'crypto' | 'bundle'

export interface PaymentDocument {
  userId: string
  phone: string
  programType?: ProgramPlanId
  amount: number
  currency: string
  status: PaymentStatus
  referenceCode: string
  transactionId?: string
  provider?: PaymentProvider
  payerMessage?: string
  confirmedAt?: Date
  confirmedBy?: 'webhook' | 'admin' | 'auto_match'
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    userId: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    programType: { type: String, enum: ['forex', 'crypto', 'bundle'], index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: 'RWF' },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'PAID', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    referenceCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    transactionId: { type: String, trim: true, sparse: true, index: true },
    provider: { type: String, enum: ['MTN', 'AIRTEL', 'MANUAL', 'WEBHOOK'] },
    payerMessage: { type: String, trim: true },
    confirmedAt: { type: Date },
    confirmedBy: { type: String, enum: ['webhook', 'admin', 'auto_match'] },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'payments' },
)

export const PaymentModel = model<PaymentDocument>('Payment', paymentSchema)
