import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI?.trim() || '',
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  allowVercelPreviewOrigins: (process.env.ALLOW_VERCEL_PREVIEW_ORIGINS || 'true').toLowerCase() === 'true',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER?.trim() || 'reagle-fx',
  paymentMerchantPhone: (process.env.PAYMENT_MERCHANT_PHONE || '250789880060').replace(/\D/g, ''),
  paymentDefaultAmount: Number(process.env.PAYMENT_DEFAULT_AMOUNT || 5000),
  paymentCurrency: process.env.PAYMENT_CURRENCY?.trim() || 'RWF',
  paymentUssdTemplate:
    process.env.PAYMENT_USSD_TEMPLATE?.trim() || '182*1*1*{phone}*{amount}#',
  paymentAirtelUssdTemplate:
    process.env.PAYMENT_AIRTEL_USSD_TEMPLATE?.trim() || '500*1*2*{phone}*{amount}#',
  referralRewardAmount: Number(process.env.REFERRAL_REWARD_AMOUNT || 1000),
  momoWebhookSecret: process.env.MOMO_WEBHOOK_SECRET?.trim() || '',
  turnUrls: (process.env.TURN_URLS || 'turn:localhost:3478')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean),
  turnUsername: process.env.TURN_USERNAME?.trim() || '',
  turnCredential: process.env.TURN_CREDENTIAL?.trim() || '',
}
