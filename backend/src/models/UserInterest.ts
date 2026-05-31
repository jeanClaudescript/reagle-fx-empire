import { Schema, model } from 'mongoose'

export interface UserInterestDocument {
  userId: string
  topics: string[]
  pairs: string[]
  tradingStyles: string[]
  programFocus?: 'forex' | 'crypto' | 'both'
  updatedAt: Date
}

const userInterestSchema = new Schema<UserInterestDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    topics: { type: [String], default: [] },
    pairs: { type: [String], default: [] },
    tradingStyles: { type: [String], default: [] },
    programFocus: { type: String, enum: ['forex', 'crypto', 'both'] },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'user_interests' },
)

export const UserInterestModel = model<UserInterestDocument>('UserInterest', userInterestSchema)
