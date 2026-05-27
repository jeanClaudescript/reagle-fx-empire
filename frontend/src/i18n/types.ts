export type Language = 'en' | 'rw' | 'fr' | 'sw'

export interface Translations {
  nav: {
    home: string
    about: string
    results: string
    lessons: string
    videos: string
    community: string
    contact: string
  }
  hero: {
    badge: string
    headline: string
    subheadline: string
    ctaWhatsapp: string
    ctaResults: string
    statFollowers: string
    statCommunity: string
    statMentorship: string
    statBeginner: string
    profitLabel: string
    profitValue: string
    sessionLabel: string
    sessionValue: string
  }
  about: {
    label: string
    title: string
    story: string
    mission: string
    experience: string
    philosophy: string
    statYears: string
    statStudents: string
    statGrowth: string
    statSessions: string
    yearsValue: string
    studentsValue: string
    growthValue: string
    sessionsValue: string
  }
  results: {
    label: string
    title: string
    subtitle: string
    mt5: string
    withdrawals: string
    studentWins: string
    testimonials: string
    testimonial1: string
    testimonial2: string
    testimonial3: string
    author1: string
    author2: string
    author3: string
    profitToday: string
    totalProfit: string
    winRate: string
  }
  videos: {
    label: string
    title: string
    subtitle: string
    reel1: string
    reel2: string
    reel3: string
    reel4: string
    reel5: string
    reel6: string
  }
  lessons: {
    label: string
    title: string
    subtitle: string
    risk: string
    riskDesc: string
    technical: string
    technicalDesc: string
    psychology: string
    psychologyDesc: string
    structure: string
    structureDesc: string
    beginner: string
    beginnerDesc: string
    live: string
    liveDesc: string
  }
  community: {
    label: string
    title: string
    subtitle: string
    whatsapp: string
    instagram: string
    facebook: string
    joinNow: string
    members: string
    activeDaily: string
  }
  contact: {
    label: string
    title: string
    subtitle: string
    location: string
    website: string
    messageUs: string
  }
  footer: {
    tagline: string
    quickLinks: string
    connect: string
    rights: string
  }
  mobile: {
    joinWhatsapp: string
  }
  languages: {
    en: string
    rw: string
    fr: string
    sw: string
  }
  theme: {
    light: string
    dark: string
    liveChart: string
  }
}
