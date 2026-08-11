import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Block, Market, Templates } from '@/types/content'
import { getMarkets, getTemplates } from '@/lib/api'
import { enlaceWhatsApp } from '@/lib/social'
import { useSitio } from '@/lib/useSitio'
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
 *
 * Lo que no sale del sector sale de `templates.mercados`, editable desde el
 * panel. Los valores por defecto se conservan aquí para que una clave que
 * falte no rompa las seis páginas a la vez.
 */
const POR_DEFECTO = {
  cta: { label: 'Solicitar cotización', href: '/contacto' },
  exige: {
    eyebrow: 'Qué exige este sector',
    title: 'Lo que decide el resultado en {sector}',
    body: 'Aquí pesan sobre todo {exigencias}. Cada una condiciona la química del recubrimiento y la forma de aplicarlo, así que el sistema se elige a partir de ellas y no al revés.',
    image: {
      src: '/assets/csmx/aplicacion-polvo.webp',
      alt: 'Aplicación electrostática de pintura en polvo',
    },
  },
  sustratos: {
    eyebrow: 'Sustratos habituales',
    title: 'Sobre qué aplicamos',
    description:
      'Cada material impone su propio pretratamiento. Esto es lo que tenemos en cuenta antes de recubrir.',
  },
  suministro: {
    eyebrow: 'Cómo trabajamos',
    title: 'Suministro con respaldo técnico',
    body: 'Te suministramos el material y el acompañamiento del fabricante: elección de la química, el brillo y el espesor según el sustrato, y validación del sistema antes de llevarlo a línea.',
    image: { src: '/assets/csmx/pintura-polvo-azul.webp', alt: 'Pintura en polvo PPG' },
    cta: { label: 'Cotizar un proyecto', href: '/contacto' },
  },
  recomendado: {
    eyebrow: 'Sistema recomendado',
    cierre:
      'La recomendación final depende de tu pieza, tu proceso y las condiciones a las que estará expuesta. Cuéntanoslas y la ajustamos contigo.',
  },
  otros: { eyebrow: 'Otros sectores', title: 'Dónde más trabajamos' },
  cierre: {
    title: '¿Tienes algún proyecto?',
    description:
      'Respaldamos cada especificación con producto PPG y el criterio técnico para elegirlo. Cuéntanos el reto y trabajamos la solución contigo.',
    image: { src: '/assets/csmx/industria.webp', alt: 'Planta industrial' },
  },
} as const

/** «a, b y c» — para redactar la entradilla con los datos del propio sector. */
function enumerar(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

function buildBlocks(
  market: Market,
  others: Market[],
  plantilla: Templates['mercados'],
  whatsapp: string | undefined,
): Block[] {
  const exigencias = enumerar(
    market.exigencias.map((e) => e.title.toLowerCase()),
  )

  // Los marcadores los escribe quien edita el texto en el panel; aquí sólo se
  // sustituyen. Se hace con `split`/`join` y no con una expresión regular
  // porque el texto es del usuario y no tiene por qué estar escapado.
  const rellenar = (texto: string) =>
    texto.split('{sector}').join(market.name.toLowerCase()).split('{exigencias}').join(exigencias)

  const exige = plantilla?.exige ?? {}
  const sustratos = plantilla?.sustratos ?? {}
  const suministro = plantilla?.suministro ?? {}
  const recomendado = plantilla?.recomendado ?? {}
  const cierre = plantilla?.cierre ?? {}

  return [
    {
      type: 'hero',
      variant: 'feature',
      eyebrow: market.name,
      title: market.headline,
      subtitle: market.description,
      image: market.image,
      icon: market.icon,
      cta: plantilla?.heroCta ?? POR_DEFECTO.cta,
      ...(whatsapp
        ? { secondaryCta: { label: 'WhatsApp', href: whatsapp } }
        : {}),
    },
    {
      // Primera sección con imagen: la banda de aplicación es material propio
      // del cliente y de 960 px, así que aquí sí se ve a resolución nativa.
      type: 'contentBanner',
      imageSide: 'left',
      eyebrow: exige.eyebrow ?? POR_DEFECTO.exige.eyebrow,
      title: rellenar(exige.title ?? POR_DEFECTO.exige.title),
      body: rellenar(exige.body ?? POR_DEFECTO.exige.body),
      image: exige.image ?? POR_DEFECTO.exige.image,
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
      eyebrow: sustratos.eyebrow ?? POR_DEFECTO.sustratos.eyebrow,
      title: sustratos.title ?? POR_DEFECTO.sustratos.title,
      description: sustratos.description ?? POR_DEFECTO.sustratos.description,
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
      eyebrow: suministro.eyebrow ?? POR_DEFECTO.suministro.eyebrow,
      title: suministro.title ?? POR_DEFECTO.suministro.title,
      body: suministro.body ?? POR_DEFECTO.suministro.body,
      image: suministro.image ?? POR_DEFECTO.suministro.image,
      cta: suministro.cta ?? POR_DEFECTO.suministro.cta,
    },
    {
      type: 'richText',
      align: 'center',
      eyebrow: recomendado.eyebrow ?? POR_DEFECTO.recomendado.eyebrow,
      paragraphs: [
        market.recomendado,
        recomendado.cierre ?? POR_DEFECTO.recomendado.cierre,
      ],
    },
    {
      type: 'cardGrid',
      eyebrow: plantilla?.otros?.eyebrow ?? POR_DEFECTO.otros.eyebrow,
      title: plantilla?.otros?.title ?? POR_DEFECTO.otros.title,
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
      title: cierre.title ?? POR_DEFECTO.cierre.title,
      description: cierre.description ?? POR_DEFECTO.cierre.description,
      image: cierre.image ?? POR_DEFECTO.cierre.image,
      cta: cierre.cta ?? POR_DEFECTO.cta,
    },
  ]
}

export function MarketPage() {
  const { slug = '' } = useParams()
  const [markets, setMarkets] = useState<Market[] | null>(null)
  const [plantillas, setPlantillas] = useState<Templates>({})
  const site = useSitio()

  useEffect(() => {
    let active = true

    void Promise.all([getMarkets(), getTemplates()]).then(([data, tpl]) => {
      if (!active) return
      setPlantillas(tpl)
      setMarkets(data)
    })

    return () => {
      active = false
    }
  }, [])

  const market = markets?.find((m) => m.slug === slug) ?? null

  useSeo(
    market
      ? {
          // El patrón se edita en Textos de producto y sector; «{nombre}»
          // es donde entra el de esta página.
          title: (plantillas.mercados?.seoTitle ?? '{nombre} | Recubrimientos PPG')
            .split('{nombre}')
            .join(market.name),
          description: resumirSeo(market.description),
        }
      : undefined,
  )

  if (!markets) return <PageSkeleton />
  if (!market) return <NotFound />

  const others = markets.filter((m) => m.slug !== slug)

  return (
    <BlockRenderer
      blocks={buildBlocks(market, others, plantillas.mercados, enlaceWhatsApp(site))}
      breadcrumbs={[
        { label: 'Inicio', href: '/' },
        { label: 'Mercados', href: '/mercados' },
        { label: market.name },
      ]}
    />
  )
}
