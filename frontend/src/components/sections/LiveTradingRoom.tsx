import { useEffect, useState, type ReactNode } from 'react'
import { Lock, Radio, Share2, Signal } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStudentAccess } from '@/context/StudentAccessContext'
import { liveApi, type LiveSession } from '@/services/api'
import { onLiveUpdated } from '@/realtime/appSocket'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { GlowButton } from '@/components/ui/GlowButton'
import { LiveForexChart } from '@/components/ui/LiveForexChart'
import { PaperTradingDesk } from '@/components/forex/tools/PaperTradingDesk'
import { StudentGateModal } from '@/components/student/StudentGateModal'

function embedUrl(url?: string) {
  if (!url) return null
  if (url.includes('youtube.com/watch')) {
    const id = new URL(url).searchParams.get('v')
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : null
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  return url
}

function Reveal({
  deskMode,
  children,
  className,
  delay,
}: {
  deskMode?: boolean
  children: ReactNode
  className?: string
  delay?: number
}) {
  if (deskMode) return <div className={className}>{children}</div>
  return (
    <ScrollReveal className={className} delay={delay}>
      {children}
    </ScrollReveal>
  )
}

export function LiveTradingRoom({ deskMode = false }: { deskMode?: boolean }) {
  const { t } = useLanguage()
  const { isPaid, contact, loading, hasVipSession } = useStudentAccess()
  const [session, setSession] = useState<LiveSession | null>(null)
  const [gateOpen, setGateOpen] = useState(false)

  const canView = deskMode ? hasVipSession : isPaid

  useEffect(() => {
    if (!deskMode && !isPaid) return
    if (deskMode && !hasVipSession) return

    const load = async () => {
      try {
        const res = await liveApi.getActive()
        setSession(res.data)
      } catch {
        setSession(null)
      }
    }
    void load()
    const off = onLiveUpdated((payload) => setSession(payload.data))
    return () => off()
  }, [deskMode, hasVipSession, isPaid])

  const isLive = session?.status === 'live'
  const stream = embedUrl(session?.streamUrl)

  const shareText =
    session?.signalSide && session.signalSide !== 'neutral'
      ? `${session.signalSide.toUpperCase()} ${session.pair}\nEntry: ${session.signalEntry ?? '—'}\nSL: ${session.signalStop ?? '—'}\nTP: ${session.signalTarget ?? '—'}`
      : ''

  const copySignal = async () => {
    if (!shareText) return
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      /* ignore */
    }
  }

  const sectionClass = deskMode
    ? 'vip-live-panel'
    : 'section-premium relative section-pad'

  return (
    <section id={deskMode ? undefined : 'live'} className={sectionClass}>
      {!deskMode ? (
        <div className="absolute inset-0 bg-gradient-to-b from-empire-purple/5 via-transparent to-theme-bg" />
      ) : null}
      <div className={deskMode ? 'vip-live-panel__inner' : 'section-container relative'}>
        {deskMode ? (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-theme-accent">{t.live.label}</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-theme-primary">{t.live.title}</h2>
            <p className="mt-1 text-sm text-theme-muted">{t.live.subtitle}</p>
          </div>
        ) : (
          <SectionHeading label={t.live.label} title={t.live.title} subtitle={t.live.subtitle} />
        )}

        {isLive ? (
          <div className="live-pill mb-8">
            <span className="live-dot h-2 w-2 rounded-full bg-rose-500" />
            {t.live.liveNow}: {session?.title}
          </div>
        ) : null}

        <div className="live-room-grid">
          <Reveal deskMode={deskMode} className="live-room-grid__main">
            <div className="fintech-card fintech-card--glow overflow-hidden p-2 sm:p-3">
              {canView && isLive && stream ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <iframe
                    title="Live stream"
                    src={stream}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <LiveForexChart className="h-full w-full" compact />
                  {!canView ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-bg/80 p-6 text-center backdrop-blur-sm">
                      <Lock className="h-10 w-10 text-theme-accent" />
                      <p className="mt-3 font-display text-lg font-bold text-theme-primary">
                        {t.live.lockedTitle}
                      </p>
                      <p className="mt-1 text-sm text-theme-muted">{t.live.lockedBody}</p>
                      <GlowButton
                        variant="primary"
                        external={false}
                        className="mt-4"
                        onClick={() => setGateOpen(true)}
                      >
                        {t.live.verifyAccess}
                      </GlowButton>
                    </div>
                  ) : null}
                </div>
              )}

              {session?.coachNote && canView ? (
                <p className="mt-3 rounded-xl border border-theme bg-theme-surface/50 px-4 py-3 text-sm text-theme-primary">
                  <strong>{t.live.coachNote}:</strong> {session.coachNote}
                </p>
              ) : null}

              {session?.meetingUrl && canView ? (
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-theme-accent/40 bg-theme-accent/10 px-4 text-sm font-semibold text-theme-accent"
                >
                  {t.live.openMeeting}
                </a>
              ) : null}
            </div>
          </Reveal>

          <Reveal deskMode={deskMode} delay={0.08} className="live-room-grid__side">
            <div className="flex flex-col gap-4">
              <div className="fintech-card p-5">
                <div className="flex items-center gap-2">
                  <Signal className="h-5 w-5 text-theme-accent" />
                  <h3 className="font-display font-bold text-theme-primary">{t.live.signalTitle}</h3>
                </div>
                {canView && session?.signalSide && session.signalSide !== 'neutral' ? (
                  <div className="forex-signal-card mt-4">
                    <p
                      className={`text-lg font-bold uppercase ${session.signalSide === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {session.signalSide} {session.pair}
                    </p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-theme-elevated/50 p-2">
                        <dt className="text-theme-muted">{t.tools.entry}</dt>
                        <dd className="font-mono font-bold">{session.signalEntry ?? '—'}</dd>
                      </div>
                      <div className="rounded-xl bg-theme-elevated/50 p-2">
                        <dt className="text-theme-muted">{t.tools.stop}</dt>
                        <dd className="font-mono font-bold text-rose-400">{session.signalStop ?? '—'}</dd>
                      </div>
                      <div className="rounded-xl bg-theme-elevated/50 p-2">
                        <dt className="text-theme-muted">{t.tools.target}</dt>
                        <dd className="font-mono font-bold text-emerald-400">{session.signalTarget ?? '—'}</dd>
                      </div>
                    </dl>
                    <button type="button" className="forex-tool-action mt-3" onClick={copySignal}>
                      <Share2 className="h-4 w-4" />
                      {t.tools.copySignal}
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-theme-muted">{t.live.signalEmpty}</p>
                )}
              </div>

              {!deskMode ? <PaperTradingDesk pair={session?.pair} /> : null}

              {!loading && contact && !deskMode ? (
                <p className="text-center text-xs text-theme-muted">
                  {t.live.signedInAs} {contact.name || contact.phone || contact.email}
                  {isPaid ? ` · ${t.live.paidBadge}` : ''}
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>

        {!canView && !deskMode ? (
          <Reveal deskMode={deskMode}>
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <Radio className="h-8 w-8 text-theme-accent" />
              <p className="max-w-md text-sm text-theme-muted">{t.live.upgradeHint}</p>
              <GlowButton href="/pay" variant="primary" external={false}>
                {t.live.unlockCta}
              </GlowButton>
            </div>
          </Reveal>
        ) : null}
      </div>

      {!deskMode ? <StudentGateModal open={gateOpen} onClose={() => setGateOpen(false)} /> : null}
    </section>
  )
}
