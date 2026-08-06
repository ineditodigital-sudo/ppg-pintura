import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import type { Navigation, Site } from '@/types/content'
import { getNavigation, getSite } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFab } from '@/components/layout/WhatsAppFab'
import { ContentPage } from '@/pages/ContentPage'
import { BusinessLinePage } from '@/pages/BusinessLinePage'
import { MarketPage } from '@/pages/MarketPage'
import { ColorsPage } from '@/pages/ColorsPage'
import { NotFound } from '@/pages/NotFound'

// El panel se carga sólo al entrar en /admin: el visitante del sitio público
// nunca descarga su código.
const AdminApp = lazy(() => import('@/admin/AdminApp'))

/** Devuelve el scroll al inicio al cambiar de ruta; respeta las anclas `#`. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return null
}

export default function App() {
  const [site, setSite] = useState<Site | null>(null)
  const [navigation, setNavigation] = useState<Navigation | null>(null)
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    // El panel no necesita el contenido del sitio público.
    if (isAdmin) return

    Promise.all([getSite(), getNavigation()]).then(([siteData, navData]) => {
      setSite(siteData)
      setNavigation(navData)
    })
  }, [isAdmin])

  // El panel se monta solo: sin encabezado, pie ni SEO del sitio público.
  if (isAdmin) {
    return (
      <Suspense
        fallback={
          <div style={{ padding: 40, color: 'var(--fg-tertiary)' }}>
            Cargando el panel…
          </div>
        }
      >
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      {site && navigation && <Header site={site} navigation={navigation} />}

      <main id="contenido">
        <ScrollToTop />
        {/* La `key` con la ruta reinicia la animación en cada cambio de
            página; sin ella sólo se ejecutaría en la primera carga. */}
        <div className="page-transition" key={pathname}>
          <Routes>
            <Route path="/" element={<ContentPage slug="home" />} />
            <Route path="/mercados" element={<ContentPage slug="mercados" />} />
            <Route path="/mercados/:slug" element={<MarketPage />} />
            <Route
              path="/quienes-somos"
              element={<ContentPage slug="quienes-somos" />}
            />
            <Route path="/contacto" element={<ContentPage slug="contacto" />} />
            <Route path="/productos/:slug" element={<BusinessLinePage />} />
            <Route path="/colores" element={<ColorsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {site && navigation && <Footer site={site} navigation={navigation} />}
      {site && <WhatsAppFab site={site} />}
    </>
  )
}
