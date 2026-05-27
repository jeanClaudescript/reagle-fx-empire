import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { BRAND } from '@/constants/brand'

export function FloatingWhatsApp() {
  return (
    <motion.a
      href={BRAND.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] sm:bottom-8 sm:right-6 sm:h-16 sm:w-16"
      aria-label="Chat on WhatsApp"
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-400"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <MessageCircle className="relative h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" />
    </motion.a>
  )
}
