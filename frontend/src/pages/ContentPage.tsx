import { useEffect, useState } from 'react'
import type { Page } from '@/types/content'
import { getPage } from '@/lib/api'
import { useSeo } from '@/lib/useSeo'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { PageSkeleton } from './PageSkeleton'
import { NotFound } from './NotFound'

/**
 * Renderiza cualquier página a partir de su slug. Las ocho páginas del sitio
 * comparten este componente: lo único que cambia es el contenido que devuelve
 * la API (o el fallback local).
 */
export function ContentPage({ slug }: { slug: string }) {
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    getPage(slug).then((data) => {
      if (!active) return
      setPage(data)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [slug])

  useSeo(page?.seo)

  if (loading) return <PageSkeleton />
  if (!page) return <NotFound />

  return <BlockRenderer blocks={page.blocks} breadcrumbs={page.breadcrumbs} />
}
