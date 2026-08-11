import { useEffect, useState } from 'react'
import * as api from '../api'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import '../editor.css'

/**
 * A dónde llegan los mensajes del formulario.
 *
 * La pantalla está pensada para alguien que no administra webs: en lugar de
 * pedir «configuración SMTP», pide una dirección de correo y ofrece un botón
 * para comprobar que funciona. Recibir el correo de prueba es la única prueba
 * que de verdad tranquiliza.
 */
export function NotificationsScreen() {
  const [ajustes, setAjustes] = useState<api.NotificationSettings | null>(null)
  const [original, setOriginal] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState<string[]>([])
  const [aviso, setAviso] = useState('')

  const [probando, setProbando] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => {
    api
      .getNotifications()
      .then((d) => {
        setAjustes(d)
        setOriginal(JSON.stringify(d))
      })
      .catch((e) => setError(e.message))
  }, [])

  const dirty = ajustes !== null && JSON.stringify(ajustes) !== original

  async function guardar() {
    if (!ajustes) return
    setGuardando(true)
    setError('')
    setErrores([])
    setAviso('')
    try {
      const r = await api.saveNotifications(ajustes)
      setAjustes(r.settings)
      setOriginal(JSON.stringify(r.settings))
      setAviso(r.message)
    } catch (e) {
      if (e instanceof api.ApiError) {
        setError(e.message)
        setErrores(e.errors)
      } else {
        setError('No se pudo guardar.')
      }
    } finally {
      setGuardando(false)
    }
  }

  async function probar() {
    if (!ajustes) return
    const destino = ajustes.recipients[0] ?? ''
    setProbando(true)
    setResultadoPrueba(null)
    try {
      const r = await api.sendTestEmail(destino)
      setResultadoPrueba({ ok: true, texto: r.message })
    } catch (e) {
      setResultadoPrueba({
        ok: false,
        texto: e instanceof Error ? e.message : 'No se pudo enviar la prueba.',
      })
    } finally {
      setProbando(false)
    }
  }

  if (error && !ajustes) return <Alert kind="error" message={error} />
  if (!ajustes) return <Loading />

  const set = (parcial: Partial<api.NotificationSettings>) =>
    setAjustes({ ...ajustes, ...parcial })

  const destinos = ajustes.recipients.length > 0 ? ajustes.recipients : ['']

  const cambiarDestino = (i: number, valor: string) => {
    const siguiente = [...destinos]
    siguiente[i] = valor
    set({ recipients: siguiente.filter((d, j) => d.trim() !== '' || j === i) })
  }

  return (
    <>
      <PageHead
        title="Correo"
        ayuda={[
          'Aquí se configura a quién avisa el sitio cuando alguien rellena el formulario.',
          'El remitente debe ser una dirección del propio dominio; si no, muchos servidores marcan el aviso como spam.',
          'Usa el botón de prueba para comprobar que llega antes de darlo por bueno.',
        ]}
        description="Cuando alguien rellena el formulario de contacto, aquí decides a qué buzón llega el aviso."
      />

      <Alert kind="error" message={error} errors={errores} />
      <Alert kind="ok" message={aviso} />

      <div className="admin-card">
        <label className="adm-switch">
          <input
            type="checkbox"
            checked={ajustes.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          <span className="adm-switch__track" aria-hidden="true">
            <span className="adm-switch__dot" />
          </span>
          <span className="adm-switch__text">
            <strong>Avisarme por correo de cada mensaje</strong>
            <small>
              Si lo apagas, los mensajes se seguirán guardando en «Mensajes»,
              pero nadie recibirá ningún aviso.
            </small>
          </span>
        </label>
      </div>

      <div className="admin-card">
        <h2 className="adm-card__title">¿A quién avisamos?</h2>
        <p className="adm-card__hint">
          Puedes poner varias direcciones. Todas recibirán una copia del mismo
          mensaje.
        </p>

        {destinos.map((destino, i) => (
          <div className="adm-row-inline" key={i}>
            <input
              type="email"
              className="adm-input"
              value={destino}
              placeholder="ventas@coatingsystemsmx.com"
              onChange={(e) => cambiarDestino(i, e.target.value)}
            />
            {destinos.length > 1 && (
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--sm"
                onClick={() => set({ recipients: destinos.filter((_, j) => j !== i) })}
              >
                Quitar
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="adm-btn adm-btn--ghost adm-btn--sm"
          style={{ marginTop: 8 }}
          onClick={() => set({ recipients: [...destinos, ''] })}
        >
          + Añadir otra dirección
        </button>
      </div>

      <div className="admin-card">
        <h2 className="adm-card__title">Comprobar que funciona</h2>
        <p className="adm-card__hint">
          Te enviamos un correo de ejemplo, con el mismo aspecto que tendrán los
          avisos reales. Guarda primero si acabas de cambiar la dirección.
        </p>
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={() => void probar()}
          disabled={probando || dirty || !ajustes.recipients[0]}
        >
          {probando ? 'Enviando…' : 'Enviarme un correo de prueba'}
        </button>
        {dirty && (
          <p className="adm-card__hint" style={{ marginTop: 8 }}>
            Tienes cambios sin guardar: guárdalos antes de probar.
          </p>
        )}
        {resultadoPrueba && (
          <div
            className={`adm-alert adm-alert--${resultadoPrueba.ok ? 'ok' : 'error'}`}
            style={{ marginTop: 12 }}
            role="status"
          >
            {resultadoPrueba.texto}
          </div>
        )}
      </div>

      <details className="admin-card adm-details">
        <summary>Opciones avanzadas</summary>

        <label className="adm-field">
          <span className="adm-field__label">Nombre que aparece como remitente</span>
          <input
            className="adm-input"
            value={ajustes.fromName}
            onChange={(e) => set({ fromName: e.target.value })}
          />
        </label>

        <label className="adm-field">
          <span className="adm-field__label">Dirección desde la que se envía</span>
          <input
            type="email"
            className="adm-input"
            value={ajustes.fromEmail}
            placeholder="no-responder@pinturaenpolvo-mx.com"
            onChange={(e) => set({ fromEmail: e.target.value })}
          />
          <span className="adm-field__help">
            Debe pertenecer a este dominio. Si pones una de Gmail o de otro
            proveedor, muchos servidores marcarán el aviso como spam.
          </span>
        </label>

        <label className="adm-field">
          <span className="adm-field__label">Texto inicial del asunto</span>
          <input
            className="adm-input"
            value={ajustes.subjectPrefix}
            onChange={(e) => set({ subjectPrefix: e.target.value })}
          />
        </label>

        <label className="adm-switch" style={{ marginTop: 4 }}>
          <input
            type="checkbox"
            checked={ajustes.copyToSender}
            onChange={(e) => set({ copyToSender: e.target.checked })}
          />
          <span className="adm-switch__track" aria-hidden="true">
            <span className="adm-switch__dot" />
          </span>
          <span className="adm-switch__text">
            <strong>Enviar acuse de recibo a quien escribe</strong>
            <small>Recibe un correo confirmando que su mensaje llegó.</small>
          </span>
        </label>
      </details>

      <SaveBar
        dirty={dirty}
        saving={guardando}
        onSave={() => void guardar()}
        onReset={() => setAjustes(JSON.parse(original) as api.NotificationSettings)}
      />
    </>
  )
}
