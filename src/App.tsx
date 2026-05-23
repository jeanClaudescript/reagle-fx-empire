import { lazy, Suspense } from 'react'
import { LanguageProvider } from '@/context/LanguageContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp'
import { StickyMobileCTA } from '@/components/layout/StickyMobileCTA'
import { Hero } from '@/components/sections/Hero'

const About = lazy(() =>
  import('@/components/sections/About').then((m) => ({ default: m.About })),
)
const Results = lazy(() =>
  import('@/components/sections/Results').then((m) => ({ default: m.Results })),
)
const Lessons = lazy(() =>
  import('@/components/sections/Lessons').then((m) => ({ default: m.Lessons })),
)
const Videos = lazy(() =>
  import('@/components/sections/Videos').then((m) => ({ default: m.Videos })),
)
const Community = lazy(() =>
  import('@/components/sections/Community').then((m) => ({ default: m.Community })),
)

function SectionFallback() {
  return <div className="min-h-[40vh]" aria-hidden />
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-theme-bg text-theme-muted transition-colors duration-500">
          <Navbar />
          <main>
            <Hero />
            <Suspense fallback={<SectionFallback />}>
              <About />
              <Results />
              <Lessons />
              <Videos />
              <Community />
            </Suspense>
          </main>
          <Footer />
          <FloatingWhatsApp />
          <StickyMobileCTA />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
