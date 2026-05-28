import { motion } from 'framer-motion'

export function PremiumPageHeader({
  badge,
  title,
  subtitle,
}: {
  badge: string
  title: string
  subtitle: string
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="premium-page-header mx-auto mb-10 max-w-2xl text-center"
    >
      <span className="premium-badge">{badge}</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-theme-primary sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-theme-muted sm:text-lg">{subtitle}</p>
    </motion.header>
  )
}
