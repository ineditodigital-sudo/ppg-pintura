import { useMemo, useState } from 'react'
import type { CatalogColor, ColorCatalog, FeaturedProduct, Market } from '@/types/content'
import { ICON_NAMES } from '@/lib/icons'
import * as api from '../api'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import { ListField } from '../components/Fields'
import { useEditable } from '../useEditable'
import '../editor.css'

const iconOptions = ICON_NAMES.map((name) => ({ value: name, label: name }))

/* --- Mercados ------------------------------------------------------------------ */

export function MarketsScreen() {
  const s = useEditable<Market[]>(api.getMarkets, api.saveMarkets)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  return (
    <>
      <PageHead
        title="Mercados"
        description="Alimentan /mercados y cada página /mercados/…. El slug forma la URL: cambiarlo rompe los enlaces que ya circulan."
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <ListField
          label="Sectores"
          help="El orden es el que se ve en la página de mercados y en el mega-menú."
          itemLabelKey="name"
          itemFields={[
            { key: 'slug', label: 'Slug (URL)', type: 'text', required: true, help: 'Minúsculas y guiones.' },
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'headline', label: 'Titular', type: 'text', required: true },
            { key: 'description', label: 'Descripción', type: 'textarea', required: true },
            { key: 'image', label: 'Imagen', type: 'image', required: true },
            {
              key: 'icon',
              label: 'Icono',
              type: 'select',
              options: iconOptions,
              help: 'Se dibuja junto al nombre del sector.',
            },
            {
              key: 'sustratos',
              label: 'Sustratos',
              type: 'stringList',
              help: 'Materiales que se recubren en este sector. Uno por entrada.',
            },
            {
              key: 'exigencias',
              label: 'Exigencias',
              type: 'list',
              itemLabelKey: 'title',
              itemFields: [
                { key: 'title', label: 'Título', type: 'text', required: true },
                { key: 'description', label: 'Descripción', type: 'textarea', required: true },
                { key: 'icon', label: 'Icono', type: 'select', options: iconOptions },
              ],
            },
            {
              key: 'recomendado',
              label: 'Sistema recomendado',
              type: 'textarea',
              required: true,
              help: 'El párrafo que cierra la página del sector.',
            },
          ]}
          value={s.value as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue(v as unknown as Market[])}
        />
      </div>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}

/* --- Productos destacados ------------------------------------------------------- */

export function FeaturedProductsScreen() {
  const s = useEditable<FeaturedProduct[]>(api.getFeaturedProducts, api.saveFeaturedProducts)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  return (
    <>
      <PageHead
        title="Productos destacados"
        description="Lo que muestra el bloque «Productos» de la portada. Se ven todos los de la lista, así que tres o cuatro es lo que cuadra en la composición."
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <ListField
          label="Productos"
          itemLabelKey="name"
          itemFields={[
            { key: 'slug', label: 'Slug', type: 'text', required: true, help: 'Identificador interno; no forma URL.' },
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'sku', label: 'Referencia', type: 'text', help: 'Código del producto, si lo tiene.' },
            { key: 'tagline', label: 'Antetítulo', type: 'text', required: true },
            { key: 'description', label: 'Descripción', type: 'textarea', required: true },
            { key: 'image', label: 'Imagen', type: 'image', required: true },
            {
              key: 'highlights',
              label: 'Puntos destacados',
              type: 'stringList',
              help: 'Tres entradas es lo que mejor equilibra las tarjetas.',
            },
            { key: 'cta', label: 'Botón', type: 'link' },
          ]}
          value={s.value as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue(v as unknown as FeaturedProduct[])}
        />
      </div>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}

/* --- Carta de color -------------------------------------------------------------
 *
 * Aquí no se usa `ListField`: con 83 referencias, un acordeón obliga a abrir y
 * cerrar fila por fila para algo que casi siempre es un vistazo —¿qué hay en
 * existencia?— o un ajuste de una celda. La tabla enseña todo el catálogo de
 * golpe y el buscador lleva a la referencia concreta.
 */

const colorVacio = (family: string): CatalogColor => ({
  code: '',
  name: '',
  ral: null,
  ralName: null,
  finish: null,
  gloss: null,
  hex: '#cccccc',
  family,
  textured: false,
  stock: false,
})

/** El `input[type=color]` exige un hexadecimal válido o pinta negro. */
const hexSeguro = (hex: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#cccccc')

/** Campo opcional: vacío se guarda como null, no como cadena vacía. */
const oNulo = (valor: string) => (valor.trim() === '' ? null : valor)

export function ColorsScreen() {
  const s = useEditable<ColorCatalog>(api.getColors, api.saveColors)
  const [busqueda, setBusqueda] = useState('')
  const [familia, setFamilia] = useState('todas')

  const catalogo = s.value

  const visibles = useMemo(() => {
    if (!catalogo) return []
    const q = busqueda.trim().toLowerCase()

    return catalogo.colors
      .map((color, index) => ({ color, index }))
      .filter(({ color }) => {
        if (familia !== 'todas' && color.family !== familia) return false
        if (!q) return true
        return [
          color.code,
          color.name,
          color.ral ?? '',
          color.ralName ?? '',
          color.finish ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [catalogo, busqueda, familia])

  if (s.error && !catalogo) return <Alert kind="error" message={s.error} />
  if (!catalogo) return <Loading />

  const familias = catalogo.families
  const enExistencia = catalogo.colors.filter((c) => c.stock).length

  const actualizar = (index: number, cambios: Partial<CatalogColor>) =>
    s.setValue({
      ...catalogo,
      colors: catalogo.colors.map((c, i) => (i === index ? { ...c, ...cambios } : c)),
    })

  const eliminar = (index: number) => {
    const color = catalogo.colors[index]
    if (!confirm(`¿Eliminar «${color.code || 'la referencia'}» de la carta?`)) return
    s.setValue({ ...catalogo, colors: catalogo.colors.filter((_, i) => i !== index) })
  }

  const anadir = () =>
    s.setValue({
      ...catalogo,
      colors: [
        colorVacio(familia !== 'todas' ? familia : (familias[0]?.id ?? '')),
        ...catalogo.colors,
      ],
    })

  return (
    <>
      <PageHead
        title="Carta de color"
        description={`${catalogo.colors.length} referencias · ${enExistencia} marcadas con existencia. Alimentan la página /colores y el carrusel de la portada.`}
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={anadir}>
            Añadir referencia
          </button>
        }
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <ListField
          label="Familias"
          help="Son las pestañas de la carta. Borrar una familia deja huérfanas sus referencias y el guardado se rechaza."
          itemLabelKey="name"
          itemFields={[
            { key: 'id', label: 'Identificador', type: 'text', required: true, help: 'Minúsculas y guiones. Es el que enlaza cada referencia con su familia.' },
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'description', label: 'Descripción', type: 'textarea' },
          ]}
          value={familias as unknown as Record<string, unknown>[]}
          onChange={(v) =>
            s.setValue({ ...catalogo, families: v as unknown as ColorCatalog['families'] })
          }
        />
      </div>

      <div className="admin-card">
        <div className="adm-carta__filtros">
          <input
            type="search"
            className="adm-input"
            value={busqueda}
            placeholder="Busca por código, nombre, RAL o acabado"
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar referencia"
          />
          <select value={familia} onChange={(e) => setFamilia(e.target.value)} aria-label="Filtrar por familia">
            <option value="todas">Todas las familias</option>
            {familias.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <span className="adm-carta__cuenta">
            {visibles.length} de {catalogo.colors.length}
          </span>
        </div>

        {visibles.length === 0 ? (
          <p className="adm-empty">Ninguna referencia coincide con el filtro.</p>
        ) : (
          <div className="adm-carta__scroll">
            <table className="adm-carta">
              <thead>
                <tr>
                  <th scope="col">Color</th>
                  <th scope="col">Código</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">RAL</th>
                  <th scope="col">Nombre PPG</th>
                  <th scope="col">Acabado</th>
                  <th scope="col">Brillo</th>
                  <th scope="col">Familia</th>
                  <th scope="col">Textura</th>
                  <th scope="col">Existencia</th>
                  <th scope="col">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(({ color, index }) => (
                  <tr key={index}>
                    <td>
                      <div className="adm-carta__muestra">
                        <input
                          type="color"
                          value={hexSeguro(color.hex)}
                          onChange={(e) => actualizar(index, { hex: e.target.value })}
                          aria-label={`Color de ${color.code || 'la referencia'}`}
                        />
                        <input
                          type="text"
                          className="adm-input adm-carta__hex"
                          value={color.hex}
                          onChange={(e) => actualizar(index, { hex: e.target.value })}
                          aria-label={`Hexadecimal de ${color.code || 'la referencia'}`}
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="adm-input"
                        value={color.code}
                        onChange={(e) => actualizar(index, { code: e.target.value })}
                        aria-label="Código"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="adm-input"
                        value={color.name}
                        onChange={(e) => actualizar(index, { name: e.target.value })}
                        aria-label="Nombre"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="adm-input adm-carta__corto"
                        value={color.ral ?? ''}
                        onChange={(e) => actualizar(index, { ral: oNulo(e.target.value) })}
                        aria-label="RAL"
                      />
                    </td>
                    <td>
                      {/* Nombre con el que PPG publica ese RAL en su catálogo
                          (Traffic White, Jet Black…). Se deja vacío cuando PPG
                          no lo nombra: en la carta simplemente no aparece. */}
                      <input
                        type="text"
                        className="adm-input"
                        value={color.ralName ?? ''}
                        onChange={(e) =>
                          actualizar(index, { ralName: oNulo(e.target.value) })
                        }
                        aria-label="Nombre PPG del RAL"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="adm-input adm-carta__corto"
                        value={color.finish ?? ''}
                        onChange={(e) => actualizar(index, { finish: oNulo(e.target.value) })}
                        aria-label="Acabado"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="adm-input adm-carta__corto"
                        value={color.gloss ?? ''}
                        onChange={(e) => actualizar(index, { gloss: oNulo(e.target.value) })}
                        aria-label="Brillo"
                      />
                    </td>
                    <td>
                      <select
                        value={color.family}
                        onChange={(e) => actualizar(index, { family: e.target.value })}
                        aria-label="Familia"
                      >
                        {familias.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="adm-carta__centro">
                      <input
                        type="checkbox"
                        checked={color.textured}
                        onChange={(e) => actualizar(index, { textured: e.target.checked })}
                        aria-label="Texturizado"
                      />
                    </td>
                    <td className="adm-carta__centro">
                      <input
                        type="checkbox"
                        checked={color.stock}
                        onChange={(e) => actualizar(index, { stock: e.target.checked })}
                        aria-label="En existencia"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="adm-btn adm-btn--icon"
                        title="Eliminar referencia"
                        onClick={() => eliminar(index)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}
