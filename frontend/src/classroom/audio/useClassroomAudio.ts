import { useEffect, useRef } from 'react'
import { useClassroomStore } from '../store/useClassroomStore'
import { emitWebRtcSignal, onWebRtcSignal } from '../socket/classroomSocket'

type Props = {
  micOn: boolean
  canSpeak: boolean
  listening: boolean
}

export function useClassroomAudio({ micOn, canSpeak, listening }: Props) {
  const role = useClassroomStore((s) => s.role)
  const selfId = useClassroomStore((s) => s.selfId)
  const turn = useClassroomStore((s) => s.turn)
  const participants = useClassroomStore((s) => s.participants)

  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  const iceServers: RTCIceServer[] = turn?.urls?.length
    ? [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: turn.urls,
          username: turn.username || undefined,
          credential: turn.credential || undefined,
        },
      ]
    : [{ urls: 'stun:stun.l.google.com:19302' }]

  useEffect(() => {
    return onWebRtcSignal(async ({ fromUserId, targetUserId, signal }) => {
      if (targetUserId !== selfId) return
      let pc = peersRef.current.get(fromUserId)
      if (!pc) {
        pc = createPeer(fromUserId, false)
        peersRef.current.set(fromUserId, pc)
      }
      const desc = signal as RTCSessionDescriptionInit
      if (desc.type === 'offer') {
        await pc.setRemoteDescription(desc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        emitWebRtcSignal(fromUserId, answer)
      } else if (desc.type === 'answer') {
        await pc.setRemoteDescription(desc)
      } else if ((signal as RTCIceCandidateInit).candidate) {
        await pc.addIceCandidate(signal as RTCIceCandidateInit)
      }
    })
  }, [selfId])

  useEffect(() => {
    if (role !== 'teacher' || !micOn) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
      return
    }

    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localStreamRef.current = stream
        for (const p of participants) {
          if (p.userId === selfId || p.role !== 'student') continue
          ensureOffer(p.userId)
        }
      })
      .catch(() => {
        /* mic denied */
      })

    return () => {
      cancelled = true
    }
  }, [role, micOn, participants, selfId])

  useEffect(() => {
    if (role === 'teacher') return
    if (!listening && !canSpeak) {
      audioElsRef.current.forEach((el) => {
        el.srcObject = null
      })
      return
    }
    const teacher = participants.find((p) => p.role === 'teacher')
    if (teacher && !peersRef.current.has(teacher.userId)) {
      createPeer(teacher.userId, true)
    }
  }, [role, listening, canSpeak, participants])

  useEffect(() => {
    if (role !== 'student' || !canSpeak) return
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
      localStreamRef.current = stream
      const teacher = participants.find((p) => p.role === 'teacher')
      if (teacher) ensureOffer(teacher.userId)
    })
  }, [role, canSpeak, participants])

  function createPeer(remoteUserId: string, initiator: boolean) {
    const pc = new RTCPeerConnection({ iceServers })
    pc.onicecandidate = (e) => {
      if (e.candidate) emitWebRtcSignal(remoteUserId, e.candidate)
    }
    pc.ontrack = (e) => {
      let audio = audioElsRef.current.get(remoteUserId)
      if (!audio) {
        audio = document.createElement('audio')
        audio.autoplay = true
        audioElsRef.current.set(remoteUserId, audio)
        document.body.appendChild(audio)
      }
      audio.srcObject = e.streams[0]
    }

    const local = localStreamRef.current
    if (local) {
      local.getTracks().forEach((track) => pc.addTrack(track, local))
    }

    peersRef.current.set(remoteUserId, pc)

    if (initiator) {
      void ensureOffer(remoteUserId)
    }
    return pc
  }

  async function ensureOffer(remoteUserId: string) {
    let pc = peersRef.current.get(remoteUserId)
    if (!pc) pc = createPeer(remoteUserId, true)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    emitWebRtcSignal(remoteUserId, offer)
  }

  useEffect(() => {
    return () => {
      peersRef.current.forEach((pc) => pc.close())
      peersRef.current.clear()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioElsRef.current.forEach((el) => el.remove())
      audioElsRef.current.clear()
    }
  }, [])
}
