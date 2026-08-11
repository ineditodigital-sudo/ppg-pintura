import { useId, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { guiaDeLaRuta } from '../guia'
import { abrirGuia } from './Guia'

export function PageHead({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  const [abierta, setAbierta] = useState(false)
  const id = useId()
  const { pathname } = useLocation()

  // Los pasos salen de la misma guía que se abre sola la primera vez. Tener
  // dos textos para lo mismo acabaría con uno de los dos desactualizado.
  const encontrada = guiaDeLaRuta(pathname)
  const ayuda = encontrada?.guia.pasos

  return (
    <header className="admin-head">
      <div className="admin-head__texto">
        <h1>{title}</h1>
        {description && <p>{description}</p>}

        {ayuda && ayuda.length > 0 && (
          <>
            <button
              type="button"
              className="admin-head__ayuda-btn"
              aria-expanded={abierta}
              aria-controls={id}
              onClick={() => setAbierta((v) => !v)}
            >
              <span aria-hidden="true">?</span>
              {abierta ? 'Ocultar la ayuda' : 'Cómo funciona esta pantalla'}
            </button>

            {abierta && (
              <div className="admin-head__ayuda" id={id}>
                <ol>
                  {ayuda.map((paso, i) => (
                    <li key={i}>
                      <strong>{paso.titulo}.</strong> {paso.texto}
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="adm-btn adm-btn--primary adm-btn--sm"
                  onClick={abrirGuia}
                >
                  Verlo sobre la pantalla
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {actions && <div className="admin-head__actions">{actions}</div>}
    </header>
  )
}

export function Alert({
  kind,
  message,
  errors,
}: {
  kind: 'ok' | 'error'
  message: string
  errors?: string[]
}) {
  if (!message) return null

  return (
    <div className={`adm-alert adm-alert--${kind}`} role="status" aria-live="polite">
      {message}
      {errors && errors.length > 1 && (
        <ul>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Barra fija con el estado de cambios sin guardar. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  extra,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onReset?: () => void
  extra?: ReactNode
}) {
  return (
    <div className="adm-savebar">
      <span className={`adm-savebar__state${dirty ? ' is-dirty' : ''}`}>
        {saving
          ? 'Guardando…'
          : dirty
            ? 'Tienes cambios sin guardar'
            : 'Todo guardado'}
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {extra}
        {onReset && (
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={onReset}
            disabled={!dirty || saving}
          >
            Descartar cambios
          </button>
        )}
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={onSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return <div className="adm-empty">{label}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="adm-empty">{children}</div>
}
