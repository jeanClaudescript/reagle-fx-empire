import { StudentLoginModal } from '@/components/student/StudentLoginModal'

/** Opens the public student login (paid / unpaid / not found). */
export function StudentGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <StudentLoginModal open={open} onClose={onClose} />
}
