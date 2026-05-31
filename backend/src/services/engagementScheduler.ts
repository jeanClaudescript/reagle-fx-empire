import { processDueLiveReminders } from './liveReminderService.js'
import { getPublishedCms } from './cmsService.js'
import { shouldShowDailySubject, recordDailySubjectShown } from './engagementService.js'
import { listPaidStudentIds } from './notificationEngine.js'
import { onForexNewsDigest, deliverDailySubject } from './engagementIntegrations.js'

let started = false

async function runDailySubjectJob() {
  try {
    const cms = await getPublishedCms()
    const updates = cms.dailyUpdates ?? []
    const enabled = updates.filter((u) => u.enabled !== false)
    if (!enabled.length) return

    const subject = enabled[0]
    const students = await listPaidStudentIds()
    for (const student of students) {
      const show = await shouldShowDailySubject(student.id, subject.id)
      if (!show) continue
      await deliverDailySubject(student.id, {
        id: subject.id,
        title: subject.caption,
        summary: subject.caption,
      })
      await recordDailySubjectShown(student.id, subject.id)
    }
  } catch (error) {
    console.error('[engagement] daily subject job failed', error)
  }
}

async function runNewsDigestJob() {
  try {
    const cms = await getPublishedCms()
    const headlines = (cms.dailyUpdates ?? [])
      .slice(0, 4)
      .map((u) => u.caption)
      .filter(Boolean)
    if (headlines.length) await onForexNewsDigest(headlines)
  } catch (error) {
    console.error('[engagement] news digest job failed', error)
  }
}

export function startEngagementScheduler() {
  if (started) return
  started = true

  setInterval(() => {
    void processDueLiveReminders()
  }, 60_000)

  void processDueLiveReminders()

  const hour = new Date().getHours()
  if (hour >= 7 && hour <= 10) {
    void runDailySubjectJob()
  }

  setInterval(() => {
    const h = new Date().getHours()
    if (h === 8) void runDailySubjectJob()
    if (h === 9) void runNewsDigestJob()
  }, 60 * 60 * 1000)

  console.log('[engagement] scheduler started')
}
