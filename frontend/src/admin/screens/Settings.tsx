import type { BusinessLine, Navigation, Site } from '@/types/content'
import { DEFAULT_VIEWBOX, SOCIAL_OPTIONS, socialNetwork } from '@/lib/social'
import * as api from '../api'
import { Alert, Loading, PageHead, SaveBar } from '../components/Common'
import { FieldRenderer, ListField } from '../components/Fields'
import { useEditable } from '../useEditable'

/* --- Navegación -------------------------------------------------------------- */

export function NavigationScreen() {
  const s = useEditable<Navigation>(api.getNavigation, api.saveNavigation)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  const nav = s.value

  return (
    <>
      <PageHead
        title="Navegación"
        ayuda={[
          'Aquí se define el menú de arriba, las columnas del pie y la línea legal.',
          'Una entrada del menú con «hijos» se convierte en mega-menú; sin hijos, es un enlace directo y necesita su URL.',
          'El orden de la lista es el orden que se ve en pantalla: arrástralas para reordenar.',
          'Los enlaces internos empiezan por «/» —por ejemplo /colores—. Los externos, por «https://».',
        ]}
        description="Menú principal, columnas del pie de página y enlaces legales."
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <FieldRenderer
          field={{ key: 'locale', label: 'Idioma mostrado', type: 'text' }}
          value={nav.locale}
          onChange={(v) => s.setValue({ ...nav, locale: String(v ?? '') })}
        />
        <FieldRenderer
          field={{ key: 'cta', label: 'Botón del encabezado', type: 'link' }}
          value={nav.cta}
          onChange={(v) => s.setValue({ ...nav, cta: v as Navigation['cta'] })}
        />
      </div>

      <div className="admin-card">
        <ListField
          label="Menú principal"
          help="Una entrada sin subenlaces se muestra como enlace directo; con subenlaces abre el mega-menú."
          itemLabelKey="label"
          itemSubtitleKey="href"
          variante="tarjetas"
          itemFields={[
            { key: 'label', label: 'Etiqueta', type: 'text', required: true },
            { key: 'href', label: 'Destino', type: 'text', help: 'Déjalo vacío si sólo abre el mega-menú.' },
            { key: 'description', label: 'Descripción', type: 'textarea' },
            {
              key: 'children',
              label: 'Subenlaces',
              type: 'list',
              itemLabelKey: 'label',
              itemFields: [
                { key: 'label', label: 'Etiqueta', type: 'text', required: true },
                { key: 'href', label: 'Destino', type: 'text', required: true },
                { key: 'description', label: 'Descripción', type: 'textarea' },
              ],
            },
          ]}
          value={nav.main as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue({ ...nav, main: v as unknown as Navigation['main'] })}
        />
      </div>

      <div className="admin-card">
        <ListField
          label="Columnas del pie de página"
          itemLabelKey="title"
          variante="tarjetas"
          itemFields={[
            { key: 'title', label: 'Título de la columna', type: 'text', required: true },
            {
              key: 'links',
              label: 'Enlaces',
              type: 'list',
              itemLabelKey: 'label',
              itemFields: [
                { key: 'label', label: 'Texto', type: 'text', required: true },
                { key: 'href', label: 'Destino', type: 'text', required: true },
              ],
            },
          ]}
          value={nav.footer as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue({ ...nav, footer: v as unknown as Navigation['footer'] })}
        />
      </div>

      <div className="admin-card">
        <ListField
          label="Enlaces legales"
          itemLabelKey="label"
          itemSubtitleKey="href"
          variante="tarjetas"
          itemFields={[
            { key: 'label', label: 'Texto', type: 'text', required: true },
            { key: 'href', label: 'Destino', type: 'text', required: true },
          ]}
          value={nav.legal as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue({ ...nav, legal: v as unknown as Navigation['legal'] })}
        />
      </div>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}

/* --- Ajustes del sitio --------------------------------------------------------- */

export function SiteScreen() {
  const s = useEditable<Site>(api.getSite, api.saveSite)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  const site = s.value

  return (
    <>
      <PageHead title="Ajustes del sitio"
        ayuda={[
          'Marca, logotipos, redes sociales y aviso de copyright: lo que aparece en la cabecera y el pie de todas las páginas.',
          'El logotipo claro se usa sobre fondo oscuro —la portada— y el azul sobre fondo blanco.',
          'El número de WhatsApp sale de aquí: el botón flotante y todos los botones verdes del sitio lo toman de esta pantalla.',
        ]} description="Marca, logotipos, redes sociales y aviso de copyright." />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <FieldRenderer
          field={{ key: 'name', label: 'Nombre', type: 'text', required: true }}
          value={site.name}
          onChange={(v) => s.setValue({ ...site, name: String(v ?? '') })}
        />
        <FieldRenderer
          field={{ key: 'tagline', label: 'Lema', type: 'text', required: true }}
          value={site.tagline}
          onChange={(v) => s.setValue({ ...site, tagline: String(v ?? '') })}
        />
        <FieldRenderer
          field={{ key: 'copyright', label: 'Aviso de copyright', type: 'text', required: true }}
          value={site.copyright}
          onChange={(v) => s.setValue({ ...site, copyright: String(v ?? '') })}
        />
        <FieldRenderer
          field={{ key: 'logo', label: 'Logotipo del encabezado', type: 'image', required: true }}
          value={site.logo}
          onChange={(v) => s.setValue({ ...site, logo: v as Site['logo'] })}
        />
        <FieldRenderer
          field={{ key: 'footerLogo', label: 'Logotipo del pie', type: 'image', required: true }}
          value={site.footerLogo}
          onChange={(v) => s.setValue({ ...site, footerLogo: v as Site['footerLogo'] })}
        />
      </div>

      <div className="admin-card">
        <ListField
          label="Redes sociales"
          help="El orden de la lista es el orden en que aparecen en el pie de página."
          itemLabelKey="network"
          itemSubtitleKey="href"
          variante="tarjetas"
          // El mismo glifo que sale en el pie: se reconoce la red antes de
          // leer su nombre, que es de lo que se trata.
          itemThumb={(item) => {
            const red = socialNetwork(String(item.network ?? ''))
            return (
              <svg
                width="24"
                height="24"
                viewBox={red.viewBox ?? DEFAULT_VIEWBOX}
                fill="currentColor"
                aria-hidden="true"
                style={{ color: 'var(--fg-brand-secondary)' }}
              >
                <path d={red.path} />
              </svg>
            )
          }}
          itemFields={[
            {
              key: 'network',
              label: 'Red',
              type: 'select',
              required: true,
              options: SOCIAL_OPTIONS,
            },
            {
              key: 'href',
              label: 'URL del perfil',
              type: 'text',
              required: true,
              help: 'Dirección completa, empezando por https://',
            },
          ]}
          value={site.social as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue({ ...site, social: v as unknown as Site['social'] })}
        />
      </div>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}

/* --- Líneas de negocio ---------------------------------------------------------- */

export function BusinessLinesScreen() {
  const s = useEditable<BusinessLine[]>(api.getBusinessLines, api.saveBusinessLines)

  if (s.error && !s.value) return <Alert kind="error" message={s.error} />
  if (!s.value) return <Loading />

  return (
    <>
      <PageHead
        title="Líneas de negocio"
        ayuda={[
          'Las tres líneas que alimentan las páginas /productos/…',
          'El slug forma la URL; el titular y la descripción abren esa página.',
          'Las cifras son opcionales: la línea que no las tenga no muestra ese bloque, en vez de enseñar las de otra.',
          'La carta de color sólo se activa donde corresponde al catálogo, hoy en pintura en polvo.',
        ]}
        description="Alimentan las páginas /productos/… y el mega-menú. El slug forma la URL."
      />
      <Alert kind="error" message={s.error} errors={s.errors} />
      <Alert kind="ok" message={s.notice} />

      <div className="admin-card">
        <ListField
          label="Líneas"
          itemLabelKey="name"
          itemSubtitleKey="headline"
          itemImageKey="image"
          variante="tarjetas"
          itemFields={[
            { key: 'slug', label: 'Slug (URL)', type: 'text', required: true, help: 'Minúsculas y guiones. Cambiarlo rompe los enlaces existentes.' },
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'headline', label: 'Titular', type: 'text', required: true },
            { key: 'description', label: 'Descripción', type: 'textarea', required: true },
            { key: 'image', label: 'Imagen', type: 'image' },
            { key: 'href', label: 'Ruta', type: 'text', help: 'Normalmente /productos/<slug>.' },
            {
              key: 'stats',
              label: 'Cifras de la línea',
              type: 'list',
              itemLabelKey: 'value',
              help: 'La banda azul de números. Si la dejas vacía, esa línea no la muestra en vez de enseñar las de otra.',
              itemFields: [
                { key: 'value', label: 'Cifra', type: 'text', required: true, help: 'Por ejemplo 83, +25 años o 25 kg.' },
                { key: 'label', label: 'Qué es', type: 'text', required: true },
              ],
            },
            {
              key: 'showColors',
              label: 'Mostrar la carta de color en esta página',
              type: 'boolean',
              help: 'Actívalo sólo donde el catálogo corresponda: las 83 referencias son de pintura en polvo.',
            },
          ]}
          value={s.value as unknown as Record<string, unknown>[]}
          onChange={(v) => s.setValue(v as unknown as BusinessLine[])}
        />
      </div>

      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => void s.save()} onReset={s.reset} />
    </>
  )
}
