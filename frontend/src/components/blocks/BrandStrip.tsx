import type { BrandStripBlock } from '@/types/content'
import { ArrowUpRight, Container, Section, SectionHead } from '@/components/ui'
import { useRevealGroup } from '@/lib/useReveal'
import './blocks.css'

/**
 * Tira de marcas representadas.
 *
 * El cliente es distribuidor autorizado de PPG, y pidió que eso se
 * note al entrar. Los logotipos van sobre placas blancas para que convivan
 * pese a venir con fondos y proporciones distintas.
 */
export function BrandStrip({ block }: { block: BrandStripBlock }) {
  const ref = useRevealGroup<HTMLDivElement>(80)

  return (
    <Section theme={block.theme ?? 'light'} tight>
      <Container>
        <SectionHead
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
        />
        <div ref={ref} className="brand-strip">
          {block.brands.map((brand) => {
            const inner = (
              <>
                <span className="brand-strip__plate">
                  <img
                    src={brand.logo.src}
                    alt={brand.logo.alt || brand.name}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="brand-strip__body">
                  <span className="brand-strip__name">{brand.name}</span>
                  {brand.description && (
                    <span className="brand-strip__desc">{brand.description}</span>
                  )}
                  {brand.href && (
                    <span className="brand-strip__more">
                      Ver el sitio de la marca
                      <ArrowUpRight size={15} />
                    </span>
                  )}
                </span>
              </>
            )

            if (!brand.href) {
              return (
                <div className="brand-strip__item reveal" key={brand.name}>
                  {inner}
                </div>
              )
            }

            return (
              <a
                className="brand-strip__item reveal"
                key={brand.name}
                href={brand.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {inner}
              </a>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
