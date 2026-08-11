import { useCallback, useEffect, useState } from 'react'
import * as api from '../api'
import { Alert, Empty, Loading, PageHead } from '../components/Common'
import { Field, PasswordInput } from '../components/Fields'

/* --- Bandeja de mensajes ------------------------------------------------------ */

export function MessagesScreen() {
  const [messages, setMessages] = useState<api.ContactMessage[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(() => {
    api
      .listMessages()
      .then(setMessages)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  async function remove(id: number) {
    if (!confirm('¿Eliminar este mensaje? No se puede deshacer.')) return
    try {
      const result = await api.deleteMessage(id)
      setNotice(result.message)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.')
    }
  }

  return (
    <>
      <PageHead
        title="Mensajes"
        ayuda={[
          'Bandeja de lo que llega por el formulario de contacto.',
          'Eliminar un mensaje es definitivo: no hay papelera.',
          'Si esperas mensajes y no llega ninguno, revisa la pantalla de Correo: puede que el aviso no esté configurado.',
        ]}
        description="Lo que llega desde el formulario de la página de contacto."
        actions={
          <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
            Actualizar
          </button>
        }
      />
      <Alert kind="error" message={error} />
      <Alert kind="ok" message={notice} />

      {messages === null ? (
        <Loading />
      ) : messages.length === 0 ? (
        <Empty>Todavía no hay mensajes.</Empty>
      ) : (
        messages.map((message) => (
          <div className="admin-card" key={message.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="admin-row__title">
                  {message.name}
                  {message.company ? ` · ${message.company}` : ''}
                </div>
                <div className="adm-message__meta">
                  <a href={`mailto:${message.email}`}>{message.email}</a> · {message.topic} ·{' '}
                  {new Date(message.receivedAt).toLocaleString('es-MX')}
                </div>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn--danger adm-btn--sm"
                onClick={() => void remove(message.id)}
              >
                Eliminar
              </button>
            </div>
            <p className="adm-message__text" style={{ marginTop: 12 }}>
              {message.message}
            </p>
          </div>
        ))
      )}
    </>
  )
}

/* --- Biblioteca de medios ------------------------------------------------------ */

export function MediaScreen() {
  const [items, setItems] = useState<api.MediaItem[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api
      .listMedia()
      .then(setItems)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  async function upload(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const item = await api.uploadMedia(file)
      setNotice(`«${item.name}» subida.`)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(name: string) {
    if (!confirm(`¿Eliminar «${name}»? Si alguna página la usa, dejará de verse.`)) return
    try {
      await api.deleteMedia(name)
      setNotice('Imagen eliminada.')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.')
    }
  }

  return (
    <>
      <PageHead
        title="Medios"
        ayuda={[
          'Biblioteca de imágenes del sitio. Lo que subas aquí queda disponible en cualquier campo de imagen.',
          'Se validan por contenido real, no por extensión: un archivo renombrado se rechaza. No se admiten SVG.',
          'Copia la ruta con el botón de copiar y pégala en el campo de imagen que necesites.',
        ]}
        description="JPG, PNG, WEBP y GIF hasta 5 MB. Sólo se pueden eliminar las imágenes subidas desde aquí."
        actions={
          <label className="adm-btn adm-btn--primary" style={{ cursor: 'pointer' }}>
            {busy ? 'Subiendo…' : 'Subir imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        }
      />
      <Alert kind="error" message={error} />
      <Alert kind="ok" message={notice} />

      {items === null ? (
        <Loading />
      ) : (
        <div className="adm-media">
          {items.map((item) => (
            <div className="adm-media__item" key={item.src}>
              <div className="adm-media__thumb">
                <img src={item.src} alt="" loading="lazy" />
              </div>
              <div className="adm-media__meta">
                <div className="adm-media__name" title={item.name}>
                  {item.name}
                </div>
                <div className="adm-media__folder">
                  {item.folder} · {Math.round(item.size / 1024)} KB
                </div>
                {item.editable && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--danger adm-btn--sm"
                    style={{ marginTop: 6, width: '100%' }}
                    onClick={() => void remove(item.name)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* --- Cambio de contraseña ------------------------------------------------------- */

export function PasswordScreen() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (next !== repeat) {
      setError('La nueva contraseña y su repetición no coinciden.')
      return
    }

    setBusy(true)
    try {
      const result = await api.changePassword(current, next)
      setNotice(result.message)
      setCurrent('')
      setNext('')
      setRepeat('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead
        title="Contraseña"
        ayuda={[
          'Cambia la contraseña de acceso al panel.',
          'Mínimo diez caracteres. Al cambiarla tu sesión sigue abierta.',
          'No se guarda en ningún sitio en claro: sólo su huella cifrada, que no se puede revertir. Si la pierdes, hay que restablecerla desde el servidor.',
        ]}
        description="Mínimo 10 caracteres. Al cambiarla, tu sesión actual sigue activa."
      />
      <Alert kind="error" message={error} />
      <Alert kind="ok" message={notice} />

      <form className="admin-card" style={{ maxWidth: 460 }} onSubmit={(e) => void submit(e)}>
        <Field label="Contraseña actual" required>
          <PasswordInput
            value={current}
            autoComplete="current-password"
            required
            onChange={setCurrent}
          />
        </Field>
        <Field label="Nueva contraseña" required>
          <PasswordInput
            value={next}
            autoComplete="new-password"
            minLength={10}
            required
            onChange={setNext}
          />
        </Field>
        <Field label="Repite la nueva contraseña" required>
          <PasswordInput
            value={repeat}
            autoComplete="new-password"
            minLength={10}
            required
            onChange={setRepeat}
          />
        </Field>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </>
  )
}
