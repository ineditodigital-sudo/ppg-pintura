import { Container, Section } from '@/components/ui'

/** Placeholder mientras se resuelve el contenido de la página. */
export function PageSkeleton() {
  return (
    <Section>
      <Container>
        <div
          style={{ display: 'grid', gap: 'var(--space-l)', maxWidth: '46rem' }}
          aria-hidden="true"
        >
          <div
            className="skeleton"
            style={{ height: 20, width: '30%', borderRadius: 'var(--radius-xs)' }}
          />
          <div
            className="skeleton"
            style={{ height: 52, width: '80%', borderRadius: 'var(--radius-s)' }}
          />
          <div
            className="skeleton"
            style={{ height: 16, width: '95%', borderRadius: 'var(--radius-xs)' }}
          />
          <div
            className="skeleton"
            style={{ height: 16, width: '88%', borderRadius: 'var(--radius-xs)' }}
          />
          <div
            className="skeleton"
            style={{ height: 280, width: '100%', borderRadius: 'var(--radius-l)' }}
          />
        </div>
        <span className="visually-hidden" role="status">
          Cargando contenido…
        </span>
      </Container>
    </Section>
  )
}
