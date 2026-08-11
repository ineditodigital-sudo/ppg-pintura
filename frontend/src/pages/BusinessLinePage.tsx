import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Block, BusinessLine, Templates } from '@/types/content'
import { getBusinessLines, getTemplates } from '@/lib/api'
import { enlaceWhatsApp } from '@/lib/social'
import { useSitio } from '@/lib/useSitio'
import { useSeo } from '@/lib/useSeo'
import { resumirSeo } from '@/lib/resumirSeo'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { PageSkeleton } from './PageSkeleton'
import { NotFound } from './NotFound'

/**
 * Plantilla única para las líneas de negocio.
 *
 * Compone los bloques a partir de los datos de la línea, de modo que añadir
 * una línea nueva es añadir una entrada en `business-lines.json` — no un
 * archivo de página ni un componente.
 *
 * Todo lo que no sale de la línea sale de `templates.lineas`, que se edita en
 * el panel. Antes estaba escrito aquí: existía en el sitio publicado pero no
 * en el CMS, así que el cliente no podía tocar ni un antetítulo de sus tres
 * páginas de producto. Los valores por defecto se conservan para que una
 * clave que falte no deje un hueco.
 */
const POR_DEFECTO = {
  cta: { label: 'Solicitar cotización', href: '/contacto' },
  comoTrabajamos: {
    eyebrow: 'Cómo trabajamos',
    title: 'Del sustrato al acabado final',
  },
  otras: { eyebrow: 'Otras líneas', title: 'El resto de nuestro catálogo' },
  cierre: {
    title: '¿Tienes algún proyecto?',
    description:
      'Respaldamos cada especificación con producto PPG y el criterio técnico para elegirlo. Cuéntanos el reto y trabajamos la solución contigo.',
  },
} as const

function buildBlocks(
  line: BusinessLine,
  others: BusinessLine[],
  plantilla: Templates['lineas'],
  whatsapp: string | undefined,
): Block[] {
  const heroCta = plantilla?.heroCta ?? POR_DEFECTO.cta
  const cierre = plantilla?.cierre ?? {}
  const servicios = plantilla?.comoTrabajamos?.items ?? []

  return [
    {
      type: 'hero',
      variant: 'split',
      eyebrow: line.name,
      title: line.headline,
      subtitle: line.description,
      image: line.image,
      cta: heroCta,
      // El número sale de Ajustes. Sin número no se pinta el botón.
      ...(whatsapp
        ? { secondaryCta: { label: 'WhatsApp', href: whatsapp } }
        : {}),
    },
    // Sin tarjetas configuradas no se monta la sección: antes un hueco que un
    // título de sección sobre nada.
    ...(servicios.length
      ? [
          {
            type: 'cardGrid' as const,
            eyebrow: plantilla?.comoTrabajamos?.eyebrow ?? POR_DEFECTO.comoTrabajamos.eyebrow,
            title: plantilla?.comoTrabajamos?.title ?? POR_DEFECTO.comoTrabajamos.title,
            columns: 3 as const,
            variant: 'text' as const,
            items: servicios,
          },
        ]
      : []),
    // La carta completa —con pestañas y buscador—, no el carrusel: quien entra
    // en la página del producto viene a buscar un color concreto, y quince
    // muestras sueltas sin filtro no responden a eso.
    // Sólo donde el catálogo corresponde a la línea.
    ...(line.showColors ? [{ type: 'colorCatalog' as const }] : []),
    // Las cifras las trae cada línea. Sin ellas no hay bloque: es preferible
    // a repetir en pintura líquida las de la pintura en polvo.
    ...(line.stats?.length
      ? [{ type: 'statGrid' as const, theme: 'brand' as const, items: line.stats }]
      : []),
    {
      type: 'cardGrid',
      eyebrow: plantilla?.otras?.eyebrow ?? POR_DEFECTO.otras.eyebrow,
      title: plantilla?.otras?.title ?? POR_DEFECTO.otras.title,
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
      title: cierre.title ?? POR_DEFECTO.cierre.title,
      description: cierre.description ?? POR_DEFECTO.cierre.description,
      // Sin imagen el bloque cae en la variante `plain` y queda como un
      // rectángulo azul liso, que era justo lo que se veía aquí.
      image: line.image,
      cta: cierre.cta ?? POR_DEFECTO.cta,
    },
  ]
}

export function BusinessLinePage() {
  const { slug = '' } = useParams()
  const [lines, setLines] = useState<BusinessLine[] | null>(null)
  const [plantillas, setPlantillas] = useState<Templates>({})
  const site = useSitio()

  useEffect(() => {
    let active = true

    // En paralelo: las tres son independientes y en serie serían tres esperas
    // antes del primer píxel.
    void Promise.all([getBusinessLines(), getTemplates()]).then(([data, tpl]) => {
      if (!active) return
      setPlantillas(tpl)
      setLines(data)
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
      blocks={buildBlocks(line, others, plantillas.lineas, enlaceWhatsApp(site))}
      breadcrumbs={[
        { label: 'Inicio', href: '/' },
        { label: 'Productos', href: '/productos/pintura-en-polvo' },
        { label: line.name },
      ]}
    />
  )
}
