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
} from '@/types/content'

import siteLocal from '@/content/site.json'
import navigationLocal from '@/content/navigation.json'
import businessLinesLocal from '@/content/business-lines.json'
import marketsLocal from '@/content/markets.json'
import colorsLocal from '@/content/colors.json'
import featuredLocal from '@/content/featured-products.json'
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

async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`/api${path}`, {
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
