import { useEffect } from 'react'
import type { Seo } from '@/types/content'

/** Imagen que se ve al compartir el enlace cuando la página no propone otra. */
const IMAGEN_POR_DEFECTO = '/assets/csmx/aplicacion-polvo.webp'

function setMeta(selector: string, attr: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    const [key, val] = selector.replace(/^meta\[|\]$/g, '').split('=')
    tag.setAttribute(key, val.replace(/"/g, ''))
    document.head.appendChild(tag)
  }
  tag.setAttribute(attr, value)
}

/**
 * URL canónica de la página actual.
 *
 * Sin ella, cualquier variante con parámetros —los `?utm_source=` de una
 * campaña, por ejemplo— se indexa como una página distinta y el valor se
 * reparte entre copias. Se construye sin la cadena de consulta a propósito.
 */
function setCanonical(url: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = 'canonical'
    document.head.appendChild(tag)
  }
  tag.href = url
}

/** Aplica título, descripción, canónica y metadatos sociales al cambiar de página. */
export function useSeo(seo: Seo | undefined) {
  useEffect(() => {
    if (!seo) return

    const url = window.location.origin + window.location.pathname
    const imagen = window.location.origin + IMAGEN_POR_DEFECTO

    document.title = seo.title
    setMeta('meta[name="description"]', 'content', seo.description)
    setMeta(
      'meta[name="robots"]',
      'content',
      seo.noindex ? 'noindex, follow' : 'index, follow',
    )

    setCanonical(url)

    setMeta('meta[property="og:title"]', 'content', seo.title)
    setMeta('meta[property="og:description"]', 'content', seo.description)
    setMeta('meta[property="og:type"]', 'content', 'website')
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:image"]', 'content', imagen)
    setMeta('meta[property="og:locale"]', 'content', 'es_MX')
    setMeta('meta[property="og:site_name"]', 'content', 'PPG')

    // Sin tarjeta declarada, al compartir en X sale sólo un enlace pelado.
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', seo.title)
    setMeta('meta[name="twitter:description"]', 'content', seo.description)
    setMeta('meta[name="twitter:image"]', 'content', imagen)
  }, [seo])
}
