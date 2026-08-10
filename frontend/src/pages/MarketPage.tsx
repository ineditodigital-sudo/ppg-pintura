import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Block, Market } from '@/types/content'
import { getMarkets } from '@/lib/api'
import { fichaSustrato } from '@/lib/sustratos'
import { resumirSeo } from '@/lib/resumirSeo'
import { useSeo } from '@/lib/useSeo'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { PageSkeleton } from './PageSkeleton'
import { NotFound } from './NotFound'

/**
 * Página de sector.
 *
 * Igual que `BusinessLinePage`, los bloques se componen desde los datos: añadir
 * un sector es añadir una entrada en `markets.json`, sin crear archivos ni
 * tocar el router.
 */
/** «a, b y c» — para redactar la entradilla con los datos del propio sector. */
function enumerar(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

function buildBlocks(market: Market, others: Market[]): Block[] {
  const exigencias = enumerar(
    market.exigencias.map((e) => e.title.toLowerCase()),
  )

  return [
    {
      type: 'hero',
      variant: 'feature',
      eyebrow: market.name,
      title: market.headline,
      subtitle: market.description,
      image: market.image,
      icon: market.icon,
      cta: { label: 'Solicitar cotización', href: '/contacto' },
      secondaryCta: {
        label: 'WhatsApp',
        href: 'https://api.whatsapp.com/send?phone=523333892775',
      },
    },
    {
      // Primera sección con imagen: la banda de aplicación es material propio
      // del cliente y de 960 px, así que aquí sí se ve a resolución nativa.
      type: 'contentBanner',
      imageSide: 'left',
      eyebrow: 'Qué exige este sector',
      title: `Lo que decide el resultado en ${market.name.toLowerCase()}`,
      body: `Aquí pesan sobre todo ${exigencias}. Cada una condiciona la química del recubrimiento y la forma de aplicarlo, así que el sistema se elige a partir de ellas y no al revés.`,
      image: {
        src: '/assets/csmx/aplicacion-polvo.webp',
        alt: 'Aplicación electrostática de pintura en polvo',
      },
    },
    {
      type: 'cardGrid',
      columns: 3,
      variant: 'text',
      items: market.exigencias.map((e) => ({
        title: e.title,
        description: e.description,
        icon: e.icon,
      })),
    },
    {
      // Ficha, no tarjetas: el nombre del material solo no dice nada, y tres
      // cajas con el mismo icono repetido se leían como relleno.
      type: 'specList',
      eyebrow: 'Sustratos habituales',
      title: 'Sobre qué aplicamos',
      description:
        'Cada material impone su propio pretratamiento. Esto es lo que tenemos en cuenta antes de recubrir.',
      theme: 'light',
      columns: 2,
      items: market.sustratos.map((s) => {
        const ficha = fichaSustrato(s)
        return { term: s, note: ficha.note, icon: ficha.icon }
      }),
    },
    {
      // Imágenes distintas en cada banda: repetir la misma foto tres veces
      // en una página la delata como relleno.
      type: 'contentBanner',
      imageSide: 'right',
      eyebrow: 'Cómo trabajamos',
      title: 'Suministro con respaldo técnico',
      body: 'Te suministramos el material y el acompañamiento del fabricante: elección de la química, el brillo y el espesor según el sustrato, y validación del sistema antes de llevarlo a línea.',
      image: { src: '/assets/csmx/pintura-polvo-azul.webp', alt: 'Pintura en polvo PPG' },
      cta: { label: 'Cotizar un proyecto', href: '/contacto' },
    },
    {
      type: 'richText',
      align: 'center',
      eyebrow: 'Sistema recomendado',
      paragraphs: [
        market.recomendado,
        'La recomendación final depende de tu pieza, tu proceso y las condiciones a las que estará expuesta. Cuéntanoslas y la ajustamos contigo.',
      ],
    },
    {
      type: 'cardGrid',
      eyebrow: 'Otros sectores',
      title: 'Dónde más trabajamos',
      columns: 3,
      variant: 'thumb',
      theme: 'light',
      items: others.map((o) => ({
        title: o.name,
        description: o.headline,
        image: o.image,
        href: `/mercados/${o.slug}`,
      })),
    },
    {
      type: 'ctaBanner',
      title: '¿Tienes algún proyecto?',
      description:
        'Respaldamos cada especificación con producto PPG y el criterio técnico para elegirlo. Cuéntanos el reto y trabajamos la solución contigo.',
      image: { src: '/assets/csmx/industria.webp', alt: 'Planta industrial' },
      cta: { label: 'Solicitar cotización', href: '/contacto' },
    },
  ]
}

export function MarketPage() {
  const { slug = '' } = useParams()
  const [markets, setMarkets] = useState<Market[] | null>(null)

  useEffect(() => {
    let active = true
    getMarkets().then((data) => {
      if (active) setMarkets(data)
    })
    return () => {
      active = false
    }
  }, [])

  const market = markets?.find((m) => m.slug === slug) ?? null

  useSeo(
    market
      ? {
          title: `${market.name} | Recubrimientos PPG`,
          description: resumirSeo(market.description),
        }
      : undefined,
  )

  if (!markets) return <PageSkeleton />
  if (!market) return <NotFound />

  const others = markets.filter((m) => m.slug !== slug)

  return (
    <BlockRenderer
      blocks={buildBlocks(market, others)}
      breadcrumbs={[
        { label: 'Inicio', href: '/' },
        { label: 'Mercados', href: '/mercados' },
        { label: market.name },
      ]}
    />
  )
}
