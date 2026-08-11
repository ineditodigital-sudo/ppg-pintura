import { useEffect, useRef, type CSSProperties } from 'react'
import type { CatalogColor, ColorCatalog } from '@/types/content'

/**
 * Editor de la ficha de una referencia.
 *
 * Los datos de cada color se editaban sólo en la tabla: 83 filas por once
 * columnas, con los nombres de campo puestos como `aria-label` y por tanto
 * invisibles. Eso es una hoja de cálculo —buena para repasar y para cambios
 * en bloque— pero no es «la ficha de este color», que es lo que el cliente
 * buscaba y no encontraba.
 *
 * Este editor tiene la misma forma que la ficha que ve el visitante: la
 * muestra grande a un lado y los campos al otro, con su nombre escrito. La
 * muestra se actualiza mientras se escribe el hexadecimal, así que se ve el
 * color antes de guardar.
 *
 * No guarda nada por su cuenta: escribe en el catálogo en memoria y la barra
 * de guardado de la pantalla es la que publica, como en el resto del panel.
 */

const hexValido = (v: string) => /^#[0-9a-f]{6}$/i.test(v.trim())

export function EditorDeFicha({
  color,
  indice,
  total,
  familias,
  onCambiar,
  onIr,
  onCerrar,
}: {
  color: CatalogColor
  /** Posición dentro de las referencias visibles, para «anterior/siguiente». */
  indice: number
  total: number
  familias: ColorCatalog['families']
  onCambiar: (cambios: Partial<CatalogColor>) => void
  onIr: (delta: number) => void
  onCerrar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  // Un hexadecimal a medio escribir —«#A1»— no es un color: la muestra se
  // queda con el último válido en vez de ponerse negra a cada tecla.
  const muestra = hexValido(color.hex) ? color.hex : '#d5dee8'

  /** Vacío se guarda como ausente, no como cadena vacía. */
  const oNulo = (v: string) => (v.trim() === '' ? null : v)

  return (
    <dialog
      className="adm-ficha"
      ref={ref}
      onClose={onCerrar}
      aria-labelledby="adm-ficha-titulo"
    >
      <div
        className="adm-ficha__muestra"
        style={{ '--muestra': muestra } as CSSProperties}
      >
        <button
          type="button"
          className="adm-ficha__cerrar"
          onClick={onCerrar}
          aria-label="Cerrar el editor"
        >
          ✕
        </button>

        {/* Lo mismo que el visitante ve encima del color, para que se edite
            sabiendo cómo va a quedar. */}
        <span className="adm-ficha__placa">{color.code || 'Sin código'}</span>
        {color.stock && (
          <span className="adm-ficha__placa adm-ficha__placa--stock">En existencia</span>
        )}
        <span className="adm-ficha__placa adm-ficha__placa--hex">
          {hexValido(color.hex) ? color.hex.toUpperCase() : 'Hexadecimal incompleto'}
        </span>
      </div>

      <div className="adm-ficha__cuerpo">
        <div className="adm-ficha__scroll">
          <p className="adm-ficha__contador">
            Ficha {indice + 1} de {total}
          </p>
          <h2 id="adm-ficha-titulo">{color.name || 'Referencia sin nombre'}</h2>
          <p className="adm-ficha__nota">
            Así se llenan los datos del recuadro que se abre al pulsar este
            color en la web. Un campo vacío no sale en la ficha.
          </p>

          <div className="adm-ficha__rejilla">
            <label className="adm-ficha__campo">
              <span>Color</span>
              <span className="adm-ficha__hexfila">
                <input
                  type="color"
                  value={hexValido(color.hex) ? color.hex : '#d5dee8'}
                  onChange={(e) => onCambiar({ hex: e.target.value })}
                  aria-label="Elegir el color"
                />
                <input
                  type="text"
                  className="adm-input"
                  value={color.hex}
                  spellCheck={false}
                  onChange={(e) => onCambiar({ hex: e.target.value })}
                  aria-label="Hexadecimal"
                />
              </span>
              {!hexValido(color.hex) && (
                <em className="adm-ficha__aviso">
                  Seis dígitos empezando por almohadilla, como #A12222.
                </em>
              )}
            </label>

            <label className="adm-ficha__campo">
              <span>Código PPG</span>
              <input
                type="text"
                className="adm-input"
                value={color.code}
                spellCheck={false}
                onChange={(e) => onCambiar({ code: e.target.value })}
              />
            </label>

            <label className="adm-ficha__campo">
              <span>Nombre</span>
              <input
                type="text"
                className="adm-input"
                value={color.name}
                onChange={(e) => onCambiar({ name: e.target.value })}
              />
            </label>

            <label className="adm-ficha__campo">
              <span>Equivalencia RAL</span>
              <input
                type="text"
                className="adm-input"
                value={color.ral ?? ''}
                spellCheck={false}
                onChange={(e) => onCambiar({ ral: oNulo(e.target.value) })}
              />
            </label>

            <label className="adm-ficha__campo">
              <span>Nombre del RAL</span>
              <input
                type="text"
                className="adm-input"
                value={color.ralName ?? ''}
                onChange={(e) => onCambiar({ ralName: oNulo(e.target.value) })}
              />
              <em className="adm-ficha__pista">
                Como lo publica PPG: Traffic White, Jet Black…
              </em>
            </label>

            <label className="adm-ficha__campo">
              <span>Acabado</span>
              <input
                type="text"
                className="adm-input"
                value={color.finish ?? ''}
                onChange={(e) => onCambiar({ finish: oNulo(e.target.value) })}
              />
            </label>

            <label className="adm-ficha__campo">
              <span>Brillo (60°)</span>
              <input
                type="text"
                className="adm-input"
                value={color.gloss ?? ''}
                onChange={(e) => onCambiar({ gloss: oNulo(e.target.value) })}
              />
            </label>

            <label className="adm-ficha__campo">
              <span>Familia</span>
              <select
                value={color.family}
                onChange={(e) => onCambiar({ family: e.target.value })}
              >
                {familias.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <em className="adm-ficha__pista">
                Decide en qué pestaña de la carta aparece.
              </em>
            </label>
          </div>

          <div className="adm-ficha__interruptores">
            <label>
              <input
                type="checkbox"
                checked={color.textured}
                onChange={(e) => onCambiar({ textured: e.target.checked })}
              />
              Texturizado
            </label>
            <label>
              <input
                type="checkbox"
                checked={color.stock}
                onChange={(e) => onCambiar({ stock: e.target.checked })}
              />
              En existencia (MTS)
              <em className="adm-ficha__pista">
                Lo pone en la primera pestaña de la carta y le añade el sello.
              </em>
            </label>
          </div>
        </div>

        {/* Ir de una a otra sin cerrar: con 83 referencias, repasarlas de una
            en una era abrir y cerrar 83 veces. */}
        <div className="adm-ficha__pie">
          <div className="adm-ficha__pasar">
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={indice === 0}
              onClick={() => onIr(-1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={indice >= total - 1}
              onClick={() => onIr(1)}
            >
              Siguiente →
            </button>
          </div>
          <button
            type="button"
            className="adm-btn adm-btn--primary adm-btn--sm"
            onClick={onCerrar}
          >
            Hecho
          </button>
        </div>
      </div>
    </dialog>
  )
}
