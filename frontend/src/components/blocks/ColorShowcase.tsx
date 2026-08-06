import type { CSSProperties } from 'react'
import type { ColorShowcaseBlock } from '@/types/content'
import { ButtonLink, Container, Section, SectionHead } from '@/components/ui'
import { useRevealGroup } from '@/lib/useReveal'
import './blocks.css'

/**
 * Muestrario de color y acabados.
 *
 * Es el bloque que le faltaba al sitio: una empresa que vende color y acabado
 * no enseñaba ninguno. Las referencias de color usan códigos RAL, que son un
 * estándar público del recubrimiento en polvo; la carta real del fabricante se
 * pide por el botón del final.
 */

export function ColorShowcase({ block }: { block: ColorShowcaseBlock }) {
  const swatchRef = useRevealGroup<HTMLDivElement>(35)
  const finishRef = useRevealGroup<HTMLDivElement>(70)

  return (
    <Section theme={block.theme ?? 'transparent'} id="color">
      <Container>
        <SectionHead
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
        />

        <div ref={swatchRef} className="swatches">
          {block.swatches.map((s) => (
            <div
              className="swatch reveal"
              key={`${s.hex}-${s.code ?? s.name ?? ''}`}
              style={{ '--muestra': s.hex } as CSSProperties}
            >
              {/* La placa va en una capa aparte y no en el propio recuadro:
                  el barrido de brillo del hover ya ocupa su `::after`. */}
              <span className="swatch__placa placa" aria-hidden="true" />
              {s.code && <span className="swatch__code">{s.code}</span>}
              {s.name && <span className="swatch__name">{s.name}</span>}
            </div>
          ))}
        </div>

        {block.finishes && block.finishes.length > 0 && (
          <div ref={finishRef} className="finishes">
            {block.finishes.map((f) => (
              <div className="finish reveal" key={f.name}>
                <span className={`finish__chip finish__chip--${slugFinish(f.name)}`} />
                <span className="finish__name">{f.name}</span>
                {f.description && (
                  <span className="finish__desc">{f.description}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {(block.note || block.cta) && (
          <div className="showcase-foot">
            {block.note && <p className="showcase-foot__note">{block.note}</p>}
            {block.cta && (
              <ButtonLink href={block.cta.href} external={block.cta.external}>
                {block.cta.label}
              </ButtonLink>
            )}
          </div>
        )}
      </Container>
    </Section>
  )
}

/** Traduce el nombre del acabado a la clase que le da su textura. */
function slugFinish(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('metál') || n.includes('metal')) return 'metalico'
  if (n.includes('martill')) return 'martillado'
  if (n.includes('mate')) return 'mate'
  return 'brillante'
}
