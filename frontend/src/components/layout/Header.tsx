import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { NavItem, Navigation, Site } from '@/types/content'
import { ArrowUpRight, ButtonLink, Container } from '@/components/ui'
import './Header.css'

function Chevron() {
  return (
    <svg
      className="header__chevron"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="M18 6 6 18M6 6l12 12" />
      ) : (
        <path d="M3 6h18M3 12h18M3 18h18" />
      )}
    </svg>
  )
}

function MegaMenuLink({ item }: { item: NavItem }) {
  const isExternal = /^https?:\/\//.test(item.href ?? '')
  const label = (
    <>
      <span className="megamenu__link-label">
        {item.label}
        {isExternal && <ArrowUpRight size={14} />}
      </span>
      {item.description && (
        <span className="megamenu__link-description">{item.description}</span>
      )}
    </>
  )

  if (!item.href) return <span className="megamenu__link">{label}</span>

  if (isExternal) {
    return (
      <a
        className="megamenu__link"
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
      >
        {label}
      </a>
    )
  }

  return (
    <Link className="megamenu__link" to={item.href}>
      {label}
    </Link>
  )
}

export function Header({
  site,
  navigation,
}: {
  site: Site
  navigation: Navigation
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileGroup, setMobileGroup] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  // La referencia va en el <header>, no en el <nav>: el panel del mega-menú
  // cuelga del header pero queda fuera del nav, y si el cierre por clic externo
  // no lo cuenta como «dentro», el panel se desmonta en `pointerdown` y el
  // `click` del enlace ya no llega a dispararse.
  const headerRef = useRef<HTMLElement>(null)
  const closeTimer = useRef<number | null>(null)
  const location = useLocation()

  /**
   * El panel se abre al pasar el cursor. El cierre lleva un retardo corto
   * para poder cruzar el hueco entre el botón y el panel sin que se cierre
   * a medio camino.
   */
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openMenu = (index: number) => {
    cancelClose()
    setOpenIndex(index)
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpenIndex(null), 180)
  }

  useEffect(() => cancelClose, [])

  // Cerrar todo al navegar.
  useEffect(() => {
    setOpenIndex(null)
    setMobileOpen(false)
  }, [location.pathname, location.hash])

  /* Sombra del header al hacer scroll.
     Depende de `pathname`: al cambiar de pagina el scroll vuelve a 0 sin
     emitir evento, asi que `scrolled` se quedaba en `true` y el header seguia
     blanco sobre el hero -con el texto ya en blanco: invisible-. */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      /* El mega-menú se abre al pasar el cursor y oscurece la página con un
         velo. Si se baja con la rueda sin mover el ratón, no hay `mouseleave`
         que lo cierre y la página se queda a oscuras mientras se navega. */
      setOpenIndex(null)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  // Esc cierra el mega-menú y el menú móvil.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenIndex(null)
      setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Un clic fuera de la navegación cierra el panel abierto.
  useEffect(() => {
    if (openIndex === null) return
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenIndex(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openIndex])

  // Bloquear el scroll del fondo con el menú móvil abierto.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const activeItem = openIndex !== null ? navigation.main[openIndex] : null

  return (
    <>
      <header
        className={`header ${scrolled ? 'header--scrolled' : ''}`.trim()}
        ref={headerRef}
      >
        <Container>
          <div className="header__bar">
            {/* Jerarquía invertida respecto a la versión anterior: este es un
                sitio de PPG. La marca encabeza, y el distribuidor aparece a su
                lado en letra pequeña, sin logotipo que compita. */}
            <Link className="header__logo" to="/" aria-label={`${site.name} — Inicio`}>
              <img
                src={site.logo.src}
                alt={site.logo.alt}
                width={site.logo.width}
                height={site.logo.height}
              />
            </Link>


            <nav
              className="header__nav"
              aria-label="Navegación principal"
              onMouseLeave={scheduleClose}
            >
              {navigation.main.map((item, index) => {
                const hasChildren = Boolean(item.children?.length)

                if (!hasChildren && item.href) {
                  return (
                    <div
                      className="header__item"
                      key={item.label}
                      onMouseEnter={scheduleClose}
                    >
                      <NavLink
                        className={({ isActive }) =>
                          `header__link ${isActive ? 'is-active' : ''}`.trim()
                        }
                        to={item.href}
                      >
                        {item.label}
                      </NavLink>
                    </div>
                  )
                }

                return (
                  <div
                    className="header__item"
                    key={item.label}
                    onMouseEnter={() => openMenu(index)}
                  >
                    <button
                      type="button"
                      className="header__link"
                      aria-expanded={openIndex === index}
                      aria-haspopup="true"
                      // El clic sigue funcionando en pantallas táctiles, donde
                      // no hay cursor que pasar por encima.
                      onClick={() =>
                        setOpenIndex(openIndex === index ? null : index)
                      }
                      // Con teclado, el foco abre el panel igual que el cursor.
                      onFocus={() => openMenu(index)}
                    >
                      {item.label}
                      <Chevron />
                    </button>
                  </div>
                )
              })}
            </nav>

            <div className="header__actions">
              <ButtonLink href={navigation.cta.href} small withArrow={false}>
                {navigation.cta.label}
              </ButtonLink>
              <button
                type="button"
                className="header__burger"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setMobileOpen((value) => !value)}
              >
                <BurgerIcon open={mobileOpen} />
              </button>
            </div>
          </div>
        </Container>

        {activeItem?.children && (
          <div
            className="megamenu"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <Container>
              <div className="megamenu__inner">
                <div className="megamenu__aside">
                  <h2>{activeItem.label}</h2>
                  {activeItem.description && <p>{activeItem.description}</p>}
                </div>
                <div className="megamenu__grid">
                  {activeItem.children.map((child) => (
                    <MegaMenuLink key={child.label} item={child} />
                  ))}
                </div>
              </div>
            </Container>
          </div>
        )}
      </header>

      {activeItem && (
        <div
          className="megamenu__overlay"
          onClick={() => setOpenIndex(null)}
          aria-hidden="true"
        />
      )}

      {mobileOpen && (
        <div className="mobile-nav" id="mobile-nav">
          {navigation.main.map((item, index) => {
            if (!item.children?.length && item.href) {
              return (
                <div className="mobile-nav__group" key={item.label}>
                  <Link className="mobile-nav__toggle" to={item.href}>
                    {item.label}
                  </Link>
                </div>
              )
            }

            const expanded = mobileGroup === index
            return (
              <div className="mobile-nav__group" key={item.label}>
                <button
                  type="button"
                  className="mobile-nav__toggle"
                  aria-expanded={expanded}
                  onClick={() => setMobileGroup(expanded ? null : index)}
                >
                  {item.label}
                  <Chevron />
                </button>
                {/* Se renderiza siempre y se anima la altura con la rejilla:
                    montar y desmontar cortaba la transición de cierre. */}
                <div
                  className={`mobile-nav__panel${expanded ? ' is-open' : ''}`}
                  aria-hidden={!expanded}
                >
                  <div className="mobile-nav__panel-inner">
                    {item.children?.map((child) =>
                      /^https?:\/\//.test(child.href ?? '') ? (
                        <a
                          key={child.label}
                          href={child.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          tabIndex={expanded ? 0 : -1}
                        >
                          {child.label}
                        </a>
                      ) : (
                        <Link
                          key={child.label}
                          to={child.href ?? '/'}
                          tabIndex={expanded ? 0 : -1}
                        >
                          {child.label}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="mobile-nav__footer">
            <ButtonLink href={navigation.cta.href} withArrow={false}>
              {navigation.cta.label}
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  )
}
