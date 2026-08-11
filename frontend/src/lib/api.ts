/**
 * Cliente de contenido.
 *
 * Intenta primero la API PHP (`/api/...`). Si no responde —porque no está
 * levantada, o porque aún no existe el CMS— cae a la copia local de
 * `src/content`. El sitio nunca se queda en blanco por esa razón.
 */
import type {
  BusinessLine,
  ColorCatalog,
  FeaturedProduct,
  Market,
  Navigation,
  Page,
  Site,
  Templates,
} from '@/types/content'

import siteLocal from '@/content/site.json'
import navigationLocal from '@/content/navigation.json'
import businessLinesLocal from '@/content/business-lines.json'
import marketsLocal from '@/content/markets.json'
import colorsLocal from '@/content/colors.json'
import featuredLocal from '@/content/featured-products.json'
import templatesLocal from '@/content/templates.json'
import homeLocal from '@/content/pages/home.json'
import mercadosLocal from '@/content/pages/mercados.json'
import quienesSomosLocal from '@/content/pages/quienes-somos.json'
import contactLocal from '@/content/pages/contacto.json'

const localPages: Record<string, unknown> = {
  home: homeLocal,
  mercados: mercadosLocal,
  'quienes-somos': quienesSomosLocal,
  contacto: contactLocal,
}

/** Marca si la API respondió, para poder mostrarlo en desarrollo. */
export let usingLocalContent = false

/**
 * Peticiones que `index.html` lanzó al analizarse, antes de que existiera este
 * bundle. Son las tres que hacen falta para pintar la portada. Cada promesa se
 * consume una sola vez: si la misma ruta se vuelve a pedir —al navegar y
 * regresar—, se va por la red como siempre.
 */
declare global {
  interface Window {
    __ppgContenido?: Record<string, Promise<unknown> | undefined>
  }
}

function adelantada(url: string): Promise<unknown> | undefined {
  const cache = typeof window !== 'undefined' ? window.__ppgContenido : undefined
  const promesa = cache?.[url]
  if (promesa) delete cache![url]
  return promesa
}

async function request<T>(path: string, fallback: T): Promise<T> {
  const url = `/api${path}`

  const anticipada = adelantada(url)
  if (anticipada) {
    const datos = await anticipada
    // `null` significa que aquella petición falló. No se da por perdida: se
    // reintenta por el camino normal antes de caer a la copia local.
    if (datos !== null && datos !== undefined) return datos as T
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()) as T
  } catch {
    usingLocalContent = true
    return fallback
  }
}

export function getSite(): Promise<Site> {
  return request('/site', siteLocal as Site)
}

export function getNavigation(): Promise<Navigation> {
  return request('/navigation', navigationLocal as unknown as Navigation)
}

export function getBusinessLines(): Promise<BusinessLine[]> {
  return request('/business-lines', businessLinesLocal as BusinessLine[])
}

export function getMarkets(): Promise<Market[]> {
  return request('/markets', marketsLocal as Market[])
}

/** Catálogo completo de pintura en polvo, extraído del PDF oficial de PPG. */
export function getColors(): Promise<ColorCatalog> {
  return request('/colors', colorsLocal as unknown as ColorCatalog)
}

export function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  return request(
    '/featured-products',
    (featuredLocal as { products: FeaturedProduct[] }).products,
  )
}

/**
 * Textos compartidos de las páginas de producto y sector.
 *
 * Se sirve un objeto vacío si algo falla: cada campo tiene su valor por
 * defecto en la propia plantilla, así que la página se pinta igual.
 */
export function getTemplates(): Promise<Templates> {
  return request('/templates', templatesLocal as Templates)
}

export async function getPage(slug: string): Promise<Page | null> {
  const fallback = (localPages[slug] as Page | undefined) ?? null
  return request(`/pages/${slug}`, fallback)
}

export interface ContactPayload {
  name: string
  email: string
  company?: string
  topic: string
  message: string
}

export interface ContactResult {
  ok: boolean
  message: string
}

export async function submitContact(
  payload: ContactPayload,
): Promise<ContactResult> {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as Partial<ContactResult>
    if (!response.ok) {
      return {
        ok: false,
        message: data.message ?? 'No pudimos enviar tu mensaje.',
      }
    }
    return {
      ok: true,
      message: data.message ?? 'Gracias. Hemos recibido tu mensaje.',
    }
  } catch {
    return {
      ok: false,
      message:
        'El servicio de contacto no está disponible. Levanta la API PHP o escríbenos por otro medio.',
    }
  }
}
