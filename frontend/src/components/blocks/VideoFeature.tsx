import { useEffect, useRef, useState } from 'react'
import type { VideoFeatureBlock } from '@/types/content'
import { Container, Section } from '@/components/ui'
import { useRevealGroup } from '@/lib/useReveal'
import './video-feature.css'

/** Saca el id de vídeo de cualquiera de las formas de URL de YouTube. */
function idDeYouTube(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  )
  return m ? m[1] : null
}

/**
 * Vídeo destacado a dos columnas: texto a un lado, miniatura al otro.
 *
 * Antes ocupaba el ancho completo y en pantalla grande el reproductor salía
 * enorme, desproporcionado frente al resto de la página. A dos columnas el
 * vídeo se lee como apoyo del texto y no al revés.
 *
 * El iframe de YouTube sólo se monta al abrir el diálogo. Incrustado de salida
 * carga cerca de medio mega de scripts de terceros en una página que casi
 * nadie va a ver hasta el final.
 */
export function VideoFeature({ block }: { block: VideoFeatureBlock }) {
  const ref = useRevealGroup<HTMLDivElement>()
  const [abierto, setAbierto] = useState(false)
  const dialogo = useRef<HTMLDivElement>(null)
  const disparador = useRef<HTMLButtonElement>(null)

  const id = idDeYouTube(block.video)

  useEffect(() => {
    if (!abierto) return

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
      /* Encierra el tabulador dentro del diálogo: sin esto el foco se va
         detrás del velo y el usuario de teclado se pierde. */
      if (e.key !== 'Tab') return
      const focos = dialogo.current?.querySelectorAll<HTMLElement>(
        'button, iframe, [href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focos || focos.length === 0) return
      const primero = focos[0]
      const ultimo = focos[focos.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclear)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current?.querySelector('button')?.focus()

    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = previo
      /* Devuelve el foco a donde estaba: al cerrar, el teclado debe seguir
         donde el usuario lo dejó, no al principio de la página. */
      disparador.current?.focus()
    }
  }, [abierto])

  return (
    <Section theme={block.theme ?? 'light'}>
      <Container>
        <div ref={ref} className="video-feature">
          <div className="video-feature__texto reveal">
            {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
            <h2>{block.title}</h2>
            {block.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <button
            type="button"
            ref={disparador}
            className="video-feature__disparador reveal"
            onClick={() => setAbierto(true)}
            aria-label={`Reproducir: ${block.videoTitle ?? block.title}`}
          >
            <img
              src={block.thumbnail.src}
              alt=""
              width={block.thumbnail.width}
              height={block.thumbnail.height}
              loading="lazy"
              decoding="async"
            />
            <span className="video-feature__play" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </span>
            {block.videoTitle && (
              <span className="video-feature__pie">{block.videoTitle}</span>
            )}
          </button>
        </div>
      </Container>

      {abierto && id && (
        <div
          className="video-modal"
          role="dialog"
          aria-modal="true"
          aria-label={block.videoTitle ?? block.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false)
          }}
        >
          <div className="video-modal__caja" ref={dialogo}>
            <button
              type="button"
              className="video-modal__cerrar"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar vídeo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className="video-modal__marco">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                title={block.videoTitle ?? block.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}
