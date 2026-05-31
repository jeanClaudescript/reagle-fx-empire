import { assignDailyLessonsForAllUsers } from './educationService.js'

let started = false
let lastRunDate = ''

export function startEducationScheduler() {
  if (started) return
  started = true

  const tryRun = () => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const hour = now.getHours()

    if (hour === 0 && lastRunDate !== today) {
      lastRunDate = today
      void assignDailyLessonsForAllUsers()
        .then((r) => console.log('[education] daily assignment complete', r))
        .catch((e) => console.error('[education] daily assignment failed', e))
    }
  }

  tryRun()
  setInterval(tryRun, 60 * 60 * 1000)
  console.log('[education] scheduler started')
}
