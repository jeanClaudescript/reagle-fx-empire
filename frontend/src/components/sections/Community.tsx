import { motion } from 'framer-motion'
import { Facebook, Instagram, MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { BRAND } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlowButton } from '@/components/ui/GlowButton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { useCmsContent } from '@/cms/CmsProvider'
import { isSectionEnabled } from '@/cms/sectionVisibility'
import { messageApi } from '@/services/api'

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
  const active = useCmsContent()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!isSectionEnabled(active, 'community')) return null

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
              <h3 className="font-display text-2xl font-bold text-theme-primary sm:text-3xl">
                {t.community.title}
              </h3>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-theme-muted">
                <span className="rounded-full border border-theme px-4 py-1.5">
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
                <span className="font-display font-semibold text-theme-primary">
                  {t.community[key]}
                </span>
                <span className="text-xs text-theme-muted">{BRAND.brand}</span>
              </motion.a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-10 rounded-3xl border border-theme bg-theme-surface/55 p-5 sm:p-6">
            <h4 className="font-display text-lg font-bold text-theme-primary">Send message to admin</h4>
            <p className="mt-1 text-sm text-theme-muted">
              Ask about mentorship, signals, or course access. Admin receives this in dashboard.
            </p>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault()
                const trimmedName = name.trim()
                const trimmedMessage = message.trim()
                if (!trimmedName || !trimmedMessage) {
                  setFeedback('Name and message are required.')
                  return
                }
                setBusy(true)
                setFeedback(null)
                try {
                  await messageApi.send({
                    name: trimmedName,
                    phone: phone.trim() || undefined,
                    email: email.trim() || undefined,
                    channel: 'community',
                    message: trimmedMessage,
                  })
                  setName('')
                  setPhone('')
                  setEmail('')
                  setMessage('')
                  setFeedback('Message sent successfully.')
                } catch {
                  setFeedback('Could not send message right now. Please try WhatsApp.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary outline-none ring-theme-accent/40 transition focus:ring-2"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone / WhatsApp (optional)"
                className="rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary outline-none ring-theme-accent/40 transition focus:ring-2"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="sm:col-span-2 rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary outline-none ring-theme-accent/40 transition focus:ring-2"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write your message..."
                className="sm:col-span-2 rounded-xl border border-theme bg-theme-elevated/60 px-3 py-2.5 text-sm text-theme-primary outline-none ring-theme-accent/40 transition focus:ring-2"
              />
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className="admin-btn admin-btn--primary">
                  {busy ? 'Sending...' : 'Send message'}
                </button>
                {feedback ? <p className="text-sm text-theme-muted">{feedback}</p> : null}
              </div>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
