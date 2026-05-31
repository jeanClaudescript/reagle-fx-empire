import { useCallback, useEffect, useRef, useState } from 'react'

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const durationRef = useRef(0)

  const stopTracks = () => {
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop())
  }

  const cancel = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
    stopTracks()
    mediaRef.current = null
    chunksRef.current = []
    setRecording(false)
    setDuration(0)
    durationRef.current = 0
  }, [])

  useEffect(() => () => cancel(), [cancel])

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    mediaRef.current = recorder
    durationRef.current = 0
    setDuration(0)
    setRecording(true)
    timerRef.current = window.setInterval(() => {
      durationRef.current += 1
      setDuration(durationRef.current)
    }, 1000)
    recorder.start()
  }, [])

  const finish = useCallback(async () => {
    const recorder = mediaRef.current
    if (!recorder) throw new Error('Not recording')

    return new Promise<{ blob: Blob; durationSec: number }>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const dur = durationRef.current || 1
        stopTracks()
        mediaRef.current = null
        if (timerRef.current) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }
        setRecording(false)
        resolve({ blob, durationSec: dur })
      }
      recorder.onerror = () => reject(new Error('Recording failed'))
      recorder.stop()
    })
  }, [])

  return { recording, duration, start, finish, cancel }
}
