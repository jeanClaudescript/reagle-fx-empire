import { Facebook, Instagram, Globe, MapPin, MessageCircle } from 'lucide-react'
import { BRAND, NAV_SECTIONS } from '@/constants/brand'
import { useLanguage } from '@/context/LanguageContext'
import { scrollToSection } from '@/hooks/useScrollSpy'

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  const navLabels: Record<string, string> = {
    home: t.nav.home,
    about: t.nav.about,
    results: t.nav.results,
    lessons: t.nav.lessons,
    videos: t.nav.videos,
    community: t.nav.community,
    contact: t.nav.contact,
  }

  return (
    <footer id="contact" className="relative border-t border-theme bg-theme-surface/80 pb-28 pt-16 sm:pb-12">
      <div className="glow-orb -left-32 top-0 h-64 w-64 bg-empire-purple/20" />
      <div className="section-container relative">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-4">
              <span className="font-display text-2xl font-bold text-gradient-brand">
                REAGLE FX
              </span>
              <p className="text-xs uppercase tracking-[0.2em] text-theme-accent">
                Empire
              </p>
            </div>
            <p className="text-sm leading-relaxed text-theme-muted">{t.footer.tagline}</p>
            <p className="mt-2 text-sm text-theme-muted/70">
              {BRAND.mentor} · {BRAND.brand}
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-theme-primary">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2">
              {NAV_SECTIONS.map(({ id, key }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className="text-sm text-theme-muted transition-colors hover:text-theme-accent"
                  >
                    {navLabels[key]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-theme-primary">
              {t.footer.connect}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={BRAND.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-theme-muted hover:text-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  {BRAND.whatsapp}
                </a>
              </li>
              <li>
                <a
                  href={BRAND.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-theme-muted hover:text-pink-500"
                >
                  <Instagram className="h-4 w-4" />
                  {BRAND.instagram}
                </a>
              </li>
              <li>
                <a
                  href={BRAND.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-theme-muted hover:text-blue-500"
                >
                  <Facebook className="h-4 w-4" />
                  {BRAND.facebook}
                </a>
              </li>
              <li>
                <a
                  href={BRAND.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-theme-muted hover:text-empire-blue-electric"
                >
                  <Globe className="h-4 w-4" />
                  reaglex.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-theme-muted">
                <MapPin className="h-4 w-4 shrink-0 text-theme-accent" />
                {BRAND.location}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-theme-primary">
              {t.contact.label}
            </h3>
            <p className="mb-4 text-sm text-theme-muted">{t.contact.subtitle}</p>
            <a
              href={BRAND.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-empire-purple to-empire-blue px-5 py-3 text-sm font-semibold text-white shadow-glow-sm transition hover:shadow-glow"
            >
              <MessageCircle className="h-4 w-4" />
              {t.contact.messageUs}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-theme pt-8 sm:flex-row">
          <p className="text-center text-xs text-theme-muted sm:text-left">
            © {year} {BRAND.brand}. {t.footer.rights}
          </p>
          <p className="text-xs text-theme-muted/60">
            Powered by {BRAND.mentor} · Forex Mentorship
          </p>
        </div>
      </div>
    </footer>
  )
}
