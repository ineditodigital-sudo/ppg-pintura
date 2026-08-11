import { useEffect, useState } from 'react'
import type { Site } from '@/types/content'
import { getSite } from './api'

/**
 * Los ajustes del sitio, pedidos una sola vez.
 *
 * Varios sitios necesitan el mismo dato —el número de WhatsApp, sobre todo— y
 * cada uno pedía `/api/site` por su cuenta: la página de un sector llegaba a
 * lanzar tres peticiones idénticas. Se guarda la promesa, no el resultado, de
 * modo que dos componentes que monten a la vez comparten la misma petición en
 * vuelo en lugar de disparar dos.
 *
 * No hay invalidación: los ajustes no cambian mientras el visitante navega, y
 * el panel recarga al guardar.
 */
let enVuelo: Promise<Site> | null = null

function sitio(): Promise<Site> {
  enVuelo ??= getSite()
  return enVuelo
}

export function useSitio(): Site | null {
  const [site, setSite] = useState<Site | null>(null)

  useEffect(() => {
    let vivo = true
    void sitio().then((s) => {
      if (vivo) setSite(s)
    })
    return () => {
      vivo = false
    }
  }, [])

  return site
}
