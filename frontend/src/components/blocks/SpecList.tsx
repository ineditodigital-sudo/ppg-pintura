import type { SpecListBlock } from '@/types/content'
import { Container, Section, SectionHead } from '@/components/ui'
import { useRevealGroup } from '@/lib/useReveal'
import { Icon } from '@/lib/icons'
import './blocks.css'

/**
 * Ficha técnica.
 *
 * Sustituye a la rejilla de tarjetas allí donde cada elemento son dos palabras.
 * La unidad aquí es la fila: el término manda, la nota explica y el icono
 * distingue. Cabe el doble de información en menos alto y sin aire muerto.
 */
export function SpecList({ block }: { block: SpecListBlock }) {
  const ref = useRevealGroup<HTMLDListElement>(60)

  return (
    <Section theme={block.theme ?? 'transparent'}>
      <Container>
        <SectionHead
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
        />
        <dl
          ref={ref}
          className="spec-list"
          data-columns={block.columns ?? 2}
        >
          {block.items.map((item) => (
            <div className="spec-list__row reveal" key={item.term}>
              {item.icon && (
                <span className="spec-list__icon" aria-hidden="true">
                  <Icon name={item.icon} size={22} />
                </span>
              )}
              <div className="spec-list__body">
                <dt className="spec-list__term">{item.term}</dt>
                {item.note && <dd className="spec-list__note">{item.note}</dd>}
              </div>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}
