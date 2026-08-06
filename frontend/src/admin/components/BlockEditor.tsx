import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Block } from '@/types/content'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { BLOCK_SCHEMA, blockLabel, blockSummary } from '../schema'
import { FieldRenderer } from './Fields'
import { BlockCatalog } from './BlockCatalog'
import { IconCopy, IconDrag, IconEye, IconPlus, IconTrash } from './Icons'
import '../editor.css'

type BlockValue = Record<string, unknown>

/**
 * Editor de página a dos columnas: los bloques a la izquierda, la página de
 * verdad a la derecha.
 *
 * La vista previa no es una aproximación: monta los mismos componentes que
 * usa el sitio público, con el mismo CSS. Lo que se ve aquí es exactamente lo
 * que verá el visitante, y cambia según se escribe. Ese es el punto: quien
 * edita deja de imaginarse el resultado a partir de un formulario.
 */

/* --- Formulario de un bloque ------------------------------------------------ */

function BlockForm({
  block,
  onChange,
}: {
  block: BlockValue
  onChange: (block: BlockValue) => void
}) {
  const def = BLOCK_SCHEMA[String(block.type)]

  if (!def) {
    return (
      <div className="adm-alert adm-alert--error">
        Tipo de bloque desconocido: «{String(block.type)}». Este bloque no se
        puede editar aquí y el servidor rechazará la página si se guarda así.
      </div>
    )
  }

  return (
    <>
      {def.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={block[field.key]}
          onChange={(value) => {
            const next = { ...block }
            // Un campo vacío se elimina en vez de guardarse como "", para que
            // el JSON no se llene de claves inertes.
            if (value === undefined || value === '') {
              delete next[field.key]
            } else {
              next[field.key] = value
            }
            onChange(next)
          }}
        />
      ))}
    </>
  )
}

/* --- Vista previa ----------------------------------------------------------- */

const ANCHOS = [
  { id: 'movil', etiqueta: 'Móvil', px: 390 },
  { id: 'tablet', etiqueta: 'Tablet', px: 820 },
  { id: 'escritorio', etiqueta: 'Escritorio', px: 1360 },
] as const

/**
 * Marco aislado donde se dibuja la página.
 *
 * Tiene que ser un `iframe` y no un simple contenedor estrecho: las media
 * queries del sitio miran el ancho de la ventana, no el del elemento que las
 * contiene. Dentro de un div de 390px el CSS seguiría creyendo que está en un
 * escritorio de 1600 y la vista previa mentiría justo donde más importa.
 * El iframe tiene su propia ventana, así que a 390px se comporta como un móvil.
 */
function MarcoAislado({
  ancho,
  children,
}: {
  ancho: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [cuerpo, setCuerpo] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const doc = ref.current?.contentDocument
    if (!doc) return

    doc.open()
    doc.write('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>')
    doc.close()

    // Los estilos del sitio se copian tal cual desde el documento padre: así
    // la vista previa usa exactamente la misma hoja que la página pública,
    // sin una copia que mantener al día.
    for (const nodo of Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))) {
      doc.head.appendChild(nodo.cloneNode(true))
    }

    doc.documentElement.classList.add('js')
    doc.body.style.margin = '0'
    setCuerpo(doc.body)
  }, [])

  return (
    <iframe
      ref={ref}
      className="adm-preview__iframe"
      title="Vista previa de la página"
      style={{ width: ancho }}
    >
      {cuerpo && createPortal(children, cuerpo)}
    </iframe>
  )
}

function Preview({
  blocks,
  activo,
  onSelect,
}: {
  blocks: BlockValue[]
  activo: number | null
  onSelect: (index: number) => void
}) {
  const [ancho, setAncho] = useState<(typeof ANCHOS)[number]['id']>('tablet')
  const marcoRef = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)

  const px = ANCHOS.find((a) => a.id === ancho)!.px

  // El iframe se dibuja a su ancho real y se reduce con `transform` para que
  // quepa en la columna. `ResizeObserver` y no el evento `resize` de la
  // ventana: la columna puede cambiar de ancho sin que la ventana lo haga.
  useEffect(() => {
    const nodo = marcoRef.current
    if (!nodo) return

    const medir = () => setEscala(Math.min(1, nodo.clientWidth / px))
    medir()

    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [px])

  return (
    <div className="adm-preview">
      <div className="adm-preview__barra">
        <span className="adm-preview__titulo">
          <IconEye size={15} /> Vista previa
        </span>
        <div className="adm-preview__anchos">
          {ANCHOS.map((a) => (
            <button
              type="button"
              key={a.id}
              className={`adm-preview__ancho${ancho === a.id ? ' is-active' : ''}`}
              onClick={() => setAncho(a.id)}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-preview__marco" ref={marcoRef}>
        <div
          className="adm-preview__lienzo"
          style={{ transform: `scale(${escala})`, width: px }}
        >
          <MarcoAislado ancho={px}>
            {blocks.map((block, index) => (
              <div
                key={index}
                data-bloque={index}
                className={`adm-preview__bloque${activo === index ? ' is-active' : ''}`}
                onClick={() => onSelect(index)}
                role="presentation"
              >
                <BlockRenderer blocks={[block as unknown as Block]} />
                <span className="adm-preview__etiqueta">
                  {blockLabel(String(block.type))}
                </span>
              </div>
            ))}
            {blocks.length === 0 && (
              <p className="adm-preview__vacio">
                La página está vacía. Añade tu primer bloque desde la izquierda.
              </p>
            )}
          </MarcoAislado>
        </div>
      </div>
    </div>
  )
}

/* --- Lista de bloques ------------------------------------------------------- */

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: BlockValue[]
  onChange: (blocks: BlockValue[]) => void
}) {
  const [abierto, setAbierto] = useState<number | null>(blocks.length ? 0 : null)
  const [anadiendo, setAnadiendo] = useState(false)
  const [arrastrando, setArrastrando] = useState<number | null>(null)
  const [encima, setEncima] = useState<number | null>(null)

  const mover = (desde: number, hasta: number) => {
    if (desde === hasta || hasta < 0 || hasta >= blocks.length) return
    const siguiente = [...blocks]
    const [sacado] = siguiente.splice(desde, 1)
    siguiente.splice(hasta, 0, sacado)
    onChange(siguiente)
    setAbierto(hasta)
  }

  const insertar = (tipo: string) => {
    const defaults = BLOCK_SCHEMA[tipo]?.defaults ?? { type: tipo }
    onChange([...blocks, structuredClone(defaults) as BlockValue])
    setAbierto(blocks.length)
    setAnadiendo(false)
  }

  const duplicar = (index: number) => {
    const siguiente = [...blocks]
    siguiente.splice(index + 1, 0, structuredClone(blocks[index]))
    onChange(siguiente)
    setAbierto(index + 1)
  }

  return (
    <div className="adm-editor">
      <div className="adm-editor__columna">
        {blocks.map((block, index) => {
          const estaAbierto = abierto === index

          return (
            <div
              className={
                'adm-bloque' +
                (estaAbierto ? ' is-open' : '') +
                (arrastrando === index ? ' is-dragging' : '') +
                (encima === index && arrastrando !== index ? ' is-over' : '')
              }
              key={index}
              draggable
              onDragStart={(e) => {
                setArrastrando(index)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setEncima(index)
              }}
              onDragEnd={() => {
                setArrastrando(null)
                setEncima(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (arrastrando !== null) mover(arrastrando, index)
                setArrastrando(null)
                setEncima(null)
              }}
            >
              <div className="adm-bloque__barra">
                <span className="adm-bloque__asa" title="Arrastra para reordenar">
                  <IconDrag size={16} />
                </span>

                <button
                  type="button"
                  className="adm-bloque__resumen"
                  onClick={() => setAbierto(estaAbierto ? null : index)}
                  aria-expanded={estaAbierto}
                >
                  <span className="adm-bloque__tipo">{blockLabel(String(block.type))}</span>
                  <span className="adm-bloque__texto">{blockSummary(block)}</span>
                </button>

                <button
                  type="button"
                  className="adm-btn adm-btn--icon"
                  title="Duplicar bloque"
                  onClick={() => duplicar(index)}
                >
                  <IconCopy size={16} />
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--icon adm-btn--peligro"
                  title="Eliminar bloque"
                  onClick={() => {
                    if (!confirm('¿Eliminar este bloque? Podrás deshacerlo si no guardas.')) return
                    onChange(blocks.filter((_, i) => i !== index))
                    setAbierto(null)
                  }}
                >
                  <IconTrash size={16} />
                </button>
              </div>

              {estaAbierto && (
                <div className="adm-bloque__cuerpo">
                  <BlockForm
                    block={block}
                    onChange={(next) =>
                      onChange(blocks.map((b, i) => (i === index ? next : b)))
                    }
                  />
                </div>
              )}
            </div>
          )
        })}

        {anadiendo ? (
          <BlockCatalog onPick={insertar} onCancel={() => setAnadiendo(false)} />
        ) : (
          <button
            type="button"
            className="adm-anadir"
            onClick={() => setAnadiendo(true)}
          >
            <IconPlus size={18} />
            Añadir un bloque
          </button>
        )}
      </div>

      <Preview blocks={blocks} activo={abierto} onSelect={setAbierto} />
    </div>
  )
}
