import { useCallback, useEffect, useState } from 'react'
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import * as api from './api'
import { Alert, Loading } from './components/Common'
import { Field, PasswordInput } from './components/Fields'
import { PageEditorScreen, PagesScreen } from './screens/Pages'
import { PlantillasScreen } from './screens/Plantillas'
import { Guia } from './components/Guia'
import { BusinessLinesScreen, NavigationScreen, SiteScreen } from './screens/Settings'
import { MediaScreen, MessagesScreen, PasswordScreen } from './screens/Misc'
import { ColorsScreen, FeaturedProductsScreen, MarketsScreen } from './screens/Catalogo'
import { DashboardScreen } from './screens/Dashboard'
import { NotificationsScreen } from './screens/Notifications'
import {
  IconExternal,
  IconHome,
  IconInbox,
  IconKey,
  IconMail,
  IconMarkets,
  IconMedia,
  IconNav,
  IconPages,
  IconPalette,
  IconProducts,
  IconSettings,
  IconStar,
  IconLogout,
  IconMenu,
  IconCerrar,
} from './components/Icons'
import './admin.css'

/**
 * El panel administra un sitio de marca PPG, así que lleva el logotipo de PPG.
 * Antes usaba el isotipo de Coating Systems con `alt="PPG"`: ni la marca ni el
 * texto alternativo correspondían.
 *
 * Va la versión azul en los dos sitios donde aparece —la tarjeta de acceso y la
 * barra lateral—, porque ambas superficies son blancas. La versión en blanco
 * está en `assets/marcas/ppg-blanco.svg` por si alguna pasa a fondo oscuro.
 */
const LOGO = '/assets/marcas/ppg-azul.svg'

/* --- Acceso ------------------------------------------------------------------ */

function LoginScreen({ onSuccess }: { onSuccess: (user: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const result = await api.login(username, password)
      onSuccess(result.user)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={(e) => void submit(e)}>
        <img
          className="admin-login__logo"
          src={LOGO}
          alt="PPG"
          width={291}
          height={226}
        />
        <h1>Panel de contenido</h1>
        <p>Accede para editar el sitio.</p>

        <Alert kind="error" message={error} />

        <Field label="Usuario" required>
          <input
            type="text"
            value={username}
            autoComplete="username"
            autoFocus
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field label="Contraseña" required>
          <PasswordInput
            value={password}
            autoComplete="current-password"
            required
            onChange={setPassword}
          />
        </Field>

        <button
          type="submit"
          className="adm-btn adm-btn--primary"
          style={{ width: '100%', marginTop: 8 }}
          disabled={busy}
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

/* --- Navegación lateral -------------------------------------------------------- */

const GRUPOS = [
  {
    title: 'General',
    links: [{ to: '/admin/inicio', label: 'Inicio', icon: IconHome }],
  },
  {
    title: 'Contenido',
    links: [
      { to: '/admin/paginas', label: 'Páginas', icon: IconPages },
      { to: '/admin/plantillas', label: 'Textos de producto y sector', icon: IconPages },
      { to: '/admin/navegacion', label: 'Navegación', icon: IconNav },
      { to: '/admin/lineas', label: 'Líneas de producto', icon: IconProducts },
      { to: '/admin/ajustes', label: 'Ajustes del sitio', icon: IconSettings },
    ],
  },
  {
    title: 'Catálogo',
    links: [
      { to: '/admin/mercados', label: 'Mercados', icon: IconMarkets },
      { to: '/admin/colores', label: 'Carta de color', icon: IconPalette },
      { to: '/admin/destacados', label: 'Destacados', icon: IconStar },
    ],
  },
  {
    title: 'Biblioteca',
    links: [
      { to: '/admin/medios', label: 'Medios', icon: IconMedia },
      { to: '/admin/mensajes', label: 'Mensajes', icon: IconInbox },
    ],
  },
  {
    title: 'Sistema',
    links: [
      { to: '/admin/correo', label: 'Correo', icon: IconMail },
      { to: '/admin/contrasena', label: 'Contraseña', icon: IconKey },
    ],
  },
]

/** El nombre de la pantalla en la que estás, para la barra de móvil. */
function tituloDeLaRuta(pathname: string): string {
  const enlaces = GRUPOS.flatMap((g) => g.links)
  // El más específico primero: `/admin/paginas/home` es «Páginas», no «Inicio».
  const acierto = [...enlaces]
    .sort((a, b) => b.to.length - a.to.length)
    .find((l) => pathname.startsWith(l.to))

  return acierto?.label ?? 'Panel'
}

function Shell({ user, onLogout }: { user: string; onLogout: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Al cambiar de pantalla el cajón se cierra solo: dejarlo abierto tapando la
  // pantalla recién elegida es el fallo clásico de este patrón.
  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  // Con el cajón abierto no se desplaza lo de debajo, que es lo que hace que
  // al cerrarlo aparezcas en otro punto de la página.
  useEffect(() => {
    if (!menuAbierto) return

    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const alPulsarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('keydown', alPulsarEscape)

    return () => {
      document.body.style.overflow = previo
      document.removeEventListener('keydown', alPulsarEscape)
    }
  }, [menuAbierto])

  async function handleLogout() {
    try {
      await api.logout()
    } finally {
      onLogout()
      navigate('/admin')
    }
  }

  return (
    <div className={`admin-shell${menuAbierto ? ' is-menu-open' : ''}`}>
      {/* Barra de móvil. En escritorio no se pinta: allí la lateral está
          siempre a la vista y una barra encima sólo robaría alto. */}
      <header className="admin-bar">
        <button
          type="button"
          className="admin-bar__menu"
          onClick={() => setMenuAbierto(true)}
          aria-expanded={menuAbierto}
          aria-controls="admin-menu"
        >
          <IconMenu size={22} />
          <span className="adm-oculto">Abrir el menú</span>
        </button>
        <span className="admin-bar__titulo">{tituloDeLaRuta(pathname)}</span>
        <img className="admin-bar__logo" src={LOGO} alt="PPG" width={291} height={226} />
      </header>

      {/* Fondo que cierra al tocar fuera. Va detrás del cajón y sólo existe
          mientras está abierto, para que no intercepte nada en escritorio. */}
      {menuAbierto && (
        <button
          type="button"
          className="admin-velo"
          aria-label="Cerrar el menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside
        id="admin-menu"
        className={`admin-side${menuAbierto ? ' is-open' : ''}`}
        aria-hidden={undefined}
      >
        <div className="admin-side__brand">
          <img src={LOGO} alt="" width={291} height={226} />
          <span>Contenido</span>
          <button
            type="button"
            className="admin-side__cerrar"
            onClick={() => setMenuAbierto(false)}
          >
            <IconCerrar size={20} />
            <span className="adm-oculto">Cerrar el menú</span>
          </button>
        </div>

        <nav>
          {GRUPOS.map((grupo) => (
            <div className="admin-side__group" key={grupo.title}>
              <span className="admin-side__group-title">{grupo.title}</span>
              {grupo.links.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `admin-side__link${isActive ? ' is-active' : ''}`
                    }
                  >
                    <Icon size={18} />
                    {link.label}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="admin-side__foot">
          <a
            className="admin-side__link admin-side__ver"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            <IconExternal size={18} />
            Ver el sitio
          </a>
          <button
            type="button"
            className="admin-side__link"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => void handleLogout()}
          >
            <IconLogout size={18} />
            Cerrar sesión
          </button>
          <span className="admin-side__user">
            <span className="admin-side__avatar">{user.slice(0, 2)}</span>
            Sesión de {user}
          </span>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<Navigate to="/admin/inicio" replace />} />
          <Route path="inicio" element={<DashboardScreen user={user} />} />
          <Route path="paginas" element={<PagesScreen />} />
          <Route path="paginas/:slug" element={<PageEditorScreen />} />
          <Route path="plantillas" element={<PlantillasScreen />} />
          <Route path="navegacion" element={<NavigationScreen />} />
          <Route path="lineas" element={<BusinessLinesScreen />} />
          <Route path="mercados" element={<MarketsScreen />} />
          <Route path="colores" element={<ColorsScreen />} />
          <Route path="destacados" element={<FeaturedProductsScreen />} />
          <Route path="ajustes" element={<SiteScreen />} />
          <Route path="medios" element={<MediaScreen />} />
          <Route path="mensajes" element={<MessagesScreen />} />
          <Route path="correo" element={<NotificationsScreen />} />
          <Route path="contrasena" element={<PasswordScreen />} />
          <Route path="*" element={<Navigate to="/admin/inicio" replace />} />
        </Routes>
      </main>

      {/* Fuera del `main` para que el foco pueda iluminar también el menú
          lateral. Se coloca por coordenadas, así que da igual dónde viva. */}
      <Guia />
    </div>
  )
}

/* --- Raíz --------------------------------------------------------------------- */

export default function AdminApp() {
  const [user, setUser] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  const check = useCallback(() => {
    api
      .getSession()
      .then((session) => setUser(session.authenticated ? (session.user ?? 'admin') : null))
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  useEffect(check, [check])

  // El título de la pestaña lo gestiona el panel, no el SEO del sitio público.
  useEffect(() => {
    document.title = 'Panel de contenido — PPG'
  }, [])

  if (checking) {
    return (
      <div className="admin" style={{ padding: 40 }}>
        <Loading label="Comprobando la sesión…" />
      </div>
    )
  }

  if (!user) return <LoginScreen onSuccess={setUser} />

  return (
    <div className="admin">
      <Shell user={user} onLogout={() => setUser(null)} />
    </div>
  )
}
