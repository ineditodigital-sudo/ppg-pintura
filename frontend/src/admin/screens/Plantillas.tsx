import type { FieldDef } from '../schema'
import type { Templates } from '@/types/content'
import * as api from '../api'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import { FieldRenderer } from '../components/Fields'
import { useEditable } from '../useEditable'

/**
 * Textos de las páginas que no son documentos.
 *
 * Nueve páginas del sitio —tres de producto y seis de sector— no existen como
 * archivo: las arma una plantilla con los datos de cada línea o sector. Todo
 * lo que las rodea vivía escrito en el código, así que se publicaba pero no se
 * podía tocar desde el panel. Esta pantalla es ese contenido.
 *
 * Se edita en dos bloques —productos y sectores— y cada cambio se aplica a la
 * vez a todas las páginas de ese bloque. Es a propósito: son la misma página
 * repetida con datos distintos, y editarlas una a una llevaría a que se
 * separaran sin querer.
 */

/** Sección con su propio título dentro de la pantalla. */
function Grupo({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota: string
  children: React.ReactNode
}) {
  return (
    <section className="adm-grupo">
      <h2 className="adm-grupo__titulo">{titulo}</h2>
      <p className="adm-grupo__nota">{nota}</p>
      <div className="admin-card">{children}</div>
    </section>
  )
}

/**
 * Lee y escribe una clave anidada sin que la pantalla tenga que repetir el
 * `{ ...valor, seccion: { ...valor.seccion, campo } }` en cada campo.
 *
 * No es un hook —no usa estado ni efectos—, sólo una fábrica de accesores.
 * Llamarlo `useRama` hacía que el linter lo tratara como tal y protestara por
 * invocarlo después de un `return` temprano.
 */
function accesor<T extends Record<string, unknown>>(
  valor: T,
  onChange: (v: T) => void,
) {
  return function rama<K extends keyof T>(clave: K) {
    const actual = (valor[clave] ?? {}) as Record<string, unknown>

    return {
      valor: actual,
      set: (campo: string, v: unknown) =>
        onChange({ ...valor, [clave]: { ...actual, [campo]: v } }),
    }
  }
}

type ServicioDeLinea = { title: string; description: string; href?: string }

/**
 * El antetítulo de una sección concreta.
 *
 * Se nombra por su sección a propósito: seis campos llamados «Antetítulo» en
 * la misma pantalla no dicen cuál es cuál, y la idea era justo lo contrario.
 */
const antetitulo = (seccion: string): FieldDef => ({
  key: 'eyebrow',
  label: `Antetítulo de «${seccion}»`,
  type: 'text',
  help: 'La línea pequeña que va encima del título.',
})

export function PlantillasScreen() {
  const s = useEditable<Templates>(api.getTemplates, api.saveTemplates)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  const doc = s.value
  const lineas = doc.lineas ?? {}
  const mercados = doc.mercados ?? {}

  const setLineas = (v: NonNullable<Templates['lineas']>) =>
    s.setValue({ ...doc, lineas: v })
  const setMercados = (v: NonNullable<Templates['mercados']>) =>
    s.setValue({ ...doc, mercados: v })

  const ramaL = accesor(lineas as Record<string, unknown>, (v) =>
    setLineas(v as NonNullable<Templates['lineas']>),
  )
  const ramaM = accesor(mercados as Record<string, unknown>, (v) =>
    setMercados(v as NonNullable<Templates['mercados']>),
  )

  const campo = (
    rama: ReturnType<typeof ramaL>,
    field: FieldDef,
  ) => (
    <FieldRenderer
      key={field.key}
      field={field}
      value={rama.valor[field.key]}
      onChange={(v) => rama.set(field.key, v)}
    />
  )

  return (
    <>
      <PageHead
        title="Textos de las páginas de producto y sector"
        ayuda={[
          'Estas nueve páginas —tres de producto y seis de sector— se arman solas con los datos de Líneas y de Mercados. Aquí se edita todo lo demás: antetítulos, títulos de sección, botones y el cierre.',
          'Lo que cambies aquí se aplica de golpe a todas las páginas de ese grupo, porque es la misma plantilla repetida.',
          'En «Qué exige este sector» hay dos marcadores: {sector} escribe el nombre del sector y {exigencias} enumera las suyas. Consérvalos o la frase quedará coja en las seis páginas.',
          'Un campo vacío no deja un hueco: la página vuelve al texto de fábrica.',
        ]}
        description="Nueve páginas del sitio se arman con una plantilla. Este es su texto, y el cambio se aplica a todas a la vez."
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <Grupo
        titulo="Páginas de producto"
        nota="Afecta a /productos/pintura-en-polvo, /productos/pintura-liquida y /productos/pretratamientos-metalicos."
      >
        <FieldRenderer
          field={{
            key: 'seoTitle',
            label: 'Título en Google',
            type: 'text',
            help: 'Escribe {nombre} donde vaya el nombre de la línea. Por ejemplo: {nombre} | PPG.',
          }}
          value={lineas.seoTitle ?? '{nombre} | PPG'}
          onChange={(v) => setLineas({ ...lineas, seoTitle: String(v ?? '') })}
        />
        {campo(ramaL('heroCta'), {
          key: 'heroCta',
          label: 'Botón de la portada',
          type: 'link',
          help: 'El botón principal de la cabecera. El de WhatsApp sale del número de Ajustes.',
        })}

        <FieldRenderer
          field={{
            key: 'comoTrabajamos',
            label: 'Sección «Cómo trabajamos»',
            type: 'list',
            itemLabelKey: 'title',
            help: 'Las tarjetas de servicio. Si la dejas vacía, la sección no se muestra.',
            itemFields: [
              { key: 'title', label: 'Título', type: 'text', required: true },
              { key: 'description', label: 'Texto', type: 'textarea', required: true },
              { key: 'href', label: 'Enlace (opcional)', type: 'text', help: 'Por ejemplo /colores. Déjalo vacío si la tarjeta no lleva a ningún sitio.' },
            ],
          }}
          value={lineas.comoTrabajamos?.items}
          onChange={(v) =>
            setLineas({
              ...lineas,
              comoTrabajamos: {
                ...lineas.comoTrabajamos,
                items: v as ServicioDeLinea[],
              },
            })
          }
        />
        {campo(ramaL('comoTrabajamos'), antetitulo('Cómo trabajamos'))}
        {campo(ramaL('comoTrabajamos'), { key: 'title', label: 'Título de la sección', type: 'text' })}

        {campo(ramaL('otras'), antetitulo('Otras líneas'))}
        {campo(ramaL('otras'), {
          key: 'title',
          label: 'Título de «Otras líneas»',
          type: 'text',
          help: 'La rejilla del final que lleva a las demás líneas.',
        })}

        {campo(ramaL('cierre'), { key: 'title', label: 'Título del cierre', type: 'text' })}
        {campo(ramaL('cierre'), { key: 'description', label: 'Texto del cierre', type: 'textarea' })}
        {campo(ramaL('cierre'), { key: 'cta', label: 'Botón del cierre', type: 'link' })}
      </Grupo>

      <Grupo
        titulo="Páginas de sector"
        nota="Afecta a las seis páginas de /mercados/…: arquitectura, automotriz, industria general, ACE, mueblero y metalmecánica."
      >
        <FieldRenderer
          field={{
            key: 'seoTitle',
            label: 'Título en Google',
            type: 'text',
            help: 'Escribe {nombre} donde vaya el nombre del sector.',
          }}
          value={mercados.seoTitle ?? '{nombre} | Recubrimientos PPG'}
          onChange={(v) => setMercados({ ...mercados, seoTitle: String(v ?? '') })}
        />
        {campo(ramaM('heroCta'), {
          key: 'heroCta',
          label: 'Botón de la portada',
          type: 'link',
        })}

        {campo(ramaM('exige'), antetitulo('Qué exige este sector'))}
        {campo(ramaM('exige'), {
          key: 'title',
          label: 'Título de «Qué exige este sector»',
          type: 'text',
          required: true,
          help: 'Escribe {sector} donde quieras que aparezca el nombre del sector.',
        })}
        {campo(ramaM('exige'), {
          key: 'body',
          label: 'Texto de «Qué exige este sector»',
          type: 'textarea',
          required: true,
          help: 'Escribe {exigencias} donde quieras que se enumeren las de cada sector.',
        })}
        {campo(ramaM('exige'), { key: 'image', label: 'Imagen de esa banda', type: 'image' })}

        {campo(ramaM('sustratos'), antetitulo('Sustratos'))}
        {campo(ramaM('sustratos'), { key: 'title', label: 'Título de «Sustratos»', type: 'text' })}
        {campo(ramaM('sustratos'), { key: 'description', label: 'Texto de «Sustratos»', type: 'textarea' })}

        {campo(ramaM('suministro'), antetitulo('Suministro'))}
        {campo(ramaM('suministro'), { key: 'title', label: 'Título de la banda de suministro', type: 'text' })}
        {campo(ramaM('suministro'), { key: 'body', label: 'Texto de la banda de suministro', type: 'textarea' })}
        {campo(ramaM('suministro'), { key: 'image', label: 'Imagen de la banda de suministro', type: 'image' })}
        {campo(ramaM('suministro'), { key: 'cta', label: 'Botón de la banda de suministro', type: 'link' })}

        {campo(ramaM('recomendado'), antetitulo('Sistema recomendado'))}
        {campo(ramaM('recomendado'), {
          key: 'cierre',
          label: 'Párrafo final del sistema recomendado',
          type: 'textarea',
          help: 'Va después del texto que cada sector trae en su propio campo «Sistema recomendado».',
        })}

        {campo(ramaM('otros'), antetitulo('Otros sectores'))}
        {campo(ramaM('otros'), { key: 'title', label: 'Título de «Otros sectores»', type: 'text' })}

        {campo(ramaM('cierre'), { key: 'title', label: 'Título del cierre', type: 'text' })}
        {campo(ramaM('cierre'), { key: 'description', label: 'Texto del cierre', type: 'textarea' })}
        {campo(ramaM('cierre'), { key: 'image', label: 'Imagen del cierre', type: 'image' })}
        {campo(ramaM('cierre'), { key: 'cta', label: 'Botón del cierre', type: 'link' })}
      </Grupo>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}
