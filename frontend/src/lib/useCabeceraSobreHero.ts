import { useEffect } from 'react'

/**
 * Marca el `<body>` mientras la página abre con un hero oscuro, para que la
 * cabecera se vuelva transparente y monte encima.
 *
 * Antes lo resolvía `body:has(.hero-slider, .hero--compact, …)` desde el CSS.
 * Funcionaba en la portada y fallaba en el resto: el hero de una página
 * interna se monta cuando responde la API —después del primer pintado— y el
 * navegador no volvía a evaluar el `:has()`. La cabecera se quedaba blanca
 * sobre el hero oscuro, con su propio texto y su logotipo en blanco encima:
 * invisibles.
 *
 * Con una clase que pone y quita React no hay nada que reevaluar.
 */
export function useCabeceraSobreHero(activo: boolean) {
  useEffect(() => {
    if (!activo) return

    document.body.classList.add('con-hero')

    return () => {
      document.body.classList.remove('con-hero')
    }
  }, [activo])
}
