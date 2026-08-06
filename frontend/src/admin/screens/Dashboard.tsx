import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import { PageHead } from '../components/Common'
import {
  IconArrow,
  IconInbox,
  IconMedia,
  IconPages,
  IconSettings,
} from '../components/Icons'

interface Resumen {
  paginas: number | null
  medios: number | null
  mensajes: number | null
}

/**
 * Pantalla de entrada del panel.
 *
 * Antes se caía directo en el listado de páginas, que es lo más árido posible.
 * Aquí se ve de un vistazo el estado del sitio y los accesos habituales.
 */
export function DashboardScreen({ user }: { user: string }) {
  const [resumen, setResumen] = useState<Resumen>({
    paginas: null,
    medios: null,
    mensajes: null,
  })

  useEffect(() => {
    // Cada cifra se resuelve por separado: si una falla, las demás se muestran.
    api.listPages().then(
      (p) => setResumen((r) => ({ ...r, paginas: p.length })),
      () => setResumen((r) => ({ ...r, paginas: 0 })),
    )
    api.listMedia().then(
      (m) => setResumen((r) => ({ ...r, medios: m.length })),
      () => setResumen((r) => ({ ...r, medios: 0 })),
    )
    api.listMessages().then(
      (m) => setResumen((r) => ({ ...r, mensajes: m.length })),
      () => setResumen((r) => ({ ...r, mensajes: 0 })),
    )
  }, [])

  const tarjetas = [
    {
      to: '/admin/paginas',
      icon: <IconPages size={22} />,
      valor: resumen.paginas,
      label: 'Páginas publicadas',
      pie: 'Editar contenido',
      destacada: false,
    },
    {
      to: '/admin/medios',
      icon: <IconMedia size={22} />,
      valor: resumen.medios,
      label: 'Imágenes en biblioteca',
      pie: 'Subir o eliminar',
      destacada: false,
    },
    {
      to: '/admin/mensajes',
      icon: <IconInbox size={22} />,
      valor: resumen.mensajes,
      label: 'Mensajes recibidos',
      pie: 'Ver bandeja',
      destacada: true,
    },
  ]

  const accesos = [
    { to: '/admin/paginas/home', label: 'Editar la portada', icon: <IconPages size={18} /> },
    { to: '/admin/navegacion', label: 'Cambiar el menú', icon: <IconArrow size={18} /> },
    { to: '/admin/lineas', label: 'Líneas de producto', icon: <IconArrow size={18} /> },
    { to: '/admin/ajustes', label: 'Datos del sitio', icon: <IconSettings size={18} /> },
  ]

  return (
    <>
      <PageHead
        title={`Hola, ${user}`}
        description="Este es el estado del sitio. Desde aquí puedes editar el contenido, subir imágenes y revisar los mensajes que llegan del formulario."
      />

      <div className="adm-tiles">
        {tarjetas.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`adm-tile${t.destacada ? ' adm-tile--highlight' : ''}`}
          >
            <span className="adm-tile__icon">{t.icon}</span>
            <span className="adm-tile__value">
              {t.valor === null ? '—' : t.valor}
            </span>
            <span className="adm-tile__label">{t.label}</span>
            <span className="adm-tile__foot">
              {t.pie}
              <IconArrow size={15} />
            </span>
          </Link>
        ))}
      </div>

      <section className="admin-card adm-quick">
        <h2>Accesos rápidos</h2>
        <div className="adm-quick__grid">
          {accesos.map((a) => (
            <Link key={a.to} to={a.to} className="adm-quick__item">
              {a.icon}
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>Cómo funciona</h2>
        <p className="adm-help">
          Cada página es una lista de <strong>bloques</strong>. Puedes añadirlos,
          reordenarlos y editarlos por separado. Los cambios se publican en
          cuanto guardas, y de cada archivo se conservan las diez versiones
          anteriores por si hace falta volver atrás.
        </p>
        <p className="adm-help">
          En las rejillas de tarjetas y en los grupos de cifras puedes marcar
          <strong> un elemento como destacado</strong>: se rellena en azul y
          rompe la monotonía de la cuadrícula. Usa sólo uno por grupo.
        </p>
      </section>
    </>
  )
}
