import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Breadcrumb as BreadcrumbItem, Media, Theme } from '@/types/content'
import './ui.css'

/* --- Iconos --------------------------------------------------------------- */

export function ArrowUpRight({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="arrow-link__icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="btn__icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/* --- Container / Section -------------------------------------------------- */

export function Container({
  children,
  narrow,
  className = '',
}: {
  children: ReactNode
  narrow?: boolean
  className?: string
}) {
  return (
    <div
      className={`container ${narrow ? 'container--narrow' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

const sectionThemeClass: Record<Theme, string> = {
  light: 'section--light',
  dark: 'section--dark',
  brand: 'section--brand',
  transparent: '',
}

export function Section({
  children,
  theme = 'transparent',
  tight,
  id,
  className = '',
}: {
  children: ReactNode
  theme?: Theme
  tight?: boolean
  id?: string
  className?: string
}) {
  return (
    <section
      id={id}
      className={`section ${tight ? 'section--tight' : ''} ${sectionThemeClass[theme]} ${className}`.trim()}
    >
      {children}
    </section>
  )
}

export function SectionHead({
  eyebrow,
  title,
  description,
  center,
  as: Heading = 'h2',
}: {
  eyebrow?: string
  title?: string
  description?: string
  center?: boolean
  as?: 'h2' | 'h3'
}) {
  if (!eyebrow && !title && !description) return null

  /* Encabezado asimétrico: antetítulo y título a la izquierda, descripción a
     la derecha y alineada abajo. Apilados los tres, todas las secciones del
     sitio arrancaban con el mismo bloque centrado y la página entera se leía
     igual de arriba abajo. Partido en dos columnas, cada sección abre con una
     composición y no con una lista. */
  return (
    <header className={`section-head ${center ? 'section-head--center' : ''}`.trim()}>
      <div className="section-head__principal">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <Heading>{title}</Heading>}
      </div>
      {description && <p className="section-head__description">{description}</p>}
    </header>
  )
}

/* --- Botón ---------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onDark'

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  onDark: 'btn--on-dark',
}

export function ButtonLink({
  href,
  external,
  variant = 'primary',
  small,
  children,
  withArrow = true,
}: {
  href: string
  external?: boolean
  variant?: ButtonVariant
  small?: boolean
  children: ReactNode
  withArrow?: boolean
}) {
  const className =
    `btn ${buttonVariantClass[variant]} ${small ? 'btn--small' : ''}`.trim()
  const isExternal = external ?? /^https?:\/\//.test(href)

  const content = (
    <>
      {children}
      {withArrow && (isExternal ? <ArrowUpRight size={16} /> : <ArrowRight size={16} />)}
    </>
  )

  if (isExternal) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
      >
        {content}
      </a>
    )
  }

  // Los anclas internas (#seccion) no deben pasar por el router.
  if (href.startsWith('#')) {
    return (
      <a className={className} href={href}>
        {content}
      </a>
    )
  }

  return (
    <Link className={className} to={href}>
      {content}
    </Link>
  )
}

/* --- Enlace con flecha ---------------------------------------------------- */

export function ArrowLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: ReactNode
}) {
  const isExternal = external ?? /^https?:\/\//.test(href)

  if (isExternal) {
    return (
      <a
        className="arrow-link"
        href={href}
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
        <ArrowUpRight />
      </a>
    )
  }

  return (
    <Link className="arrow-link" to={href}>
      {children}
      <ArrowRight />
    </Link>
  )
}

/* --- Badge ---------------------------------------------------------------- */

export function Badge({
  children,
  solid,
}: {
  children: ReactNode
  solid?: boolean
}) {
  return (
    <span className={`badge ${solid ? 'badge--solid' : ''}`.trim()}>
      {children}
    </span>
  )
}

/* --- Imagen con skeleton y lazy loading ----------------------------------- */

export function SmartImage({
  media,
  eager,
  className = '',
}: {
  media: Media
  eager?: boolean
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <span className={`smart-image ${loaded ? '' : 'skeleton'} ${className}`.trim()}>
      <img
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={loaded ? 'is-loaded' : ''}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </span>
  )
}

/* --- Breadcrumb ----------------------------------------------------------- */

export function Breadcrumbs({ items }: { items?: BreadcrumbItem[] }) {
  if (!items?.length) return null

  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`}>
            {index > 0 && (
              <span className="breadcrumb__sep" aria-hidden="true">
                {' / '}
              </span>
            )}
            {item.href && !isLast ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
