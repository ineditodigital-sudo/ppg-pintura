/**
 * Catálogo de redes sociales.
 *
 * Única fuente de verdad: el pie de página lo usa para dibujar los iconos y el
 * panel para poblar el desplegable de «Red». Añadir una red es añadir una
 * entrada aquí; no hay que tocar el footer ni el CMS.
 *
 * Todos los `path` están dibujados sobre un lienzo de 24×24 y se rellenan con
 * `currentColor`.
 */

export interface SocialNetwork {
  /** Identificador que se guarda en `site.json`. No cambiarlo rompería datos. */
  id: string
  label: string
  path: string
  /**
   * Sólo para glifos que ocupan más lienzo que el resto. Ampliar el viewBox
   * los encoge, de modo que todos los iconos se vean del mismo tamaño óptico
   * en la fila del pie de página.
   */
  viewBox?: string
}

export const DEFAULT_VIEWBOX = '0 0 24 24'

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    path: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 7.84a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4zm5.31-7.03a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0z',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    path: 'M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0zM3.5 8.5h3v12h-3v-12zm5.5 0h2.87v1.64h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v7.32h-3v-6.5c0-1.55-.03-3.54-2.16-3.54-2.16 0-2.49 1.69-2.49 3.43v6.61H9v-12z',
  },
  {
    // Se conserva el id `twitter` para no invalidar los datos ya guardados.
    id: 'twitter',
    label: 'X (Twitter)',
    path: 'M18.24 3h3.3l-7.2 8.23L22.8 21h-6.63l-5.19-6.79L4.99 21H1.68l7.7-8.8L1.2 3h6.8l4.69 6.2L18.24 3zm-1.16 16h1.83L7.01 4.9H5.05L17.08 19z',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    path: 'M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.51 2.51 0 0 0 2.42 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81zM10 15.02V8.98L15.2 12 10 15.02z',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    path: 'M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.4-2.46V9.7a5.68 5.68 0 0 0-.81-.06A5.68 5.68 0 0 0 4.18 15.3 5.68 5.68 0 0 0 9.86 21a5.68 5.68 0 0 0 5.68-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48z',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    // El glifo llena 23×22 del lienzo; se amplía el viewBox para igualarlo.
    viewBox: '-1.5 -1.5 27 27',
    path: 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.42 9.42 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.39 9.39 0 0 1-1.44-5.01c0-5.19 4.23-9.42 9.43-9.42 2.52 0 4.88.98 6.66 2.76a9.35 9.35 0 0 1 2.76 6.67c0 5.19-4.23 9.42-9.42 9.42zm8.02-17.44A11.32 11.32 0 0 0 12.04 1C5.79 1 .7 6.08.7 12.33c0 2 .52 3.95 1.52 5.67L.6 23.4l5.54-1.45a11.3 11.3 0 0 0 5.9 1.51h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.87-3.32-8.01z',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    path: 'M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2.01.03-2.88.18-.78 1.17-4.97 1.17-4.97s-.3-.6-.3-1.48c0-1.39.81-2.43 1.81-2.43.85 0 1.26.64 1.26 1.41 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.81 1.48 1.81 1.78 0 3.15-1.88 3.15-4.58 0-2.4-1.72-4.07-4.18-4.07-2.85 0-4.52 2.14-4.52 4.34 0 .86.33 1.79.74 2.29.08.1.09.19.07.29-.08.33-.26 1-.29 1.14-.05.19-.15.23-.35.14-1.3-.61-2.11-2.5-2.11-4.03 0-3.28 2.38-6.29 6.87-6.29 3.61 0 6.41 2.57 6.41 6.01 0 3.58-2.26 6.47-5.4 6.47-1.05 0-2.04-.55-2.38-1.2l-.65 2.47c-.23.9-.87 2.03-1.29 2.72.97.3 2 .46 3.07.46 5.52 0 10-4.48 10-10S17.52 2 12 2z',
  },
  {
    id: 'threads',
    label: 'Threads',
    path: 'M16.2 11.16a6.6 6.6 0 0 0-.25-.11c-.15-2.72-1.63-4.28-4.13-4.3h-.03c-1.49 0-2.73.64-3.5 1.8l1.37.94c.57-.87 1.47-1.05 2.13-1.05h.02c.82 0 1.44.24 1.84.71.29.34.49.82.58 1.42a10.6 10.6 0 0 0-2.37-.11c-2.39.14-3.93 1.53-3.83 3.47.05.98.54 1.83 1.38 2.39.71.47 1.62.7 2.57.65 1.25-.07 2.24-.55 2.92-1.42.52-.66.85-1.52 1-2.6.61.37 1.07.86 1.32 1.44.42 1 .45 2.63-.89 3.97-1.17 1.17-2.58 1.68-4.71 1.69-2.36-.02-4.15-.78-5.31-2.25-1.09-1.38-1.65-3.37-1.67-5.92.02-2.55.58-4.54 1.67-5.92C7.46 4.4 9.25 3.64 11.61 3.62c2.38.02 4.2.78 5.41 2.27.6.73 1.05 1.65 1.34 2.72l1.61-.43c-.36-1.32-.92-2.46-1.69-3.4C16.73 2.87 14.44 1.9 11.61 1.88h-.01c-2.82.02-5.09.99-6.73 2.89C3.4 6.46 2.66 8.86 2.63 11.99v.02c.03 3.13.77 5.53 2.24 7.22 1.64 1.9 3.91 2.87 6.73 2.89h.01c2.51-.02 4.28-.68 5.74-2.14 1.91-1.9 1.85-4.29 1.22-5.75-.45-1.05-1.31-1.9-2.47-2.47zm-4.38 4.5c-1.05.06-2.14-.41-2.19-1.38-.04-.72.51-1.52 2.25-1.62.2-.01.4-.02.59-.02.63 0 1.22.06 1.76.18-.2 2.5-1.37 2.79-2.41 2.84z',
  },
]

/**
 * Icono de reserva para cualquier red que no esté en el catálogo.
 *
 * Existe para que añadir una red desconocida desde el CMS degrade a un globo
 * genérico en vez de dejar el botón vacío. Antes esto pasaba en silencio.
 */
const FALLBACK: SocialNetwork = {
  id: 'link',
  label: 'Enlace',
  path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.94 9h-3.03a15.6 15.6 0 0 0-1.2-5.42A8.03 8.03 0 0 1 19.94 11zM12 4.04c.83 1.2 1.48 3.34 1.64 5.96h-3.28c.16-2.62.81-4.76 1.64-5.96zM4.06 13h3.03c.1 1.98.51 3.83 1.2 5.42A8.03 8.03 0 0 1 4.06 13zm3.03-2H4.06a8.03 8.03 0 0 1 4.23-5.42A15.6 15.6 0 0 0 7.09 11zM12 19.96c-.83-1.2-1.48-3.34-1.64-5.96h3.28c-.16 2.62-.81 4.76-1.64 5.96zm3.71-1.54c.69-1.59 1.1-3.44 1.2-5.42h3.03a8.03 8.03 0 0 1-4.23 5.42z',
}

const BY_ID = new Map(SOCIAL_NETWORKS.map((n) => [n.id, n]))

/** Devuelve la red por su id, o el icono de reserva si no existe. */
export function socialNetwork(id: string): SocialNetwork {
  return BY_ID.get(id.trim().toLowerCase()) ?? { ...FALLBACK, label: id || FALLBACK.label }
}

/** Opciones para el desplegable del panel. */
export const SOCIAL_OPTIONS = SOCIAL_NETWORKS.map((n) => ({
  value: n.id,
  label: n.label,
}))

/**
 * El enlace de WhatsApp configurado en Ajustes.
 *
 * Estaba escrito a mano en tres archivos —las dos plantillas de página y la
 * ficha de color—, así que cambiar el número desde el CMS lo cambiaba en el
 * pie y en el botón flotante pero no en los botones de las nueve páginas
 * generadas. Devuelve `undefined` si no hay número: es preferible no pintar el
 * botón a que lleve a una conversación vacía.
 */
export function enlaceWhatsApp(
  site: { social?: { network: string; href: string }[] } | null | undefined,
): string | undefined {
  return site?.social?.find((s) => s.network === 'whatsapp')?.href
}
