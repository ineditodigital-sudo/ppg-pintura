import { Fragment } from 'react'
import type { Block, Breadcrumb } from '@/types/content'
import { useCabeceraSobreHero } from '@/lib/useCabeceraSobreHero'
import { Breadcrumbs, Container } from '@/components/ui'
import {
  CardGrid,
  ContentBanner,
  CtaBanner,
  Hero,
  LinkList,
  MediaGrid,
  Quote,
  RichText,
  StatGrid,
  Timeline,
} from './Blocks'
import { VideoFeature } from './VideoFeature'
import { ContactForm } from './ContactForm'
import { BrandStrip } from './BrandStrip'
import { HeroSlider } from './HeroSlider'
import { ColorShowcase } from './ColorShowcase'
import { SpecList } from './SpecList'
import { ProductShowcase } from './ProductShowcase'
import { ColorCarousel } from './ColorCarousel'
import { ColorCatalogBlock } from './ColorCatalog'

/**
 * ¿Este bloque monta por detrás de la cabecera?
 *
 * Sólo el carrusel de portada y la variante `compact` suben con margen
 * negativo (ver `blocks.css`). La variante `feature` es un panel con esquinas
 * redondeadas y aire alrededor: encima de ella la cabecera transparente cae
 * sobre el fondo claro de la página y su texto blanco desaparece, que es lo
 * que pasaba en las páginas de sector.
 */
function montaBajoLaCabecera(block: Block | undefined): boolean {
  if (!block) return false
  if (block.type === 'heroSlider') return true
  return block.type === 'hero' && block.variant === 'compact'
}

/**
 * Traduce el array de bloques que entrega la API en componentes React.
 *
 * Añadir un tipo nuevo al CMS es: extender `Block` en `types/content.ts`,
 * escribir el componente y registrarlo en el `switch` de abajo.
 *
 * Las migas de pan se pasan aquí y no antes del renderizador a propósito: el
 * hero de apertura sube con un margen negativo para quedar debajo de la
 * cabecera, así que cualquier elemento por delante lo empuja hacia abajo y
 * descubre la cabecera sobre el fondo claro. Van justo después del hero.
 */
export function BlockRenderer({
  blocks,
  breadcrumbs,
}: {
  blocks: Block[]
  breadcrumbs?: Breadcrumb[]
}) {
  const abreConHero = montaBajoLaCabecera(blocks[0])

  useCabeceraSobreHero(abreConHero)

  const migas = breadcrumbs?.length ? (
    <Container>
      <Breadcrumbs items={breadcrumbs} />
    </Container>
  ) : null

  return (
    <>
      {/* Sin hero de apertura no hay nada que montar: las migas encabezan. */}
      {!abreConHero && migas}

      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`
        const contenido = renderizar(block, key)

        if (index === 0 && abreConHero && migas) {
          return (
            <Fragment key={key}>
              {contenido}
              {migas}
            </Fragment>
          )
        }

        return contenido
      })}
    </>
  )
}

function renderizar(block: Block, key: string) {
  switch (block.type) {
    case 'hero':
      return <Hero key={key} block={block} />
    case 'heroSlider':
      return <HeroSlider key={key} block={block} />
    case 'richText':
      return <RichText key={key} block={block} />
    case 'cardGrid':
      return <CardGrid key={key} block={block} />
    case 'mediaGrid':
      return <MediaGrid key={key} block={block} />
    case 'contentBanner':
      return <ContentBanner key={key} block={block} />
    case 'videoFeature':
      return <VideoFeature key={key} block={block} />
    case 'statGrid':
      return <StatGrid key={key} block={block} />
    case 'timeline':
      return <Timeline key={key} block={block} />
    case 'ctaBanner':
      return <CtaBanner key={key} block={block} />
    case 'linkList':
      return <LinkList key={key} block={block} />
    case 'quote':
      return <Quote key={key} block={block} />
    case 'contactForm':
      return <ContactForm key={key} block={block} />
    case 'brandStrip':
      return <BrandStrip key={key} block={block} />
    case 'colorShowcase':
      return <ColorShowcase key={key} block={block} />
    case 'specList':
      return <SpecList key={key} block={block} />
    case 'productShowcase':
      return <ProductShowcase key={key} />
    case 'colorCarousel':
      return <ColorCarousel key={key} {...block} />
    case 'colorCatalog':
      return <ColorCatalogBlock key={key} />
    default: {
      // Un bloque desconocido (p. ej. creado en el CMS antes de existir
      // aquí) se ignora en producción en lugar de romper la página.
      if (import.meta.env.DEV) {
        console.warn('Bloque sin componente registrado:', block)
      }
      return null
    }
  }
}
