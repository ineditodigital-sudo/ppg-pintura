import { memo, useCallback, useMemo, useState } from 'react'
import type { CatalogColor, ColorCatalog, FeaturedProduct, Market } from '@/types/content'
import { ICON_NAMES } from '@/lib/icons'
import { FICHA_POR_DEFECTO, PORTADA_POR_DEFECTO } from '@/lib/stock'
import * as api from '../api'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import { EditorDeFicha } from '../components/EditorDeFicha'
import { FieldRenderer, ListField } from '../components/Fields'
import { useEditable } from '../useEditable'
import {
  analizar,
  CAMPOS,
  TITULOS,
  descargar,
  filasATexto,
  filasDelCatalogo,
  generarPlantilla,
  type Analisis,
} from '../hojaColores'
import { descargarBlob, generarXlsx, leerXlsx } from '../hojaExcel'
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
    <section className="adm-hoja" id="carta-masiva">
      <div className="adm-hoja__cabecera">
        <div>
          <h2>Actualización masiva</h2>
          <p>
            Descarga la carta en Excel, edítala y vuelve a subir el mismo
            archivo. También se admite CSV. Nada se guarda hasta que revises el
            resumen de cambios y confirmes.
          </p>
        </div>
        <div className="adm-hoja__acciones">
          <button type="button" className="adm-btn" onClick={onExportar}>
            Descargar en Excel
          </button>
          <label className="adm-btn adm-btn--primary adm-hoja__subir">
            Subir archivo
            <input
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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
  onAbrirFicha,
}: {
  color: CatalogColor
  index: number
  familias: ColorCatalog['families']
  onCambiar: (index: number, cambios: Partial<CatalogColor>) => void
  onEliminar: (index: number) => void
  onAbrirFicha: (index: number) => void
}) {
  return (
    <tr>
      <td data-campo="Color">
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
      <td data-campo="Código">
        <input
          type="text"
          className="adm-input"
          value={color.code}
          onChange={(e) => onCambiar(index, { code: e.target.value })}
          aria-label="Código"
        />
      </td>
      <td data-campo="Nombre">
        <input
          type="text"
          className="adm-input"
          value={color.name}
          onChange={(e) => onCambiar(index, { name: e.target.value })}
          aria-label="Nombre"
        />
      </td>
      <td data-campo="RAL">
        <input
          type="text"
          className="adm-input adm-carta__corto"
          value={color.ral ?? ''}
          onChange={(e) => onCambiar(index, { ral: oNulo(e.target.value) })}
          aria-label="RAL"
        />
      </td>
      <td data-campo="Nombre PPG">
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
      <td data-campo="Acabado">
        <input
          type="text"
          className="adm-input adm-carta__corto"
          value={color.finish ?? ''}
          onChange={(e) => onCambiar(index, { finish: oNulo(e.target.value) })}
          aria-label="Acabado"
        />
      </td>
      <td data-campo="Brillo">
        <input
          type="text"
          className="adm-input adm-carta__corto"
          value={color.gloss ?? ''}
          onChange={(e) => onCambiar(index, { gloss: oNulo(e.target.value) })}
          aria-label="Brillo"
        />
      </td>
      <td data-campo="Familia">
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
      <td data-campo="Textura" className="adm-carta__centro">
        <input
          type="checkbox"
          checked={color.textured}
          onChange={(e) => onCambiar(index, { textured: e.target.checked })}
          aria-label="Texturizado"
        />
      </td>
      <td data-campo="Existencia" className="adm-carta__centro">
        <input
          type="checkbox"
          checked={color.stock}
          onChange={(e) => onCambiar(index, { stock: e.target.checked })}
          aria-label="En existencia"
        />
      </td>
      <td data-campo="Acciones" className="adm-carta__acciones">
        {/* La tabla sirve para repasar y para cambios en bloque; para tocar
            una referencia a fondo se abre su ficha, que tiene los nombres de
            campo escritos y la muestra en grande. */}
        <button
          type="button"
          className="adm-btn adm-btn--sm"
          onClick={() => onAbrirFicha(index)}
        >
          Ficha
        </button>
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
        description="Alimentan /mercados y cada página /mercados/…. El slug forma la URL: cambiarlo rompe los enlaces que ya circulan."
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <ListField
          label="Sectores"
          help="El orden es el que se ve en la página de mercados y en el mega-menú."
          itemLabelKey="name"
          itemSubtitleKey="headline"
          itemImageKey="image"
          itemIconKey="icon"
          variante="tarjetas"
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
          itemSubtitleKey="tagline"
          itemImageKey="image"
          variante="tarjetas"
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
  /** Índice, dentro del catálogo completo, de la ficha que se está editando. */
  const [ficha, setFicha] = useState<number | null>(null)

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

  /**
   * La ficha abierta, con su posición dentro de lo filtrado.
   *
   * Se comprueba que siga estando entre lo visible: si se cambia el filtro con
   * la ficha abierta, el índice guardado podría apuntar a una referencia que ya
   * no está en pantalla y «siguiente» saltaría a cualquier sitio.
   */
  const fichaVisible =
    ficha !== null && catalogo.colors[ficha]
      ? (() => {
          const posicion = visibles.findIndex((v) => v.index === ficha)
          return posicion === -1 ? null : { index: ficha, posicion }
        })()
      : null

  const anadir = () =>
    s.setValue({
      ...catalogo,
      colors: [
        colorVacio(familia !== 'todas' ? familia : (familias[0]?.id ?? '')),
        ...catalogo.colors,
      ],
    })

  // `.xlsx` de verdad: cabecera destacada, columnas con ancho, filtros y la
  // primera fila congelada. El CSV se abría como texto plano y editarlo era
  // incómodo justo en lo que esta pantalla existe para facilitar.
  const exportar = () =>
    descargarBlob(
      `carta-de-color-${new Date().toISOString().slice(0, 10)}.xlsx`,
      generarXlsx(
        CAMPOS.map((c) => ({ titulo: c.titulo, ancho: c.ancho })),
        filasDelCatalogo(catalogo),
      ),
    )

  const alSubir = async (archivo: File) => {
    setAnalisis(null)
    // Se acepta el mismo Excel que se descarga y también el CSV, que es lo que
    // sale si el usuario usa «Guardar como» o edita en Google Sheets.
    let texto: string
    try {
      texto = archivo.name.toLowerCase().endsWith('.xlsx')
        ? filasATexto(await leerXlsx(await archivo.arrayBuffer()))
        : await archivo.text()
    } catch (e) {
      setAnalisis({
        ok: false,
        errores: [e instanceof Error ? e.message : 'No se pudo leer el archivo.'],
        avisos: [],
        cambios: [],
        nuevas: [],
        ausentes: [],
        filasLeidas: 0,
      })
      return
    }

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

  /** Escribe una clave de la portada sin repetir el desparramado en cada campo. */
  const setPortada = (clave: string, valor: unknown) =>
    s.setValue({ ...catalogo, portada: { ...catalogo.portada, [clave]: valor } })

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

      {/* Índice de la pantalla. Es la más larga del panel —seis secciones y
          6.500 px— y la ficha técnica quedaba en el 1.463: estaba, pero no se
          encontraba, y el cliente acabó preguntando dónde se editaba. */}
      <nav className="adm-indice" aria-label="Secciones de esta pantalla">
        <span className="adm-indice__titulo">En esta pantalla</span>
        {[
          ['#carta-masiva', 'Actualización masiva'],
          ['#carta-portada', 'Portada de /colores'],
          ['#carta-seo', 'Buscadores'],
          ['#carta-ficha', 'Ficha técnica del color'],
          ['#carta-familias', 'Familias'],
          ['#carta-referencias', 'Las referencias'],
        ].map(([destino, texto]) => (
          <a className="adm-indice__enlace" href={destino} key={destino}>
            {texto}
          </a>
        ))}
      </nav>

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

      {/* La banda oscura que abre /colores. Estaba escrita dentro de la
          página: se publicaba y no había forma de tocarla. */}
      <div className="admin-card">
        <h2 className="adm-grupo__titulo" id="carta-portada">Portada de la página de colores</h2>
        <FieldRenderer
          field={{ key: 'eyebrow', label: 'Antetítulo', type: 'text' }}
          value={catalogo.portada?.eyebrow ?? PORTADA_POR_DEFECTO.eyebrow}
          onChange={(v) => setPortada('eyebrow', v as string)}
        />
        <FieldRenderer
          field={{ key: 'title', label: 'Título', type: 'text' }}
          value={catalogo.portada?.title ?? PORTADA_POR_DEFECTO.title}
          onChange={(v) => setPortada('title', v as string)}
        />
        <FieldRenderer
          field={{
            key: 'entradilla',
            label: 'Entradilla',
            type: 'textarea',
            help: 'Escribe {n} donde quieras que salga el número de referencias; se cuenta solo, así que no se queda desfasado.',
          }}
          value={catalogo.portada?.entradilla ?? PORTADA_POR_DEFECTO.entradilla}
          onChange={(v) => setPortada('entradilla', v as string)}
        />
        <FieldRenderer
          field={{ key: 'aviso', label: 'Aviso sobre el color de pantalla', type: 'textarea' }}
          value={catalogo.portada?.aviso ?? PORTADA_POR_DEFECTO.aviso}
          onChange={(v) => setPortada('aviso', v as string)}
        />
        <FieldRenderer
          field={{ key: 'cta', label: 'Botón de la portada', type: 'link' }}
          value={
            catalogo.portada?.cta ?? {
              label: PORTADA_POR_DEFECTO.ctaLabel,
              href: PORTADA_POR_DEFECTO.ctaHref,
            }
          }
          onChange={(v) => setPortada('cta', v)}
        />
      </div>

      <div className="admin-card">
        <h2 className="adm-grupo__titulo" id="carta-seo">La página de colores en los buscadores</h2>
        <FieldRenderer
          field={{
            key: 'title',
            label: 'Título en Google',
            type: 'text',
            help: 'Unos 60 caracteres. Es el enlace azul del resultado.',
          }}
          value={catalogo.seo?.title ?? PORTADA_POR_DEFECTO.seoTitle}
          onChange={(v) =>
            s.setValue({
              ...catalogo,
              seo: { ...catalogo.seo, title: String(v ?? ''), description: catalogo.seo?.description ?? PORTADA_POR_DEFECTO.seoDescription },
            })
          }
        />
        <FieldRenderer
          field={{
            key: 'description',
            label: 'Descripción en Google',
            type: 'textarea',
            help: 'Unos 155 caracteres. Es el párrafo gris de debajo.',
          }}
          value={catalogo.seo?.description ?? PORTADA_POR_DEFECTO.seoDescription}
          onChange={(v) =>
            s.setValue({
              ...catalogo,
              seo: { ...catalogo.seo, title: catalogo.seo?.title ?? PORTADA_POR_DEFECTO.seoTitle, description: String(v ?? '') },
            })
          }
        />
      </div>

      {/* Los textos del recuadro que se abre al pulsar un color. Viven con el
          catálogo porque la ficha sale igual desde /colores y desde la página
          de pintura en polvo: editarlos en dos sitios los separaría. */}
      <div className="admin-card">
        <h2 className="adm-grupo__titulo" id="carta-ficha">Ficha técnica del color</h2>
        <p className="adm-grupo__nota">
          El recuadro que se abre al pulsar un color en la web. Los datos
          técnicos de cada referencia —RAL, acabado, brillo, existencia— salen
          de <a href="#carta-referencias">la tabla de referencias</a>, más
          abajo. Aquí se editan los textos que son iguales para las 83.
        </p>
        {(
          [
            {
              key: 'aviso',
              label: 'Aviso al pie de la ficha',
              type: 'textarea',
              help: 'La advertencia sobre el color de pantalla y los datos técnicos.',
            },
            {
              key: 'ctaFicha',
              label: 'Texto del botón principal',
              type: 'text',
              help: 'Lleva al formulario de contacto con la referencia ya escrita.',
            },
            {
              key: 'ctaWhatsApp',
              label: 'Texto del botón de WhatsApp',
              type: 'text',
              help: 'El número sale de Ajustes del sitio.',
            },
          ] as const
        ).map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            // Si aún no se ha guardado nada, se enseña el texto que hoy se
            // publica: el campo vacío no decía qué se está cambiando.
            value={catalogo.ficha?.[field.key] ?? FICHA_POR_DEFECTO[field.key]}
            onChange={(v) =>
              s.setValue({
                ...catalogo,
                ficha: { ...catalogo.ficha, [field.key]: v as string },
              })
            }
          />
        ))}
      </div>

      <div className="admin-card" id="carta-familias">
        <ListField
          label="Familias"
          help="Son las pestañas de la carta. Borrar una familia deja huérfanas sus referencias y el guardado se rechaza."
          itemLabelKey="name"
          itemSubtitleKey="description"
          variante="tarjetas"
          // Cuatro muestras reales de la familia: se ve de qué va la pestaña
          // sin abrirla, que es justo lo que una inicial no dice.
          itemThumb={(item) => {
            const muestras = catalogo.colors
              .filter((c) => c.family === item.id)
              .slice(0, 4)

            if (muestras.length === 0) return null

            return (
              <span className="adm-mini-muestras" aria-hidden="true">
                {muestras.map((c) => (
                  <span key={c.code} style={{ background: c.hex }} />
                ))}
              </span>
            )
          }}
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

      <div className="admin-card" id="carta-referencias">
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
                    onAbrirFicha={setFicha}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* «Anterior» y «Siguiente» se mueven por lo que hay filtrado en
          pantalla, no por el catálogo entero: si has buscado «gris», pasar a
          la siguiente debe llevar al siguiente gris. */}
      {fichaVisible && (
        <EditorDeFicha
          color={catalogo.colors[fichaVisible.index]}
          indice={fichaVisible.posicion}
          total={visibles.length}
          familias={familias}
          onCambiar={(cambios) => actualizar(fichaVisible.index, cambios)}
          onIr={(delta) => {
            const siguiente = visibles[fichaVisible.posicion + delta]
            if (siguiente) setFicha(siguiente.index)
          }}
          onCerrar={() => setFicha(null)}
        />
      )}

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}
