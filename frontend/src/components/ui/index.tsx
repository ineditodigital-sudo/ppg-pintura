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

/** Glifo de WhatsApp para los CTA que llevan allí. Inline, como en el FAB. */
function GlifoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.895 6.994c-.003 5.45-4.437 9.886-9.887 9.886m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  )
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
  const isExternal = external ?? /^https?:\/\//.test(href)

  // Un CTA que lleva a WhatsApp se pinta en verde y con su glifo, mande quien
  // lo mande —una página del CMS o una plantilla—. Se decide por el destino y
  // no por un campo aparte: así no hay forma de añadir un enlace de WhatsApp
  // que se quede con el aspecto de botón secundario y pase desapercibido.
  const esWhatsApp = /wa\.me|whatsapp\.com/i.test(href)

  const className = `btn ${buttonVariantClass[variant]} ${
    small ? 'btn--small' : ''
  } ${esWhatsApp ? 'btn--whatsapp' : ''}`
    .replace(/\s+/g, ' ')
    .trim()

  const content = (
    <>
      {esWhatsApp && <GlifoWhatsApp />}
      {children}
      {withArrow && !esWhatsApp && (
        isExternal ? <ArrowUpRight size={16} /> : <ArrowRight size={16} />
      )}
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

/** La píldora es sólida siempre: no había un segundo nivel que justificara
 *  una variante, y la suave no contrastaba contra el blanco de la página. */
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>
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
