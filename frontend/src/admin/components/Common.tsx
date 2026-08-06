import type { ReactNode } from 'react'

export function PageHead({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="admin-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
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
