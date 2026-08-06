import { useEffect, useRef } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * Margen para decidir que el IntersectionObserver no va a responder.
 *
 * Un observer vivo entrega siempre una primera observación de cada elemento
 * en cuanto se registra, esté o no en pantalla. Si pasado este tiempo no ha
 * llamado ni una vez, es que no funciona en ese navegador y hay que mostrar
 * el contenido igualmente.
 */
const OBSERVER_TIMEOUT_MS = 1200

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION).matches
  )
}

function isInViewport(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0
}

function show(node: HTMLElement) {
  node.classList.add('is-visible')
}

function revealIfImmediate(node: HTMLElement, timers: number[]): boolean {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    show(node)
    return true
  }

  if (isInViewport(node)) {
    timers.push(window.setTimeout(() => show(node), 30))
    return true
  }

  return false
}

/**
 * Observa los nodos y, si el observer no da señales de vida, los muestra.
 *
 * Esta red de seguridad existe porque la animación de entrada parte de
 * `opacity: 0`: sin ella, cualquier fallo del observer deja la página entera
 * en blanco. Vale más perder la animación que perder el contenido.
 */
function observeWithFallback(nodes: HTMLElement[], options: IntersectionObserverInit) {
  let pendientes = new Set(nodes)

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const nodo = entry.target as HTMLElement
        show(nodo)
        pendientes.delete(nodo)
        observer.unobserve(nodo)
      }
    }
  }, options)

  nodes.forEach((n) => observer.observe(n))

  /**
   * Red de seguridad por scroll, en paralelo al observer.
   *
   * El observer solo no basta: si el documento no scrollea contra el viewport
   * —bastaba con que el <body> tuviera `overflow-x: hidden` para convertirse
   * en su propio contenedor— nunca dispara y la página entera se queda en
   * blanco, porque la animación parte de `opacity: 0`.
   *
   * Esta comprobación mide la posición real en cada scroll. Es barata y no
   * depende de ninguna API que pueda quedar desconectada del contenedor que
   * de verdad se está moviendo.
   */
  const revisar = () => {
    if (pendientes.size === 0) {
      window.removeEventListener('scroll', revisar)
      return
    }
    const alto = window.innerHeight
    for (const nodo of [...pendientes]) {
      const rect = nodo.getBoundingClientRect()
      // Un margen generoso: vale más revelar algo un poco antes de tiempo
      // que dejarlo invisible.
      if (rect.top < alto * 1.15 && rect.bottom > -alto * 0.15) {
        show(nodo)
        pendientes.delete(nodo)
        observer.unobserve(nodo)
      }
    }
  }

  window.addEventListener('scroll', revisar, { passive: true })
  window.addEventListener('resize', revisar, { passive: true })

  revisar()

  /**
   * Tope duro: pase lo que pase, a los 1,2 s el contenido se ve.
   *
   * Es innegociable. La animación parte de `opacity: 0`, así que cualquier
   * fallo —observer que no dispara, scroll que vive en otro contenedor,
   * navegador que no soporta algo— deja la página en blanco, y una web
   * invisible es infinitamente peor que una sin animación. Se ha visto pasar
   * en producción, así que la garantía no depende de ninguna API.
   */
  const guard = window.setTimeout(() => {
    pendientes.forEach(show)
    pendientes.clear()
    observer.disconnect()
    window.removeEventListener('scroll', revisar)
  }, OBSERVER_TIMEOUT_MS)

  return () => {
    clearTimeout(guard)
    window.removeEventListener('scroll', revisar)
    window.removeEventListener('resize', revisar)
    observer.disconnect()
    pendientes = new Set()
  }
}

/** Añade `is-visible` cuando el elemento entra en el viewport. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const timers: number[] = []

    if (delayMs) node.style.transitionDelay = `${delayMs}ms`
    if (revealIfImmediate(node, timers)) {
      return () => timers.forEach(clearTimeout)
    }

    const stop = observeWithFallback([node], {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px',
    })

    return () => {
      timers.forEach(clearTimeout)
      stop()
    }
  }, [delayMs])

  return ref
}

/**
 * Variante para contenedores: escalona la aparición de los hijos directos
 * que lleven la clase `reveal`.
 */
export function useRevealGroup<T extends HTMLElement = HTMLDivElement>(
  stepMs = 90,
  /**
   * Marca de contenido. Los bloques que traen sus datos de la API devuelven
   * `null` en el primer render, así que cuando este efecto se ejecutaba no
   * había nada que observar y no volvía a ejecutarse jamás: las tarjetas se
   * quedaban en `opacity: 0` para siempre. Pasando aquí el dato, el efecto
   * se repite en cuanto el contenido existe.
   */
  listo: unknown = null,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Todos los descendientes, no sólo los hijos directos: en varios bloques
    // las tarjetas van dentro de una columna anidada y quedaban fuera.
    const children = Array.from(node.querySelectorAll<HTMLElement>('.reveal'))
    if (children.length === 0) return

    const timers: number[] = []

    children.forEach((child, index) => {
      child.style.transitionDelay = `${index * stepMs}ms`
    })

    const pending = children.filter((child) => !revealIfImmediate(child, timers))

    if (pending.length === 0) {
      return () => timers.forEach(clearTimeout)
    }

    const stop = observeWithFallback(pending, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    })

    return () => {
      timers.forEach(clearTimeout)
      stop()
    }
  }, [stepMs, listo])

  return ref
}
