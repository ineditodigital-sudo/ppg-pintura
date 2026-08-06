import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Site } from '@/types/content'
import './WhatsAppFab.css'

/**
 * Botón flotante de WhatsApp, abajo a la derecha.
 *
 * El número sale de `site.json` —el mismo que ya usan el header, el footer y
 * los banners—, así que se cambia desde el CMS en un único sitio. Si no hay
 * número configurado el botón no se pinta: es preferible que no exista a que
 * lleve a una conversación vacía.
 *
 * **Aparece en todas las páginas.** Antes se pedía haber bajado 400 px, y en
 * las páginas que caben en una pantalla —contacto, un mercado corto, el 404—
 * ese scroll no llegaba nunca: el botón existía en el DOM y no se veía jamás.
 * Ahora sólo espera cuando hay una portada a pantalla completa que taparía,
 * que es el caso para el que se pensó la espera; en el resto sale de entrada.
 */
export function WhatsAppFab({ site }: { site: Site }) {
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    // El hero a pantalla completa sólo lo monta la portada. Si no está, no hay
    // nada que tapar y el botón entra desde el primer píxel.
    const hero = document.querySelector('.hero-slider')

    if (!hero) {
      setVisible(true)
      return
    }

    const alScroll = () => {
      // Visible en cuanto la portada deja de ocupar la pantalla. Se mide
      // contra el alto real del hero y no contra un número fijo: si el hero
      // cambia de alto, el umbral lo sigue solo.
      const limite = hero.getBoundingClientRect().height * 0.7
      setVisible(window.scrollY > limite)
    }

    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    window.addEventListener('resize', alScroll)
    return () => {
      window.removeEventListener('scroll', alScroll)
      window.removeEventListener('resize', alScroll)
    }
    // La ruta entra en las dependencias porque el botón vive fuera de `Routes`
    // y no se vuelve a montar al navegar: sin esto, al pasar de la portada a
    // otra página se quedaba con el estado que tuviera.
  }, [pathname])

  const href = site.social?.find((s) => s.network === 'whatsapp')?.href
  if (!href) return null

  return (
    <a
      className={`wa-fab${visible ? ' is-visible' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {/* Glifo oficial de WhatsApp. Va inline para no pedir otro archivo y
          para que herede el color en vez de traer el verde quemado. */}
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.895 6.994c-.003 5.45-4.437 9.886-9.887 9.886m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
      </svg>
      {/* La etiqueta es el motivo de que se note. Un círculo verde se lee como
          adorno; con texto se lee como una vía de contacto y dice para qué. */}
      <span className="wa-fab__texto">Cotizar por WhatsApp</span>
    </a>
  )
}
