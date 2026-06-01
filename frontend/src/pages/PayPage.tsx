import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PaymentFlow } from '@/components/payment/PaymentFlow'

export function PayPage() {
  return (
    <div className="premium-site pay-page-bg text-theme-muted">
      <Navbar />
      <main className="section-container relative py-20 md:py-24">
        <PaymentFlow />
      </main>
      <Footer />
    </div>
  )
}
