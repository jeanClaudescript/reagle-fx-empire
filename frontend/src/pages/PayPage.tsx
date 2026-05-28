import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PaymentFlow } from '@/components/payment/PaymentFlow'
import { PremiumPageHeader } from '@/components/ui/PremiumPageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function PayPage() {
  const { t } = useLanguage()

  return (
    <div className="pay-page-bg text-theme-muted">
      <Navbar />
      <main className="section-container relative py-24 md:py-32">
        <PremiumPageHeader
          badge={t.pay.badge}
          title={t.pay.title}
          subtitle={t.pay.subtitle}
        />
        <PaymentFlow />
      </main>
      <Footer />
    </div>
  )
}
