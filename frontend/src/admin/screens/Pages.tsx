import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@/lib/icons'
import type { BusinessLine, Market, Page } from '@/types/content'
import * as api from '../api'
import { construirMapa, ETIQUETA_ORIGEN, type PaginaDelSitio } from '../mapaDelSitio'
import { BlockEditor } from '../components/BlockEditor'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import { FieldRenderer } from '../components/Fields'

/* --- Listado ---------------------------------------------------------------- */

/**
 * La imagen real de la página, o su icono sobre un fondo de marca.
 *
 * Una rejilla de tarjetas iguales no ayuda más que una lista: lo que hace
 * reconocible una página de un vistazo es verla, no leer su nombre.
 */
function Miniatura({ page }: { page: PaginaDelSitio }) {
  if (page.imagen) {
    return (
      <span className="adm-tarjeta__mini">
        <img src={page.imagen} alt="" loading="lazy" />
      </span>
    )
  }

  return (
    <span className="adm-tarjeta__mini adm-tarjeta__mini--icono">
      <Icon name={page.icono ?? 'capas'} size={26} />
    </span>
  )
}

export function PagesScreen() {
  const [mapa, setMapa] = useState<PaginaDelSitio[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Las tres fuentes en paralelo: las páginas propias y los dos catálogos que
  // alimentan las páginas de plantilla. En serie serían tres esperas.
  const load = useCallback(() => {
    Promise.all([api.listPages(), api.getBusinessLines(), api.getMarkets()])
      .then(([paginas, lineas, mercados]) =>
        setMapa(construirMapa(paginas, lineas as BusinessLine[], mercados as Market[])),
      )
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  async function remove(slug: string) {
    if (!confirm(`¿Eliminar la página «${slug}»? Se guardará una copia de seguridad.`)) return
    setError('')
    try {
      const result = await api.deletePage(slug)
      setNotice(result.message)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.')
    }
  }

  return (
    <>
      <PageHead
        title="Páginas"
        ayuda={[
          'Cada página del sitio es una lista de bloques ordenados: un hero, una rejilla de tarjetas, un banner…',
          'Pulsa una página para abrir su editor. Dentro puedes añadir bloques, moverlos con el asa de arrastre, duplicarlos o eliminarlos.',
          'El slug forma la URL. Cambiarlo rompe los enlaces que ya circulan y el posicionamiento de esa página.',
          'Nada se publica hasta que pulsas Guardar. Si un campo obligatorio falta, el guardado se rechaza y te dice cuál.',
        ]}
        description="Cada página es una lista de bloques. Ábrela para editar, reordenar o añadir contenido."
      />
      <Alert kind="error" message={error} />
      <Alert kind="ok" message={notice} />

      {mapa === null ? (
        <Loading />
      ) : (
        <>
          {(['documento', 'plantilla', 'catalogo'] as const).map((origen) => {
            const grupo = mapa.filter((p) => p.origen === origen)
            if (grupo.length === 0) return null

            return (
              <section className="adm-grupo" key={origen}>
                <h2 className="adm-grupo__titulo">
                  {ETIQUETA_ORIGEN[origen]}
                  <span>{grupo.length}</span>
                </h2>
                {origen === 'plantilla' && (
                  <p className="adm-grupo__nota">
                    Estas páginas existen en el sitio pero no son documentos
                    sueltos: una plantilla las construye con los datos de otra
                    pantalla. Se editan ahí, y el cambio se aplica a todas a la
                    vez.
                  </p>
                )}
                {origen === 'catalogo' && (
                  <p className="adm-grupo__nota">
                    Se dibuja sola con las referencias del catálogo.
                  </p>
                )}

                <div className="adm-tarjetas">
                  {grupo.map((page) => (
                    <article className="adm-tarjeta adm-tarjeta--pagina" key={page.ruta}>
                      <div className="adm-tarjeta__cabecera">
                        <Miniatura page={page} />
                        <div className="adm-tarjeta__texto">
                          <h3 className="adm-tarjeta__titulo">{page.titulo}</h3>
                          <code className="adm-tarjeta__ruta">{page.ruta}</code>
                        </div>
                      </div>
                      <p className="adm-tarjeta__sub">{page.nota}</p>
                      <div className="adm-tarjeta__pie">
                        <Link className="adm-btn adm-btn--primary adm-btn--sm" to={page.destino}>
                          Editar
                        </Link>
                        <a
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          href={page.ruta}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver
                        </a>
                        {page.origen === 'documento' && page.slug !== 'home' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn--danger adm-btn--sm adm-tarjeta__borrar"
                            onClick={() => void remove(page.slug as string)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}

    </>
  )
}

/* --- Editor ------------------------------------------------------------------ */

export function PageEditorScreen() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()

  const [page, setPage] = useState<Page | null>(null)
  const [original, setOriginal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setError('')
    api
      .getPage(slug)
      .then((data) => {
        setPage(data)
        setOriginal(JSON.stringify(data))
      })
      .catch((e) => setError(e.message))
  }, [slug])

  const dirty = page !== null && JSON.stringify(page) !== original

  // El editor va a dos columnas y necesita todo el ancho; el resto del panel
  // se lee mejor limitado a 1100px. La clase se pone y se quita al entrar y
  // salir de esta pantalla en vez de ensanchar el panel entero.
  useEffect(() => {
    document.body.classList.add('admin-ancho-completo')
    return () => document.body.classList.remove('admin-ancho-completo')
  }, [])

  // Aviso del navegador si se intenta salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  async function save() {
    if (!page) return
    setSaving(true)
    setError('')
    setErrors([])
    setNotice('')

    try {
      const result = await api.savePage(slug, page)
      setOriginal(JSON.stringify(page))
      setNotice(result.message)
    } catch (e) {
      if (e instanceof api.ApiError) {
        setError(e.message)
        setErrors(e.errors)
      } else {
        setError('No se pudo guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (error && !page) return <Alert kind="error" message={error} />
  if (!page) return <Loading />

  const blocks = (page.blocks ?? []) as unknown as Record<string, unknown>[]

  return (
    <>
      <PageHead
        title={page.seo?.title ?? slug}
        description={`Editando /${slug === 'home' ? '' : slug}`}
        actions={
          <>
            <button
              type="button"
              className="adm-btn adm-btn--ghost"
              onClick={() => {
                if (dirty && !confirm('Tienes cambios sin guardar. ¿Salir igualmente?')) return
                navigate('/admin/paginas')
              }}
            >
              ← Volver
            </button>
            <a
              className="adm-btn adm-btn--ghost"
              href={slug === 'home' ? '/' : `/${slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver la página
            </a>
          </>
        }
      />

      <Alert kind="error" message={error} errors={errors} />
      <Alert kind="ok" message={notice} />

      <div className="admin-card">
        <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-m)' }}>
          Buscadores y pestaña del navegador
        </h2>
        <FieldRenderer
          field={{ key: 'title', label: 'Título SEO', type: 'text', required: true }}
          value={page.seo?.title}
          onChange={(value) =>
            setPage({ ...page, seo: { ...page.seo, title: String(value ?? '') } })
          }
        />
        <FieldRenderer
          field={{
            key: 'description',
            label: 'Descripción SEO',
            type: 'textarea',
            required: true,
            help: 'Lo que se lee bajo el título en Google. Entre 120 y 160 caracteres funciona bien.',
          }}
          value={page.seo?.description}
          onChange={(value) =>
            setPage({ ...page, seo: { ...page.seo, description: String(value ?? '') } })
          }
        />
      </div>

      <BlockEditor
        blocks={blocks}
        onChange={(next) =>
          setPage({ ...page, blocks: next as unknown as Page['blocks'] })
        }
      />

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={() => void save()}
        onReset={() => setPage(JSON.parse(original) as Page)}
      />
    </>
  )
}
