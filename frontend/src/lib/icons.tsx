/**
 * Iconos del sitio público.
 *
 * Van en línea como SVG: no generan peticiones, pesan unos pocos cientos de
 * bytes cada uno y se ven nítidos a cualquier tamaño y densidad de pantalla.
 * Era la única forma de añadir grafismo sin empeorar el rendimiento, dado que
 * el material fotográfico del cliente es de resolución limitada.
 *
 * Todos comparten lienzo 24×24 y trazo 1.7, para que pesen igual ópticamente.
 */
import type { ReactNode } from 'react'

const PATHS: Record<string, ReactNode> = {
  /* --- Protección y resistencia --- */
  escudo: <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6z" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  gota: <path d="M12 3s6 6.3 6 10a6 6 0 0 1-12 0c0-3.7 6-10 6-10z" />,
  llama: (
    <>
      <path d="M12 3c3 3.5 5 6.2 5 9a5 5 0 0 1-10 0c0-1.6.7-3 2-4.6" />
      <path d="M12 21a2.6 2.6 0 0 0 2.6-2.6c0-1.5-2.6-3.9-2.6-3.9s-2.6 2.4-2.6 3.9A2.6 2.6 0 0 0 12 21z" />
    </>
  ),
  termometro: (
    <>
      <path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4.5 4.5 0 1 1-4 0z" />
      <circle cx="12" cy="17" r="1.6" />
    </>
  ),

  /* --- Material y proceso --- */
  capas: (
    <>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5" />
    </>
  ),
  reciclar: (
    <>
      <path d="M7 7.5 9.6 3.2a1.6 1.6 0 0 1 2.8 0L14 6" />
      <path d="m17.5 10 2.6 4.4a1.6 1.6 0 0 1-1.4 2.4H15" />
      <path d="M9 16.8H5.3a1.6 1.6 0 0 1-1.4-2.4L6 10.6" />
      <path d="m5.6 10.6 1.6 2.6M14.4 5.6 13 8.4M15 16.8l-2.4 2.6" />
    </>
  ),
  paleta: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2z" />
      <circle cx="7.5" cy="11.5" r="1.1" />
      <circle cx="10.5" cy="7.5" r="1.1" />
      <circle cx="15" cy="8.5" r="1.1" />
    </>
  ),
  brillo: (
    <>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 16.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" />
    </>
  ),
  regla: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="1.4" />
      <path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4" />
    </>
  ),

  /* --- Sectores y objetos --- */
  edificio: (
    <>
      <path d="M4 21V6.5L12 3l8 3.5V21" />
      <path d="M9 21v-5h6v5" />
      <path d="M8 9.5h1.5M14.5 9.5H16M8 13h1.5M14.5 13H16" />
    </>
  ),
  coche: (
    <>
      <path d="M4.5 16v2.2a.8.8 0 0 1-.8.8H3a.8.8 0 0 1-.8-.8V12l2.3-5.2A2 2 0 0 1 6.3 5.6h11.4a2 2 0 0 1 1.8 1.2L21.8 12v6.2a.8.8 0 0 1-.8.8h-.7a.8.8 0 0 1-.8-.8V16" />
      <path d="M2.2 12h19.6" />
      <circle cx="7" cy="14.5" r="1.2" />
      <circle cx="17" cy="14.5" r="1.2" />
    </>
  ),
  engrane: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3" />
    </>
  ),
  planta: (
    <>
      <path d="M12 21V10" />
      <path d="M12 13c-3.2 0-5.5-2.2-5.5-5.5C9.7 7.5 12 9.8 12 13z" />
      <path d="M12 11c0-3.2 2.3-5.5 5.5-5.5C17.5 8.8 15.2 11 12 11z" />
      <path d="M6.5 21h11" />
    </>
  ),
  silla: (
    <>
      <path d="M6 4v7.5M18 4v7.5" />
      <path d="M4.5 11.5h15" />
      <path d="M7 11.5 6 21M17 11.5l1 9.5" />
      <path d="M6.4 16.5h11.2" />
    </>
  ),
  lampara: (
    <>
      <path d="M12 3v2.5" />
      <path d="M6 13.5 12 5.5l6 8z" />
      <path d="M9.5 13.5v2a2.5 2.5 0 0 0 5 0v-2" />
      <path d="M12 17.5V21" />
    </>
  ),

  /* --- Sustratos ---
     Cada familia de metal llega al taller con una forma reconocible, y esa
     silueta es lo que dibujan estos iconos: el perfil de una extrusión, el
     alma de una viga, el rollo de lámina. Sirven para distinguir de un
     vistazo sustratos cuyos nombres se parecen mucho entre sí. */
  perfil: (
    <>
      <path d="M3.5 5.5h17v3.2h-6.9V18.5h-3.2V8.7H3.5z" />
      <path d="M3.5 5.5v3.2" />
    </>
  ),
  viga: (
    <>
      <path d="M4 4.5h16M4 19.5h16" />
      <path d="M7 4.5v15M17 4.5v15" />
      <path d="M7 12h10" />
    </>
  ),
  lamina: (
    <>
      <path d="M3 8.5c0-1.4 4-2.5 9-2.5s9 1.1 9 2.5-4 2.5-9 2.5-9-1.1-9-2.5z" />
      <path d="M3 8.5v7c0 1.4 4 2.5 9 2.5s9-1.1 9-2.5v-7" />
    </>
  ),
  colada: (
    <>
      <path d="M5 4.5h7.5l3.5 4.2-3.5 4.2H5z" />
      <path d="M16 8.7h3.2v6.1a4.2 4.2 0 0 1-8.4 0" />
      <path d="M8.5 17.5v3M13 18.5v2" />
    </>
  ),
  tubo: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <ellipse cx="7.5" cy="12" rx="2" ry="5" />
    </>
  ),
  alambre: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <path d="M20.5 12H24" />
    </>
  ),
  galvanizado: (
    <>
      <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6z" />
      <path d="M14.2 8.6H9.8l4.4 6.2H9.8" />
    </>
  ),

  /* --- Genéricos --- */
  check: <path d="m4.5 12.5 5 5 10-11" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.4l3.4 2" />
    </>
  ),
  caja: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </>
  ),
}

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 24,
}: {
  name: string
  size?: number
}) {
  const path = PATHS[name]
  if (!path) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS)
