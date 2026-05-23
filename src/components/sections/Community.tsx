import { motion } from 'framer-motion'
import { Facebook, Instagram, MessageCircle, Users } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlowButton } from '@/components/ui/GlowButton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const channels = [
  {
    key: 'whatsapp',
    href: BRAND.whatsappLink,
    icon: MessageCircle,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    iconColor: 'text-emerald-400',
  },
  {
    key: 'instagram',
    href: BRAND.instagramLink,
    icon: Instagram,
    color: 'from-pink-500/20 to-purple-600/10 border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]',
    iconColor: 'text-pink-400',
  },
  {
    key: 'facebook',
    href: BRAND.facebookLink,
    icon: Facebook,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
    iconColor: 'text-blue-400',
  },
] as const

export function Community() {
  const { t } = useLanguage()

  return (
    <section id="community" className="relative py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-empire-purple/5 to-transparent" />

      <div className="section-container relative">
        <SectionHeading
          label={t.community.label}
          title={t.community.title}
          subtitle={t.community.subtitle}
        />

        <ScrollReveal>
          <motion.div
            animate={{ boxShadow: ['0 0 40px rgba(139,92,246,0.2)', '0 0 60px rgba(139,92,246,0.4)', '0 0 40px rgba(139,92,246,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="neon-border mx-auto mb-12 max-w-3xl"
          >
            <div className="glass-card overflow-hidden p-8 text-center sm:p-12">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-empire-purple/20"
              >
                <Users className="h-8 w-8 text-empire-purple-glow" />
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {t.community.title}
              </h3>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                <span className="rounded-full border border-white/10 px-4 py-1.5">
                  {t.community.members}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-emerald-400">
                  {t.community.activeDaily}
                </span>
              </div>
              <div className="mt-8">
                <GlowButton href={BRAND.whatsappLink} variant="whatsapp">
                  <MessageCircle className="h-5 w-5" />
                  {t.community.joinNow}
                </GlowButton>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {channels.map(({ key, href, icon: Icon, color, iconColor }, i) => (
            <ScrollReveal key={key} delay={i * 0.1}>
              <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -6, scale: 1.02 }}
                className={`glass-card-glow flex flex-col items-center gap-4 border bg-gradient-to-br p-8 text-center ${color}`}
              >
                <Icon className={`h-10 w-10 ${iconColor}`} />
                <span className="font-display font-semibold text-white">
                  {t.community[key]}
                </span>
                <span className="text-xs text-gray-500">{BRAND.brand}</span>
              </motion.a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
