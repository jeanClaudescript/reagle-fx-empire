import { motion } from 'framer-motion'

interface SectionHeadingProps {
  label: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

export function SectionHeading({
  label,
  title,
  subtitle,
  align = 'center',
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'

  return (
    <div className={`mb-12 max-w-3xl md:mb-16 ${alignClass}`}>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-3 inline-block rounded-full border border-theme-accent/30 bg-theme-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-theme-accent"
      >
        {label}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-theme-primary sm:text-4xl lg:text-5xl"
      >
        <span className="text-gradient">{title}</span>
      </motion.h2>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className={`mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-empire-purple to-empire-blue ${align === 'center' ? 'mx-auto' : ''}`}
      />
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-base leading-relaxed text-theme-muted sm:text-lg"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
