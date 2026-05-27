import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ImageLightbox } from '@/components/admin/media/ImageLightbox'
import { VideoLightbox } from '@/components/admin/media/VideoLightbox'

export type ImageViewerItem = {
  src: string
  alt?: string
}

type MediaViewerContextValue = {
  openImage: (src: string, alt?: string, gallery?: ImageViewerItem[]) => void
  openVideo: (src: string, poster?: string, title?: string) => void
  close: () => void
}

const MediaViewerContext = createContext<MediaViewerContextValue | null>(null)

export function MediaViewerProvider({ children }: { children: ReactNode }) {
  const [imageState, setImageState] = useState<{
    items: ImageViewerItem[]
    index: number
  } | null>(null)
  const [videoState, setVideoState] = useState<{
    src: string
    poster?: string
    title?: string
  } | null>(null)

  const close = useCallback(() => {
    setImageState(null)
    setVideoState(null)
  }, [])

  const openImage = useCallback((src: string, alt?: string, gallery?: ImageViewerItem[]) => {
    const items = gallery?.length ? gallery : [{ src, alt }]
    const index = Math.max(
      0,
      items.findIndex((item) => item.src === src),
    )
    setVideoState(null)
    setImageState({ items, index })
  }, [])

  const openVideo = useCallback((src: string, poster?: string, title?: string) => {
    setImageState(null)
    setVideoState({ src, poster, title })
  }, [])

  const value = useMemo(
    () => ({ openImage, openVideo, close }),
    [close, openImage, openVideo],
  )

  return (
    <MediaViewerContext.Provider value={value}>
      {children}
      {imageState && (
        <ImageLightbox
          items={imageState.items}
          index={imageState.index}
          onClose={close}
          onIndexChange={(index) => setImageState((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
      {videoState && (
        <VideoLightbox
          src={videoState.src}
          poster={videoState.poster}
          title={videoState.title}
          onClose={close}
        />
      )}
    </MediaViewerContext.Provider>
  )
}

export function useMediaViewer() {
  const ctx = useContext(MediaViewerContext)
  if (!ctx) throw new Error('useMediaViewer must be used within MediaViewerProvider')
  return ctx
}
