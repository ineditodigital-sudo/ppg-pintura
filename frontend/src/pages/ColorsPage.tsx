import { useEffect, useState } from 'react'
import type { ColorCatalog } from '@/types/content'
import { getColors } from '@/lib/api'
import { PORTADA_POR_DEFECTO } from '@/lib/stock'
import { useSeo } from '@/lib/useSeo'
import { useCabeceraSobreHero } from '@/lib/useCabeceraSobreHero'
import { ExploradorColores } from '@/components/blocks/ColorCatalog'
import { ButtonLink, Container, Section } from '@/components/ui'
import { PageSkeleton } from './PageSkeleton'
import './colors.css'

/**
 * Carta de colores del catálogo PPG de pintura en polvo.
 *
 * Los 83 colores salen del PDF oficial: código, nombre, equivalencia RAL,
 * brillo y el hexadecimal leído del vector del documento, no muestreado a ojo.
 *
 * La página es la respuesta a algo que llamaba la atención: una empresa que
 * vende color no enseñaba ninguno.
 *
 * Aquí sólo queda la portada y el SEO: las pestañas, el buscador y la rejilla
 * son `ExploradorColores`, que comparte con la página de pintura en polvo.
 */
export function ColorsPage() {
  const [catalogo, setCatalogo] = useState<ColorCatalog | null>(null)

  useEffect(() => {
    let vivo = true
    getColors().then((d) => {
      if (vivo) setCatalogo(d)
    })
    return () => {
      vivo = false
    }
  }, [])

  // Todo esto se edita en la Carta de color. Los valores de fábrica quedan
  // como red de seguridad si una clave falta.
  useSeo({
    title: catalogo?.seo?.title ?? PORTADA_POR_DEFECTO.seoTitle,
    description: catalogo?.seo?.description ?? PORTADA_POR_DEFECTO.seoDescription,
  })

  // La portada de la carta es oscura y también monta bajo la cabecera.
  useCabeceraSobreHero(true)

  if (!catalogo) return <PageSkeleton />

  const portada = catalogo.portada ?? {}
  // `{n}` lo escribe quien edita el texto; aquí sólo se sustituye por el
  // recuento real, para que no se quede desfasado al añadir referencias.
  const entradilla = (portada.entradilla ?? PORTADA_POR_DEFECTO.entradilla)
    .split('{n}')
    .join(String(catalogo.colors.length))

  return (
    <>
      {/* Sin migas: la banda oscura sube por detrás de la cabecera y las
          taparía. El titular ya dice dónde estás, y el menú sigue arriba. */}
      <Section theme="dark" className="carta__portada">
        <Container>
          <span className="eyebrow">{portada.eyebrow ?? PORTADA_POR_DEFECTO.eyebrow}</span>
          {/* Un recuento no es un titular: «83 referencias» dice cuántas hay,
              no qué es esto. El nombre del documento va delante y la cifra
              pasa a la entradilla, donde sí aporta. */}
          <h1>{portada.title ?? PORTADA_POR_DEFECTO.title}</h1>
          <p className="carta__entradilla">{entradilla}</p>
          <p className="carta__aviso">{portada.aviso ?? PORTADA_POR_DEFECTO.aviso}</p>
          <ButtonLink href={portada.cta?.href ?? PORTADA_POR_DEFECTO.ctaHref}>
            {portada.cta?.label ?? PORTADA_POR_DEFECTO.ctaLabel}
          </ButtonLink>
        </Container>
      </Section>

      <Section>
        <Container>
          <ExploradorColores catalogo={catalogo} />
        </Container>
      </Section>
    </>
  )
}
