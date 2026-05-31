import { ArrowLeft, Home } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type Step = 'form' | 'pay' | 'done'

type Props = {
  step: Step
  onBack?: () => void
  showBack?: boolean
}

export function PayFlowToolbar({ step, onBack, showBack }: Props) {
  const { t } = useLanguage()

  const goHome = () => {
    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="pay-flow-toolbar">
      <div className="pay-flow-toolbar__inner">
        {showBack && onBack ? (
          <button type="button" className="pay-flow-toolbar__btn" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {step === 'pay' ? t.pay.backToDetails : t.pay.backHome}
          </button>
        ) : (
          <button type="button" className="pay-flow-toolbar__btn" onClick={goHome}>
            <Home className="h-4 w-4" />
            {t.pay.backHome}
          </button>
        )}
        <span className="pay-flow-toolbar__step">
          {step === 'form' ? '1/3' : step === 'pay' ? '2/3' : '3/3'}
        </span>
      </div>
    </div>
  )
}
