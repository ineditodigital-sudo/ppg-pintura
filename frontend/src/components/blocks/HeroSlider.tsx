import { useCallback, useEffect, useRef, useState } from 'react'
import type { HeroSliderBlock } from '@/types/content'
import { ButtonLink } from '@/components/ui'
import './blocks.css'

/**
 * Hero de apertura: vídeo de fondo, logotipo PPG y mensaje.
 *
 * El vídeo va silenciado, en bucle y con `playsInline`; sin esas tres cosas
 * los navegadores móviles lo bloquean o lo abren a pantalla completa. Debajo
 * queda el póster, que es lo que se ve mientras carga y lo único que verá
 * quien tenga activado el ahorro de datos.
 *
 * Bajo `prefers-reduced-motion` el vídeo no se reproduce: se queda el póster
 * fijo. Un fondo en movimiento es exactamente lo que esa preferencia pide
 * evitar.
 */
export function HeroSlider({ block }: { block: HeroSliderBlock }) {
  const slides = block.slides ?? []
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const total = slides.length
  const go = useCallback(
    (next: number) => setIndex(((next % total) + total) % total),
    [total],
  )

  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const seconds = block.autoplaySeconds ?? 7

  useEffect(() => {
    if (total < 2 || paused || reduced || seconds <= 0) return
    const id = window.setTimeout(() => go(index + 1), seconds * 1000)
    return () => clearTimeout(id)
  }, [index, paused, reduced, seconds, total, go])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (reduced) {
      v.pause()
      return
    }
    // Algunos navegadores rechazan la promesa de `play()` si el usuario aún no
    // ha interactuado; no es un error que deba llegar a consola.
    v.play().catch(() => {})
  }, [reduced])

  /** Deslizar para cambiar de mensaje, sólo si el gesto es horizontal. */
  const tacto = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    tacto.current = { x: t.clientX, y: t.clientY }
    setPaused(true)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    setPaused(false)
    const inicio = tacto.current
    tacto.current = null
    if (!inicio || total < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - inicio.x
    const dy = t.clientY - inicio.y
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return
    go(dx < 0 ? index + 1 : index - 1)
  }

  useEffect(() => {
    const node = regionRef.current
    if (!node || total < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [index, total, go])

  if (total === 0) return null

  return (
    <div className="hero-slider">
      <div
        className="hero-slider__panel"
        ref={regionRef}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Destacados"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <video
          className="hero-video"
          ref={videoRef}
          poster="/assets/video/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/assets/video/hero.mp4" type="video/mp4" />
        </video>

        {slides.map((slide, i) => (
          <div
            key={slide.title}
            className={`hero-slide${i === index ? ' is-active' : ''}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            <div className="hero-slide__inner">
              <div className="hero-slide__text">
                {/* El logotipo abre el hero: es lo primero que dice de quién
                    es este sitio. Sólo en la diapositiva activa para no
                    duplicarlo en el árbol de accesibilidad. */}
                {i === index && (
                  <img
                    className="hero-slide__logo"
                    src="/assets/marcas/ppg-blanco.svg"
                    alt="PPG"
                    width={291}
                    height={226}
                  />
                )}
                {i === index ? (
                  <h1>{slide.title}</h1>
                ) : (
                  <div className="hero-slide__titulo-inactivo">{slide.title}</div>
                )}
                {slide.subtitle && (
                  <p className="hero-slide__subtitle">{slide.subtitle}</p>
                )}
                <div className="hero-slide__actions">
                  {slide.cta && (
                    <ButtonLink href={slide.cta.href} external={slide.cta.external}>
                      {slide.cta.label}
                    </ButtonLink>
                  )}
                  {slide.secondaryCta && (
                    <ButtonLink
                      href={slide.secondaryCta.href}
                      external={slide.secondaryCta.external}
                      variant="onDark"
                      withArrow={false}
                    >
                      {slide.secondaryCta.label}
                    </ButtonLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {total > 1 && (
          <div className="hero-slider__dots">
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                className={`hero-slider__dot${i === index ? ' is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Ir a «${slide.title}»`}
                aria-current={i === index}
              >
                <span className="hero-slider__dot-track">
                  <span
                    className="hero-slider__dot-fill"
                    style={
                      i === index && !paused && !reduced && seconds > 0
                        ? { animationDuration: `${seconds}s` }
                        : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
