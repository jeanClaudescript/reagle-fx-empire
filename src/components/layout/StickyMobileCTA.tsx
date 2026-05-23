import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'

export function StickyMobileCTA() {
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-empire-black/90 p-3 backdrop-blur-xl sm:hidden"
    >
      <a
        href={BRAND.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.4)]"
      >
        <MessageCircle className="h-5 w-5" />
        {t.mobile.joinWhatsapp}
      </a>
    </motion.div>
  )
}
