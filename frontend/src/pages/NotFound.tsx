import { ButtonLink, Container, Section } from '@/components/ui'
import { useSeo } from '@/lib/useSeo'

export function NotFound() {
  useSeo({
    title: 'Página no encontrada | PPG',
    description: 'La página que buscas no existe o fue movida.',
    // El servidor devuelve 200 en cualquier ruta —hace falta para que el
    // enrutador del cliente funcione al recargar—, así que sin esto un
    // buscador indexaría la página de error como si fuera contenido real.
    noindex: true,
  })

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
          <span className="eyebrow">Error 404</span>
          <h1>No encontramos esta página</h1>
          <p className="lead">
            Puede que el enlace haya cambiado o que la página ya no exista.
            Desde el inicio puedes llegar a todo nuestro catálogo.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-s)', flexWrap: 'wrap' }}>
            <ButtonLink href="/">Volver al inicio</ButtonLink>
            <ButtonLink href="/contacto" variant="secondary" withArrow={false}>
              Contáctanos
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  )
}
