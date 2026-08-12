import { useEffect, useId, useState, type ReactNode } from 'react'
import { Icon } from '@/lib/icons'
import type { FieldDef } from '../schema'
import { listMedia, uploadMedia, type MediaItem } from '../api'
import { IconEye, IconEyeOff } from './Icons'

/* --- Envoltorio común ------------------------------------------------------ */

/**
 * Campo de contraseña con botón para revelarla.
 *
 * Escribir una contraseña a ciegas es la primera causa de «no me deja entrar»
 * cuando en realidad hay una errata. El botón alterna entre `password` y
 * `text`; arranca siempre oculto y no recuerda el estado entre campos.
 *
 * Va como componente y no suelto en cada pantalla porque hay cuatro campos de
 * contraseña —el acceso y los tres del cambio de clave— y tenían que
 * comportarse igual.
 */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  autoFocus,
  required,
  minLength,
  id,
}: {
  value: string
  onChange: (valor: string) => void
  autoComplete?: string
  autoFocus?: boolean
  required?: boolean
  minLength?: number
  id?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="adm-clave">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="adm-clave__ojo"
        onClick={() => setVisible((v) => !v)}
        // `aria-pressed` comunica el estado; la etiqueta dice qué hace al
        // pulsar. Sin ella el lector de pantalla anunciaría un botón sin
        // nombre, porque el icono va oculto a propósito.
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
        title={visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
      >
        {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </div>
  )
}

export function Field({
  label,
  help,
  required,
  htmlFor,
  children,
}: {
  label: string
  help?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="adm-field">
      <label htmlFor={htmlFor} className="adm-field__label">
        {label}
        {required && <span className="adm-required"> *</span>}
      </label>
      {children}
      {help && <span className="adm-field__help">{help}</span>}
    </div>
  )
}

/* --- Selector de imagen ----------------------------------------------------- */

interface MediaValue {
  src?: string
  alt?: string
}

export function MediaPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (item: MediaItem) => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    listMedia()
      .then(setItems)
      .catch((e) => setError(e.message))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleUpload(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const item = await uploadMedia(file)
      setItems((prev) => [item, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir el archivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm-modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="adm-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal__head">
          <h2>Biblioteca de medios</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="adm-btn adm-btn--ghost" style={{ cursor: 'pointer' }}>
              {busy ? 'Subiendo…' : 'Subir imagen'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                disabled={busy}
                onChange={(e) => {
                  void handleUpload(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
        <div className="adm-modal__body">
          {error && <div className="adm-alert adm-alert--error">{error}</div>}
          <div className="adm-media">
            {items.map((item) => (
              <button
                type="button"
                key={item.src}
                className="adm-media__item"
                onClick={() => {
                  onPick(item)
                  onClose()
                }}
              >
                <div className="adm-media__thumb">
                  <img src={item.src} alt="" loading="lazy" />
                </div>
                <div className="adm-media__meta">
                  <div className="adm-media__name">{item.name}</div>
                  <div className="adm-media__folder">{item.folder}</div>
                </div>
              </button>
            ))}
          </div>
          {items.length === 0 && !error && (
            <p className="adm-field__help">Cargando biblioteca…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ImageField({
  label,
  required,
  value,
  onChange,
}: {
  label: string
  required?: boolean
  value: MediaValue | undefined
  onChange: (value: MediaValue | undefined) => void
}) {
  const [picking, setPicking] = useState(false)
  const src = value?.src ?? ''

  return (
    <Field label={label} required={required}>
      <div className="adm-image">
        <div className="adm-image__preview">
          {src ? <img src={src} alt="" /> : <span>Sin imagen</span>}
        </div>
        <div className="adm-image__fields">
          <input
            type="text"
            value={src}
            placeholder="/assets/business/aerospace.jpg"
            onChange={(e) => onChange({ ...value, src: e.target.value })}
          />
          <input
            type="text"
            value={value?.alt ?? ''}
            placeholder="Texto alternativo (accesibilidad)"
            onChange={(e) => onChange({ ...value, src, alt: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="adm-btn adm-btn--ghost adm-btn--sm"
              onClick={() => setPicking(true)}
            >
              Elegir de la biblioteca
            </button>
            {src && (
              <button
                type="button"
                className="adm-btn adm-btn--danger adm-btn--sm"
                onClick={() => onChange(undefined)}
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>
      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(item) => onChange({ src: item.src, alt: value?.alt ?? '' })}
      />
    </Field>
  )
}

/* --- Enlace ------------------------------------------------------------------ */

interface LinkValue {
  label?: string
  href?: string
  external?: boolean
}

export function LinkField({
  label,
  value,
  onChange,
}: {
  label: string
  value: LinkValue | undefined
  onChange: (value: LinkValue | undefined) => void
}) {
  const filled = Boolean(value?.label || value?.href)

  return (
    <Field label={label} help="Deja ambos campos vacíos para no mostrar el botón.">
      <div className="adm-link">
        <input
          type="text"
          value={value?.label ?? ''}
          placeholder="Texto del botón"
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
        <input
          type="text"
          value={value?.href ?? ''}
          placeholder="/contacto o https://…"
          onChange={(e) => onChange({ ...value, href: e.target.value })}
        />
        {filled && (
          <button
            type="button"
            className="adm-btn adm-btn--icon"
            title="Quitar el botón"
            onClick={() => onChange(undefined)}
          >
            ✕
          </button>
        )}
      </div>
    </Field>
  )
}

/* --- Lista de textos simples --------------------------------------------------- */

export function StringListField({
  label,
  help,
  required,
  value,
  onChange,
}: {
  label: string
  help?: string
  required?: boolean
  value: string[] | undefined
  onChange: (value: string[]) => void
}) {
  const items = Array.isArray(value) ? value : []

  const update = (index: number, next: string) =>
    onChange(items.map((item, i) => (i === index ? next : item)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <Field label={label} help={help} required={required}>
      <div className="adm-list">
        {items.map((item, index) => (
          <div className="adm-list__bar" key={index}>
            <textarea
              value={item}
              rows={2}
              style={{ flex: 1 }}
              onChange={(e) => update(index, e.target.value)}
            />
            <button
              type="button"
              className="adm-btn adm-btn--icon"
              title="Subir"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--icon"
              title="Bajar"
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--icon"
              title="Eliminar"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="adm-btn adm-btn--ghost adm-btn--sm"
          onClick={() => onChange([...items, ''])}
        >
          + Añadir
        </button>
      </div>
    </Field>
  )
}

/* --- Lista de objetos ------------------------------------------------------------ */

export function ListField({
  label,
  help,
  required,
  itemFields,
  itemLabelKey,
  itemSubtitleKey,
  itemImageKey,
  itemIconKey,
  itemThumb,
  variante = 'filas',
  value,
  onChange,
}: {
  label: string
  help?: string
  required?: boolean
  itemFields: FieldDef[]
  itemLabelKey?: string
  /** Segunda línea de la tarjeta: el titular del mercado, la URL… */
  itemSubtitleKey?: string
  /** Campo con la imagen que sirve de miniatura. */
  itemImageKey?: string
  /** Icono de respaldo cuando no hay imagen. */
  itemIconKey?: string
  /**
   * Miniatura a medida, cuando ni una foto ni un icono del catálogo sirven:
   * el glifo de una red social, las muestras de una familia de color. Se
   * pasa desde la pantalla para no meter aquí lo que sólo ella sabe.
   */
  itemThumb?: (item: Record<string, unknown>) => ReactNode
  /**
   * `tarjetas` para los listados de contenido; `filas` para las listas
   * anidadas dentro de un formulario, donde una rejilla de tarjetas sería
   * desproporcionada.
   */
  variante?: 'filas' | 'tarjetas'
  value: Record<string, unknown>[] | undefined
  onChange: (value: Record<string, unknown>[]) => void
}) {
  const items = Array.isArray(value) ? value : []
  const [open, setOpen] = useState<number | null>(null)

  const update = (index: number, next: Record<string, unknown>) =>
    onChange(items.map((item, i) => (i === index ? next : item)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setOpen(target)
  }

  const blank = () =>
    Object.fromEntries(
      itemFields.map((f) => [f.key, f.type === 'list' || f.type === 'stringList' ? [] : '']),
    )

  /* --- Tarjetas: los listados de contenido ------------------------------- */

  if (variante === 'tarjetas') {
    const abierto = open !== null ? items[open] : null

    return (
      <Field label={label} help={help} required={required}>
        <div className="adm-tarjetas">
          {items.map((item, index) => {
            const titulo =
              (itemLabelKey && typeof item[itemLabelKey] === 'string'
                ? (item[itemLabelKey] as string)
                : '') || `Elemento ${index + 1}`
            const subtitulo =
              itemSubtitleKey && typeof item[itemSubtitleKey] === 'string'
                ? (item[itemSubtitleKey] as string)
                : ''
            const imagen = itemImageKey
              ? ((item[itemImageKey] as { src?: string } | undefined)?.src ?? '')
              : ''
            const icono =
              itemIconKey && typeof item[itemIconKey] === 'string'
                ? (item[itemIconKey] as string)
                : ''

            return (
              <div
                className={`adm-tarjeta${open === index ? ' is-open' : ''}`}
                key={index}
              >
                <button
                  type="button"
                  className="adm-tarjeta__abrir"
                  onClick={() => setOpen(open === index ? null : index)}
                  aria-expanded={open === index}
                  // Sin esto el nombre accesible sale de concatenar todo lo que
                  // hay dentro: «ArquitecturaAcabados que aguantan a la
                  // intemperieEditar». Se lee, pero no se entiende.
                  aria-label={`${open === index ? 'Cerrar' : 'Editar'} ${titulo}`}
                >
                  <span className="adm-tarjeta__mini">
                    {itemThumb ? (
                      itemThumb(item)
                    ) : imagen ? (
                      <img src={imagen} alt="" loading="lazy" decoding="async" />
                    ) : icono ? (
                      <Icon name={icono} size={26} />
                    ) : (
                      // Sin foto ni icono, la inicial sobre el tinte de marca:
                      // sigue siendo un ancla visual y no un hueco gris.
                      <span className="adm-tarjeta__inicial" aria-hidden="true">
                        {titulo.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {imagen && icono && (
                      // El icono que sale en el sitio, encima de la foto: es el
                      // dato que se está editando, y su nombre interno
                      // —«engrane»— no le decía nada a nadie.
                      <span className="adm-tarjeta__sello" aria-hidden="true">
                        <Icon name={icono} size={13} />
                      </span>
                    )}
                  </span>
                  <span className="adm-tarjeta__texto">
                    <span className="adm-tarjeta__titulo">{titulo}</span>
                    {subtitulo && (
                      <span className="adm-tarjeta__sub">{subtitulo}</span>
                    )}
                  </span>
                  <span className="adm-tarjeta__accion" aria-hidden="true">
                    {open === index ? 'Cerrar' : 'Editar'}
                  </span>
                </button>

                <div className="adm-tarjeta__orden">
                  <button
                    type="button"
                    className="adm-btn adm-btn--icon"
                    title="Subir"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn--icon"
                    title="Bajar"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn--icon"
                    title="Eliminar"
                    onClick={() => {
                      onChange(items.filter((_, i) => i !== index))
                      setOpen(null)
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* El formulario va debajo y a todo el ancho, no dentro de la tarjeta:
            en una celda de rejilla los campos quedarían en una columna
            estrecha y sería peor que la lista que sustituye. */}
        {abierto !== null && open !== null && (
          <div className="adm-editor">
            <div className="adm-editor__cabecera">
              <h3>
                Editando:{' '}
                {(itemLabelKey && typeof abierto[itemLabelKey] === 'string'
                  ? (abierto[itemLabelKey] as string)
                  : '') || `Elemento ${open + 1}`}
              </h3>
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--sm"
                onClick={() => setOpen(null)}
              >
                Cerrar
              </button>
            </div>
            {itemFields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={abierto[field.key]}
                onChange={(next) => update(open, { ...abierto, [field.key]: next })}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="adm-btn adm-btn--ghost adm-btn--sm"
          style={{ marginTop: 12 }}
          onClick={() => {
            onChange([...items, blank()])
            setOpen(items.length)
          }}
        >
          + Añadir
        </button>
      </Field>
    )
  }

  /* --- Filas: listas anidadas dentro de un formulario --------------------- */

  return (
    <Field label={label} help={help} required={required}>
      <div className="adm-list">
        {items.map((item, index) => {
          const isOpen = open === index
          const heading =
            (itemLabelKey && typeof item[itemLabelKey] === 'string'
              ? (item[itemLabelKey] as string)
              : '') || `Elemento ${index + 1}`

          return (
            <div className={`adm-list__item${isOpen ? ' is-open' : ''}`} key={index}>
              <div className="adm-list__bar">
                <button
                  type="button"
                  className="adm-list__handle"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? '▾' : '▸'} {heading}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--icon"
                  title="Subir"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--icon"
                  title="Bajar"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--icon"
                  title="Eliminar"
                  onClick={() => {
                    onChange(items.filter((_, i) => i !== index))
                    setOpen(null)
                  }}
                >
                  ✕
                </button>
              </div>
              {isOpen && (
                <div className="adm-list__body">
                  {itemFields.map((field) => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      onChange={(next) => update(index, { ...item, [field.key]: next })}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <button
          type="button"
          className="adm-btn adm-btn--ghost adm-btn--sm"
          onClick={() => {
            onChange([...items, blank()])
            setOpen(items.length)
          }}
        >
          + Añadir
        </button>
      </div>
    </Field>
  )
}

/* --- Despachador genérico ---------------------------------------------------------- */

export function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
}) {
  const id = useId()

  switch (field.type) {
    case 'textarea':
      return (
        <Field label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <textarea
            id={id}
            value={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )

    case 'select':
      return (
        <Field label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <select
            id={id}
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => {
              const raw = e.target.value
              const match = field.options?.find((o) => String(o.value) === raw)
              onChange(match ? match.value : raw)
            }}
          >
            <option value="">—</option>
            {field.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      )

    case 'number':
      return (
        <Field label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input
            id={id}
            type="number"
            value={typeof value === 'number' ? value : ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </Field>
      )

    case 'boolean':
      return (
        <div className="adm-field">
          <label className="adm-check" htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              // `undefined` en vez de `false` para que BlockForm borre la
              // clave y el JSON no se llene de banderas apagadas.
              onChange={(e) => onChange(e.target.checked ? true : undefined)}
            />
            <span>{field.label}</span>
          </label>
          {field.help && <span className="adm-field__help">{field.help}</span>}
        </div>
      )

    case 'color':
      return (
        <Field label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <div className="adm-color">
            <input
              type="color"
              value={typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '#0078a9'}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${field.label}: selector`}
            />
            <input
              id={id}
              type="text"
              value={typeof value === 'string' ? value : ''}
              placeholder="#0078A9"
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </Field>
      )

    case 'image':
      return (
        <ImageField
          label={field.label}
          required={field.required}
          value={value as MediaValue | undefined}
          onChange={onChange}
        />
      )

    case 'link':
      return (
        <LinkField
          label={field.label}
          value={value as LinkValue | undefined}
          onChange={onChange}
        />
      )

    case 'stringList':
      return (
        <StringListField
          label={field.label}
          help={field.help}
          required={field.required}
          value={value as string[] | undefined}
          onChange={onChange}
        />
      )

    case 'list':
      return (
        <ListField
          label={field.label}
          help={field.help}
          required={field.required}
          itemFields={field.itemFields ?? []}
          itemLabelKey={field.itemLabelKey}
          value={value as Record<string, unknown>[] | undefined}
          onChange={onChange}
        />
      )

    default:
      return (
        <Field label={field.label} help={field.help} required={field.required} htmlFor={id}>
          <input
            id={id}
            type="text"
            value={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )
  }
}
