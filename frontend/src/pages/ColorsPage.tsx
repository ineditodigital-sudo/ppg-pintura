import { useEffect, useState } from 'react'
import type { ColorCatalog } from '@/types/content'
import { getColors } from '@/lib/api'
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

  useSeo({
    title: 'Carta de colores | Pintura en polvo PPG',
    description:
      'Catálogo completo de pintura electrostática en polvo PPG: 83 referencias en poliéster e híbridos, con equivalencia RAL, acabado y rango de brillo.',
  })

  // La portada de la carta es oscura y también monta bajo la cabecera.
  useCabeceraSobreHero(true)

  if (!catalogo) return <PageSkeleton />

  return (
    <>
      {/* Sin migas: la banda oscura sube por detrás de la cabecera y las
          taparía. El titular ya dice dónde estás, y el menú sigue arriba. */}
      <Section theme="dark" className="carta__portada">
        <Container>
          <span className="eyebrow">Catálogo PPG</span>
          {/* Un recuento no es un titular: «83 referencias» dice cuántas hay,
              no qué es esto. El nombre del documento va delante y la cifra
              pasa a la entradilla, donde sí aporta. */}
          <h1>Carta de color · Pintura en polvo PPG</h1>
          <p className="carta__entradilla">
            {catalogo.colors.length} referencias de catálogo en poliéster e
            híbridos, lisas, texturizadas y gofradas. Cada una con su
            equivalencia RAL y su rango de brillo, tal como los publica PPG.
            Suministro en Aguascalientes.
          </p>
          <p className="carta__aviso">
            El color de pantalla es orientativo: el acabado final depende de la
            iluminación, el sustrato y la aplicación. Para decidir, pide la
            carta física.
          </p>
          <ButtonLink href="/contacto">Solicitar carta física</ButtonLink>
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
