import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Block, BusinessLine } from '@/types/content'
import { getBusinessLines } from '@/lib/api'
import { useSeo } from '@/lib/useSeo'
import { resumirSeo } from '@/lib/resumirSeo'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { PageSkeleton } from './PageSkeleton'
import { NotFound } from './NotFound'

/**
 * Plantilla única para las once líneas de negocio.
 *
 * Compone los bloques a partir de los datos de la línea, de modo que añadir
 * una línea nueva es añadir una entrada en `business-lines.json` — no un
 * archivo de página ni un componente.
 */
function buildBlocks(line: BusinessLine, others: BusinessLine[]): Block[] {
  return [
    {
      type: 'hero',
      variant: 'split',
      eyebrow: line.name,
      title: line.headline,
      subtitle: line.description,
      image: line.image,
      cta: { label: 'Solicitar cotización', href: '/contacto' },
      secondaryCta: {
        label: 'WhatsApp',
        href: 'https://api.whatsapp.com/send?phone=523333892775',
      },
    },
    {
      type: 'cardGrid',
      eyebrow: 'Cómo trabajamos',
      title: 'Del sustrato al acabado final',
      columns: 3,
      variant: 'text',
      items: [
        {
          title: 'Asesoría técnica',
          description:
            'Te ayudamos a elegir la resina, el brillo y el espesor según el sustrato y las condiciones a las que estará expuesta la pieza.',
        },
        {
          title: 'Servicio de maquila',
          description:
            'Si no cuentas con línea de aplicación propia, recubrimos tus piezas en nuestras instalaciones de Aguascalientes.',
        },
        {
          title: 'Color a la carta',
          description:
            'Color de catálogo PPG con equivalencia RAL, e igualación bajo pedido en la planta de San Juan del Río.',
        },
      ],
    },
    // Las cifras las trae cada línea. Sin ellas no hay bloque: es preferible
    // a repetir en pintura líquida las de la pintura en polvo.
    ...(line.stats?.length
      ? [{ type: 'statGrid' as const, theme: 'brand' as const, items: line.stats }]
      : []),
    {
      type: 'cardGrid',
      eyebrow: 'Otras líneas',
      title: 'El resto de nuestro catálogo',
      columns: 3,
      variant: 'text',
      items: others.map((other) => ({
        title: other.name,
        description: other.headline,
        href: other.href,
      })),
    },
    {
      type: 'ctaBanner',
      theme: 'dark',
      title: `¿Necesitas ${line.name.toLowerCase()}?`,
      description:
        'Cuéntanos el sustrato, el volumen y las condiciones de servicio, y te preparamos una cotización.',
      // Sin imagen el bloque cae en la variante `plain` y queda como un
      // rectángulo azul liso, que era justo lo que se veía aquí.
      image: line.image,
      cta: { label: 'Solicitar cotización', href: '/contacto' },
    },
  ]
}

export function BusinessLinePage() {
  const { slug = '' } = useParams()
  const [lines, setLines] = useState<BusinessLine[] | null>(null)

  useEffect(() => {
    let active = true
    getBusinessLines().then((data) => {
      if (active) setLines(data)
    })
    return () => {
      active = false
    }
  }, [])

  const line = lines?.find((item) => item.slug === slug) ?? null

  useSeo(
    line
      ? {
          title: `${line.name} | PPG`,
          description: resumirSeo(line.description),
        }
      : undefined,
  )

  if (!lines) return <PageSkeleton />
  if (!line) return <NotFound />

  const others = lines.filter((item) => item.slug !== slug)

  return (
    <BlockRenderer
      blocks={buildBlocks(line, others)}
      breadcrumbs={[
        { label: 'Inicio', href: '/' },
        { label: 'Productos', href: '/productos/pintura-en-polvo' },
        { label: line.name },
      ]}
    />
  )
}
