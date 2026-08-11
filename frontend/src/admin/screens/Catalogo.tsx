import { memo, useCallback, useMemo, useState } from 'react'
import type { CatalogColor, ColorCatalog, FeaturedProduct, Market } from '@/types/content'
import { ICON_NAMES } from '@/lib/icons'
import * as api from '../api'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import { ListField } from '../components/Fields'
import { useEditable } from '../useEditable'
import {
  analizar,
  TITULOS,
  descargar,
  generarCsv,
  generarPlantilla,
  type Analisis,
} from '../hojaColores'
import '../editor.css'

const iconOptions = ICON_NAMES.map((name) => ({ value: name, label: name }))

/* --- Carta de color: hoja de cálculo ------------------------------------------- */

/**
 * Descarga y carga masiva de la carta.
 *
 * Nada se aplica al pulsar «subir»: primero se compara contra el catálogo
 * actual y se enseña qué cambiaría. Una actualización en bloque sobre 83
 * referencias no se revisa a ojo después, así que se revisa antes.
 */
function HojaDeCalculo({
  catalogo,
  analisis,
  aplicado,
  onExportar,
  onSubir,
  onAplicar,
  onDescartar,
  onCerrarAviso,
}: {
  catalogo: ColorCatalog
  analisis: Analisis | null
  aplicado: string
  onExportar: () => void
  onSubir: (archivo: File) => void
  onAplicar: () => void
  onDescartar: () => void
  onCerrarAviso: () => void
}) {
  const refs = useMemo(() => new Set(analisis?.cambios.map((c) => c.code)), [analisis])

  return (
    <section className="adm-hoja">
      <div className="adm-hoja__cabecera">
        <div>
          <h2>Actualización masiva</h2>
          <p>
            Descarga la carta, edítala en Excel y vuelve a subirla. Se abre en
            columnas sin asistente; al guardar, elige «CSV UTF-8».
          </p>
        </div>
        <div className="adm-hoja__acciones">
          <button type="button" className="adm-btn" onClick={onExportar}>
            Descargar la carta
          </button>
          <label className="adm-btn adm-btn--primary adm-hoja__subir">
            Subir archivo
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onSubir(f)
                // Se limpia para poder volver a subir el mismo archivo tras
                // corregirlo: sin esto el `change` no se dispararía otra vez.
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      {aplicado && (
        <div className="adm-hoja__ok">
          <p>{aplicado}</p>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onCerrarAviso}>
            Entendido
          </button>
        </div>
      )}

      {analisis && !analisis.ok && (
        <div className="adm-hoja__error">
          <h3>El archivo no tiene el formato correcto</h3>
          <ul>
            {analisis.errores.slice(0, 12).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          {analisis.errores.length > 12 && (
            <p>…y {analisis.errores.length - 12} problema(s) más.</p>
          )}
          <p className="adm-hoja__ayuda">
            Descarga el formato correcto, edítalo sin cambiar las columnas y
            vuelve a subirlo. Las columnas deben ser, en este orden:{' '}
            <code>{TITULOS.join(' · ')}</code>
          </p>
          <div className="adm-hoja__acciones">
            <button
              type="button"
              className="adm-btn adm-btn--primary"
              onClick={() => descargar('formato-carta-de-color.csv', generarPlantilla(catalogo))}
            >
              Descargar el formato correcto
            </button>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onDescartar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {analisis?.ok && (
        <div className="adm-hoja__diff">
          <h3>Esto es lo que cambiaría</h3>
          <p className="adm-hoja__resumen">
            {analisis.filasLeidas} fila(s) leídas · <strong>{refs.size}</strong> referencia(s)
            modificada(s) · <strong>{analisis.nuevas.length}</strong> nueva(s) ·{' '}
            <strong>{analisis.ausentes.length}</strong> sin tocar
          </p>

          {analisis.avisos.map((a, i) => (
            <p className="adm-hoja__aviso" key={i}>
              {a}
            </p>
          ))}

          {analisis.cambios.length === 0 && analisis.nuevas.length === 0 ? (
            <p className="adm-hoja__aviso">
              El archivo es idéntico al catálogo actual: no hay nada que aplicar.
            </p>
          ) : (
            <div className="adm-hoja__scroll">
              <table className="adm-hoja__tabla">
                <thead>
                  <tr>
                    <th scope="col">Referencia</th>
                    <th scope="col">Campo</th>
                    <th scope="col">Antes</th>
                    <th scope="col">Después</th>
                  </tr>
                </thead>
                <tbody>
                  {analisis.nuevas.map((code) => (
                    <tr key={`nueva-${code}`}>
                      <td>{code}</td>
                      <td colSpan={3}>
                        <span className="adm-hoja__nueva">Referencia nueva</span>
                      </td>
                    </tr>
                  ))}
                  {analisis.cambios.map((c, i) => (
                    <tr key={i}>
                      <td>{c.code}</td>
                      <td>{c.campo}</td>
                      <td className="adm-hoja__antes">{c.antes}</td>
                      <td className="adm-hoja__despues">{c.despues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="adm-hoja__acciones">
            <button
              type="button"
              className="adm-btn adm-btn--primary"
              onClick={onAplicar}
              disabled={analisis.cambios.length === 0 && analisis.nuevas.length === 0}
            >
              Aplicar los cambios
            </button>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onDescartar}>
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/* --- Carta de color: una fila ---------------------------------------------------- */

/**
 * Fila de la tabla de color, memoizada.
 *
 * Son 83 referencias por once controles: cerca de 900 inputs controlados. Sin
 * `memo`, escribir una letra en una celda repintaba la tabla entera y el
 * editor se sentía pegajoso. Para que esto sirva, `onCambiar` y `onEliminar`
 * tienen que ser estables —van con `useCallback` y actualización funcional en
 * la pantalla—; si cambiaran de identidad en cada render, `memo` compararía
 * props siempre distintas y no evitaría nada.
 */
const FilaColor = memo(function FilaColor({
  color,
  index,
  familias,
  onCambiar,
  onEliminar,
}: {
  color: CatalogColor
  index: number
  familias: ColorCatalog['families']
  onCambiar: (index: number, cambios: Partial<CatalogColor>) => void
  onEliminar: (index: number) => void
}) {
  return (
    <tr>
      <td>
        <div className="adm-carta__muestra">
          <input
            type="color"
            value={hexSeguro(color.hex)}
            onChange={(e) => onCambiar(index, { hex: e.target.value })}
            aria-label={`Color de ${color.code || 'la referencia'}`}
          />
          <input
            type="text"
            className="adm-input adm-carta__hex"
            value={color.hex}
            onChange={(e) => onCambiar(index, { hex: e.target.value })}
            aria-label={`Hexadecimal de ${color.code || 'la referencia'}`}
          />
        </div>
      </td>
      <td>
        <input
          type="text"
          className="adm-input"
          value={color.code}
          onChange={(e) => onCambiar(index, { code: e.target.value })}
          aria-label="Código"
        />
      </td>
      <td>
        <input
          type="text"
          className="adm-input"
          value={color.name}
          onChange={(e) => onCambiar(index, { name: e.target.value })}
          aria-label="Nombre"
        />
      </td>
      <td>
        <input
          type="text"
          className="adm-input adm-carta__corto"
          value={color.ral ?? ''}
          onChange={(e) => onCambiar(index, { ral: oNulo(e.target.value) })}
          aria-label="RAL"
        />
      </td>
      <td>
        {/* Nombre con el que PPG publica ese RAL en su catálogo (Traffic
            White, Jet Black…). Se deja vacío cuando PPG no lo nombra: en la
            carta simplemente no aparece. */}
        <input
          type="text"
          className="adm-input"
          value={color.ralName ?? ''}
          onChange={(e) => onCambiar(index, { ralName: oNulo(e.target.value) })}
          aria-label="Nombre PPG del RAL"
        />
      </td>
      <td>
        <input
          type="text"
          className="adm-input adm-carta__corto"
          value={color.finish ?? ''}
          onChange={(e) => onCambiar(index, { finish: oNulo(e.target.value) })}
          aria-label="Acabado"
        />
      </td>
      <td>
        <input
          type="text"
          className="adm-input adm-carta__corto"
          value={color.gloss ?? ''}
          onChange={(e) => onCambiar(index, { gloss: oNulo(e.target.value) })}
          aria-label="Brillo"
        />
      </td>
      <td>
        <select
          value={color.family}
          onChange={(e) => onCambiar(index, { family: e.target.value })}
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
          onChange={(e) => onCambiar(index, { textured: e.target.checked })}
          aria-label="Texturizado"
        />
      </td>
      <td className="adm-carta__centro">
        <input
          type="checkbox"
          checked={color.stock}
          onChange={(e) => onCambiar(index, { stock: e.target.checked })}
          aria-label="En existencia"
        />
      </td>
      <td>
        <button
          type="button"
          className="adm-btn adm-btn--icon"
          title="Eliminar referencia"
          onClick={() => onEliminar(index)}
        >
          ✕
        </button>
      </td>
    </tr>
  )
})

/* --- Mercados ------------------------------------------------------------------ */

export function MarketsScreen() {
  const s = useEditable<Market[]>(api.getMarkets, api.saveMarkets)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  return (
    <>
      <PageHead
        title="Mercados"
        ayuda={[
          'Los sectores que alimentan /mercados y cada página /mercados/…',
          'El slug forma la URL: cambiarlo rompe los enlaces que ya circulan.',
          'El orden de la lista es el que se ve en la portada y en el mega-menú.',
          'Cada sector necesita su imagen: es el fondo de su tarjeta.',
        ]}
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
        ayuda={[
          'Los productos que abren la portada, en el bloque «Lo que suministramos».',
          'El orden de la lista es el orden en que se muestran.',
          'Menos texto funciona mejor: la tarjeta enseña foto, nombre y una línea. Lo largo se lee en la página de producto.',
        ]}
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
  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [aplicado, setAplicado] = useState('')

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

  // `setValue` viene de `useState`, así que su identidad es estable. Se
  // desestructura para poder declararlo como dependencia: con `s.setValue` el
  // linter pedía `s` entero, que sí es un objeto nuevo en cada render.
  const { setValue } = s

  // Los hooks van ANTES de los `return` tempranos de abajo: llamarlos después
  // de un `return` condicional los ejecuta en distinto orden según el render y
  // React rompe. `useCallback` con actualización funcional, además, evita
  // depender de `catalogo`, así que su identidad no cambia entre renders y
  // `memo` puede hacer su trabajo en las 83 filas.
  const actualizar = useCallback(
    (index: number, cambios: Partial<CatalogColor>) =>
      setValue((prev) =>
        prev
          ? {
              ...prev,
              colors: prev.colors.map((c, i) => (i === index ? { ...c, ...cambios } : c)),
            }
          : prev,
      ),
    [setValue],
  )

  const eliminar = useCallback(
    (index: number) =>
      setValue((prev) => {
        if (!prev) return prev
        const color = prev.colors[index]
        if (!confirm(`¿Eliminar «${color.code || 'la referencia'}» de la carta?`)) return prev
        return { ...prev, colors: prev.colors.filter((_, i) => i !== index) }
      }),
    [setValue],
  )

  if (s.error && !catalogo) return <Alert kind="error" message={s.error} />
  if (!catalogo) return <Loading />

  const familias = catalogo.families
  const enExistencia = catalogo.colors.filter((c) => c.stock).length

  const anadir = () =>
    s.setValue({
      ...catalogo,
      colors: [
        colorVacio(familia !== 'todas' ? familia : (familias[0]?.id ?? '')),
        ...catalogo.colors,
      ],
    })

  const exportar = () =>
    descargar(`carta-de-color-${new Date().toISOString().slice(0, 10)}.csv`, generarCsv(catalogo))

  const alSubir = async (archivo: File) => {
    setAnalisis(null)
    const texto = await archivo.text()
    setAnalisis(analizar(texto, catalogo))
  }

  const aplicar = () => {
    if (!analisis?.resultado) return
    s.setValue(analisis.resultado)
    setAplicado(
      `Se aplicaron ${analisis.cambios.length} cambio(s) en ${
        new Set(analisis.cambios.map((c) => c.code)).size
      } referencia(s)` +
        (analisis.nuevas.length ? ` y se añadieron ${analisis.nuevas.length}` : '') +
        '. Revisa y pulsa Guardar para publicarlo.',
    )
    setAnalisis(null)
  }

  return (
    <>
      <PageHead
        title="Carta de color"
        ayuda={[
          'La tabla es el catálogo completo. Se edita celda a celda y el buscador de arriba lleva a una referencia concreta.',
          'Para cambios masivos usa la hoja de cálculo: descarga, edita en Excel, guarda como «CSV UTF-8» y vuelve a subirla.',
          'Al subir no se aplica nada de inmediato: primero verás qué cambiaría, campo por campo, y decides.',
          'La casilla «Existencia» es la que alimenta la pestaña «En stock (MTS)» de la carta pública y el carrusel de la portada.',
          'Cambiar el identificador de una familia sin reasignar sus referencias deja colores huérfanos, y el guardado se rechaza.',
        ]}
        description={`${catalogo.colors.length} referencias · ${enExistencia} marcadas con existencia. Alimentan la página /colores y el carrusel de la portada.`}
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={anadir}>
            Añadir referencia
          </button>
        }
      />

      <HojaDeCalculo
        catalogo={catalogo}
        analisis={analisis}
        aplicado={aplicado}
        onExportar={exportar}
        onSubir={alSubir}
        onAplicar={aplicar}
        onDescartar={() => setAnalisis(null)}
        onCerrarAviso={() => setAplicado('')}
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
                  <FilaColor
                    key={color.code || index}
                    color={color}
                    index={index}
                    familias={familias}
                    onCambiar={actualizar}
                    onEliminar={eliminar}
                  />
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
