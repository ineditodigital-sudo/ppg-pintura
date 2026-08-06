/**
 * Cliente del panel.
 *
 * A diferencia de `src/lib/api.ts` (público, con fallback a JSON local), aquí
 * no hay fallback: si la API no responde, el panel debe decirlo en lugar de
 * fingir que guardó algo.
 *
 * El token CSRF se guarda en memoria y se adjunta a cada escritura.
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

let csrfToken = ''

export function setCsrfToken(token: string) {
  csrfToken = token
}

export class ApiError extends Error {
  status: number
  errors: string[]

  constructor(message: string, status: number, errors: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  /** La sesión caducó o nunca existió. */
  get isUnauthenticated() {
    return this.status === 401
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  const isWrite = (init.method ?? 'GET') !== 'GET'
  if (isWrite && csrfToken) headers.set('X-CSRF-Token', csrfToken)

  // FormData necesita que el navegador ponga su propio Content-Type (boundary).
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response: globalThis.Response

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError('No se pudo contactar con el servidor.', 0)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let data: unknown = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('El servidor devolvió una respuesta ilegible.', response.status)
  }

  if (!response.ok) {
    const payload = data as { message?: string; errors?: string[] } | null
    throw new ApiError(
      payload?.message ?? `Error ${response.status}.`,
      response.status,
      payload?.errors ?? [],
    )
  }

  return data as T
}

/* --- Sesión ---------------------------------------------------------------- */

export interface SessionInfo {
  authenticated: boolean
  user?: string
  csrfToken?: string
}

export async function getSession(): Promise<SessionInfo> {
  const session = await request<SessionInfo>('/auth/session')
  if (session.csrfToken) setCsrfToken(session.csrfToken)
  return session
}

export async function login(username: string, password: string) {
  const result = await request<{ ok: boolean; user: string; csrfToken: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  )
  setCsrfToken(result.csrfToken)
  return result
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' })
  setCsrfToken('')
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ ok: boolean; message: string }>('/auth/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

/* --- Contenido -------------------------------------------------------------- */

export interface PageSummary {
  slug: string
  title: string
  blockCount: number
}

export const listPages = () => request<PageSummary[]>('/admin/pages')
export const getPage = (slug: string) => request<Page>(`/admin/pages/${slug}`)

export const savePage = (slug: string, page: Page) =>
  request<{ ok: boolean; message: string }>(`/admin/pages/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(page),
  })

export const deletePage = (slug: string) =>
  request<{ ok: boolean; message: string }>(`/admin/pages/${slug}`, {
    method: 'DELETE',
  })

export const getNavigation = () => request<Navigation>('/navigation')

export const saveNavigation = (navigation: Navigation) =>
  request<{ ok: boolean; message: string }>('/admin/navigation', {
    method: 'PUT',
    body: JSON.stringify(navigation),
  })

export const getSite = () => request<Site>('/site')

export const saveSite = (site: Site) =>
  request<{ ok: boolean; message: string }>('/admin/site', {
    method: 'PUT',
    body: JSON.stringify(site),
  })

export const getBusinessLines = () => request<BusinessLine[]>('/business-lines')

export const saveBusinessLines = (lines: BusinessLine[]) =>
  request<{ ok: boolean; message: string }>('/admin/business-lines', {
    method: 'PUT',
    body: JSON.stringify(lines),
  })

/* --- Catálogo -----------------------------------------------------------------
 *
 * La lectura usa las rutas públicas —son las mismas que consume el sitio, así
 * que el panel edita exactamente lo que se está publicando— y la escritura va
 * por `/admin/…`, bajo sesión y token CSRF.
 */

export const getMarkets = () => request<Market[]>('/markets')

export const saveMarkets = (markets: Market[]) =>
  request<{ ok: boolean; message: string }>('/admin/markets', {
    method: 'PUT',
    body: JSON.stringify(markets),
  })

export const getColors = () => request<ColorCatalog>('/colors')

export const saveColors = (catalog: ColorCatalog) =>
  request<{ ok: boolean; message: string }>('/admin/colors', {
    method: 'PUT',
    body: JSON.stringify(catalog),
  })

export const getFeaturedProducts = () => request<FeaturedProduct[]>('/featured-products')

export const saveFeaturedProducts = (products: FeaturedProduct[]) =>
  request<{ ok: boolean; message: string }>('/admin/featured-products', {
    method: 'PUT',
    body: JSON.stringify(products),
  })

/* --- Mensajes ---------------------------------------------------------------- */

export interface ContactMessage {
  id: number
  name: string
  email: string
  company?: string
  topic: string
  message: string
  receivedAt: string
}

export const listMessages = () => request<ContactMessage[]>('/admin/messages')

export const deleteMessage = (id: number) =>
  request<{ ok: boolean; message: string }>(`/admin/messages/${id}`, {
    method: 'DELETE',
  })

/* --- Medios ------------------------------------------------------------------ */

/* --- Avisos por correo ------------------------------------------------------ */

export interface NotificationSettings {
  enabled: boolean
  recipients: string[]
  fromName: string
  fromEmail: string
  subjectPrefix: string
  copyToSender: boolean
}

export const getNotifications = () =>
  request<NotificationSettings>('/admin/notifications')

export const saveNotifications = (settings: NotificationSettings) =>
  request<{ ok: boolean; message: string; settings: NotificationSettings }>(
    '/admin/notifications',
    { method: 'PUT', body: JSON.stringify(settings) },
  )

export const sendTestEmail = (to: string) =>
  request<{ ok: boolean; message: string }>('/admin/notifications/test', {
    method: 'POST',
    body: JSON.stringify({ to }),
  })

export interface MediaItem {
  name: string
  src: string
  folder: string
  size: number
  editable: boolean
}

export const listMedia = () => request<MediaItem[]>('/admin/media')

export function uploadMedia(file: File) {
  const body = new FormData()
  body.append('file', file)
  return request<MediaItem>('/admin/media', { method: 'POST', body })
}

export const deleteMedia = (name: string) =>
  request<{ ok: boolean; message: string }>(
    `/admin/media/${encodeURIComponent(name)}`,
    { method: 'DELETE' },
  )
