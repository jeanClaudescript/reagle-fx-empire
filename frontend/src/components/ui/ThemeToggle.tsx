import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, isDark } = useTheme()
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t.theme.light : t.theme.dark}
      title={isDark ? t.theme.light : t.theme.dark}
      className={`relative flex items-center justify-center rounded-xl border border-theme glass-card transition hover:border-theme-accent/40 ${
        compact ? 'h-9 w-9' : 'h-10 w-10'
      }`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="absolute"
      >
        <Moon className={`text-theme-accent ${compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'}`} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? -180 : 0, scale: isDark ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        className="absolute"
      >
        <Sun className={`text-amber-500 ${compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'}`} />
      </motion.div>
      <span className="sr-only">{theme}</span>
    </button>
  )
}
