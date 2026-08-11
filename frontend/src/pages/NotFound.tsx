import { ButtonLink, Container, Section } from '@/components/ui'
import { useSeo } from '@/lib/useSeo'
import { NOT_FOUND_POR_DEFECTO as POR_DEFECTO } from '@/lib/textos'
import { useSitio } from '@/lib/useSitio'

/**
 * Página de error.
 *
 * Su texto sale de Ajustes como el del resto del sitio. Los valores de fábrica
 * se conservan aquí para que siga sirviendo aunque falte la configuración: es
 * justo la página que no puede fallar cuando algo ya ha fallado.
 */
export function NotFound() {
  const site = useSitio()
  const t = site?.notFound ?? {}

  useSeo({
    title: t.seoTitle ?? POR_DEFECTO.seoTitle,
    description: t.seoDescription ?? POR_DEFECTO.seoDescription,
    // El servidor devuelve 200 en cualquier ruta —hace falta para que el
    // enrutador del cliente funcione al recargar—, así que sin esto un
    // buscador indexaría la página de error como si fuera contenido real.
    noindex: true,
  })

  const principal = t.cta ?? POR_DEFECTO.cta
  const secundario = t.ctaSecundario ?? POR_DEFECTO.ctaSecundario

  return (
    <Section>
      <Container narrow>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-m)',
            alignItems: 'flex-start',
            paddingBlock: 'var(--space-4xl)',
          }}
        >
          <span className="eyebrow">{t.eyebrow ?? POR_DEFECTO.eyebrow}</span>
          <h1>{t.title ?? POR_DEFECTO.title}</h1>
          <p className="lead">{t.body ?? POR_DEFECTO.body}</p>
          <div style={{ display: 'flex', gap: 'var(--space-s)', flexWrap: 'wrap' }}>
            <ButtonLink href={principal.href}>{principal.label}</ButtonLink>
            <ButtonLink href={secundario.href} variant="secondary" withArrow={false}>
              {secundario.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  )
}
