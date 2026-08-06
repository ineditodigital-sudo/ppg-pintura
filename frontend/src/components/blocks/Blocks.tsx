import { Link } from 'react-router-dom'
import type {
  CardGridBlock,
  CardItem,
  ContentBannerBlock,
  CtaBannerBlock,
  HeroBlock,
  LinkListBlock,
  MediaGridBlock,
  QuoteBlock,
  RichTextBlock,
  StatGridBlock,
  TimelineBlock,
} from '@/types/content'
import {
  ArrowLink,
  ArrowUpRight,
  Badge,
  ButtonLink,
  Container,
  Section,
  SectionHead,
  SmartImage,
} from '@/components/ui'
import { useReveal, useRevealGroup } from '@/lib/useReveal'
import { slugify } from '@/lib/slugify'
import { Icon } from '@/lib/icons'
import './blocks.css'

/* --- Hero ----------------------------------------------------------------- */

export function Hero({ block }: { block: HeroBlock }) {
  const variant = block.variant ?? 'compact'
  const onDark = variant === 'full'

  const text = (
    <div className="hero__text">
      {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
      <h1>{block.title}</h1>
      {block.subtitle && <p className="hero__subtitle">{block.subtitle}</p>}
      {(block.cta || block.secondaryCta) && (
        <div className="hero__actions">
          {block.cta && (
            <ButtonLink href={block.cta.href} external={block.cta.external}>
              {block.cta.label}
            </ButtonLink>
          )}
          {block.secondaryCta && (
            <ButtonLink
              href={block.secondaryCta.href}
              external={block.secondaryCta.external}
              variant={onDark ? 'onDark' : 'secondary'}
              withArrow={false}
            >
              {block.secondaryCta.label}
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'full') {
    return (
      <div className="hero hero--full">
        <Container>
          <div className="hero__panel">
            {block.image && (
              <div className="hero__bg">
                <img
                  src={block.image.src}
                  alt=""
                  width={block.image.width}
                  height={block.image.height}
                  fetchPriority="high"
                />
              </div>
            )}
            <div className="hero__inner">{text}</div>
          </div>
        </Container>
      </div>
    )
  }

  if (variant === 'feature') {
    return (
      <div className="hero hero--feature">
        <Container>
          <div className="hero__panel">
            {block.image && (
              /* La foto ocupa el fondo entero, sin copia pequeña encima.
                 Las de sector son de 266×154, así que aquí se amplían mucho;
                 el desenfoque suave y el velo azul son lo que sostiene el
                 resultado. Se asume a sabiendas: pesa más que el banner se
                 lea como imagen que la nitidez del detalle. */
              <div className="hero__wash" aria-hidden="true">
                <img src={block.image.src} alt="" fetchPriority="high" />
              </div>
            )}
            <div className="hero__inner">
              {block.icon && (
                <span className="hero__icon" aria-hidden="true">
                  <Icon name={block.icon} size={30} />
                </span>
              )}
              {text}
            </div>
          </div>
        </Container>
      </div>
    )
  }

  if (variant === 'split') {
    return (
      <div className="hero hero--split">
        <Container>
          <div className="hero__inner">
            {text}
            {block.image && (
              <div className="hero__media">
                <SmartImage media={block.image} eager />
              </div>
            )}
          </div>
        </Container>
      </div>
    )
  }

  /* `compact` aceptaba `image` en el tipo y en el CMS pero nunca la pintaba:
     Mercados, Contacto y Quienes Somos abrian en plano por mucho que se les
     pasara una foto. Reutiliza el fondo de `feature` -a sangre, sin copia
     pequena encima- y solo cambia de clase cuando hay imagen, para no tocar
     los heroes que se quieren lisos. */
  return (
    <div className={`hero hero--compact${block.image ? ' hero--compact-img' : ''}`}>
      <Container>
        <div className="hero__panel">
          {block.image && (
            <div className="hero__wash" aria-hidden="true">
              <img src={block.image.src} alt="" fetchPriority="high" />
            </div>
          )}
          <div className="hero__inner">{text}</div>
        </div>
      </Container>
    </div>
  )
}

/* --- Rich text ------------------------------------------------------------ */

export function RichText({ block }: { block: RichTextBlock }) {
  const ref = useReveal<HTMLDivElement>()
  const center = block.align === 'center'

  return (
    <Section tight>
      <Container>
        <div
          ref={ref}
          className={`rich-text reveal ${center ? 'rich-text--center' : ''}`.trim()}
        >
          {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
          {block.title && <h2>{block.title}</h2>}
          {block.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* --- Card ----------------------------------------------------------------- */

const MEDIA_VARIANTS = ['image', 'overlay', 'thumb']

function Card({ item, variant }: { item: CardItem; variant: string }) {
  const isExternal = item.external ?? /^https?:\/\//.test(item.href ?? '')
  const showMedia = MEDIA_VARIANTS.includes(variant) && item.image

  const inner = (
    <>
      {showMedia && item.image && (
        <div className="card__media">
          <SmartImage media={item.image} />
        </div>
      )}
      <div className="card__body">
        {item.icon && (
          <span className="card__icon">
            <Icon name={item.icon} size={24} />
          </span>
        )}
        {item.label && (
          <span className="card__label">
            <Badge>{item.label}</Badge>
          </span>
        )}
        <h3 className="card__title">
          {item.title}
          {item.href && (isExternal ? <ArrowUpRight /> : null)}
        </h3>
        {item.description && (
          <p className="card__description">{item.description}</p>
        )}
        {item.href && !isExternal && (
          <span className="card__foot">
            <span className="arrow-link">
              Más información
              <ArrowUpRight />
            </span>
          </span>
        )}
      </div>
    </>
  )

  const className = [
    'card',
    'reveal',
    // Sólo las variantes sin foto llevan el relleno de tarjeta de texto.
    MEDIA_VARIANTS.includes(variant) ? '' : 'card--text',
    // `overlay` apoya el texto sobre la foto; `thumb` la pone al lado.
    variant === 'overlay' ? 'card--overlay' : '',
    variant === 'thumb' ? 'card--thumb' : '',
    item.highlight ? 'card--highlight' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!item.href) {
    return <article className={className}>{inner}</article>
  }

  if (isExternal) {
    return (
      <a
        className={className}
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
      >
        {inner}
      </a>
    )
  }

  return (
    <Link className={className} to={item.href}>
      {inner}
    </Link>
  )
}

export function CardGrid({ block }: { block: CardGridBlock }) {
  const ref = useRevealGroup<HTMLDivElement>()
  const variant = block.variant ?? 'image'

  return (
    <Section theme={block.theme ?? 'transparent'}>
      <Container>
        <SectionHead
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
        />
        <div
          ref={ref}
          className="card-grid"
          data-columns={String(block.columns ?? 3)}
          data-variant={variant}
          /* El mosaico reparte los anchos según cuántas piezas haya: sin este
             dato el patrón está fijado a seis y cualquier otra cantidad deja
             la última fila coja. */
          data-count={String(block.items.length)}
        >
          {block.items.map((item) => (
            <Card key={item.title} item={item} variant={variant} />
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* --- Media grid (videos) -------------------------------------------------- */

export function MediaGrid({ block }: { block: MediaGridBlock }) {
  const ref = useRevealGroup<HTMLDivElement>()

  return (
    <Section theme="light">
      <Container>
        <SectionHead title={block.title} />
        <div ref={ref} className="media-grid">
          {block.items.map((item) => (
            <a
              key={item.title}
              className="media-card reveal"
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              <div className="media-card__media">
                <SmartImage media={item.thumbnail} />
                <span className="media-card__play">
                  <span>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5.5v13l11-6.5-11-6.5z" />
                    </svg>
                  </span>
                </span>
              </div>
              <div className="media-card__body">
                {item.label && <Badge>{item.label}</Badge>}
                <p className="media-card__title">{item.title}</p>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* --- Content banner ------------------------------------------------------- */

export function ContentBanner({ block }: { block: ContentBannerBlock }) {
  const ref = useReveal<HTMLDivElement>()
  const imageLeft = block.imageSide === 'left'
  const theme = block.theme ?? 'transparent'
  const slug = slugify(block.eyebrow)

  return (
    <Section theme={theme} id={slug}>
      <Container>
        <div
          ref={ref}
          className={`content-banner reveal ${imageLeft ? 'content-banner--image-left' : ''} ${
            block.fit === 'natural' ? 'content-banner--fit-natural' : ''
          }`.trim()}
        >
          <div className="content-banner__text">
            {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
            <h2>{block.title}</h2>
            {block.subtitle && (
              <span className="content-banner__subtitle">{block.subtitle}</span>
            )}
            {block.body && <p className="content-banner__body">{block.body}</p>}
            {block.cta && (
              <ButtonLink
                href={block.cta.href}
                external={block.cta.external}
                variant={theme === 'dark' ? 'onDark' : 'secondary'}
              >
                {block.cta.label}
              </ButtonLink>
            )}
            {block.children?.length ? (
              <div className="content-banner__children">
                {block.children.map((child) => (
                  <Card key={child.title} item={child} variant="text" />
                ))}
              </div>
            ) : null}
          </div>
          {block.image && (
            <div className="content-banner__media">
              <SmartImage media={block.image} />
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}

/* --- Stat grid ------------------------------------------------------------ */

export function StatGrid({ block }: { block: StatGridBlock }) {
  const ref = useRevealGroup<HTMLDivElement>(70)

  return (
    <Section theme={block.theme ?? 'brand'} tight>
      <Container>
        <SectionHead
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
        />
        <div ref={ref} className="stat-grid">
          {block.items.map((item) => (
            <div
              className={`stat reveal${item.highlight ? ' stat--highlight' : ''}`}
              key={item.label}
            >
              <span className="stat__value">{item.value}</span>
              <span className="stat__label">{item.label}</span>
              {item.detail && <span className="stat__detail">{item.detail}</span>}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* --- Timeline ------------------------------------------------------------- */

export function Timeline({ block }: { block: TimelineBlock }) {
  const ref = useRevealGroup<HTMLDivElement>(60)

  return (
    <Section id="nuestra-historia">
      <Container>
        <SectionHead eyebrow={block.eyebrow} title={block.title} />
        <div ref={ref} className="timeline">
          {block.entries.map((entry) => (
            <article className="timeline__entry reveal" key={entry.period}>
              <span className="timeline__period">{entry.period}</span>
              {entry.title && <h3 className="timeline__title">{entry.title}</h3>}
              <p className="timeline__description">{entry.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* --- CTA banner ----------------------------------------------------------- */

export function CtaBanner({ block }: { block: CtaBannerBlock }) {
  const ref = useReveal<HTMLDivElement>()

  // El panel siempre va relleno en azul de marca; el tema sólo decide el fondo
  // de la sección que lo rodea.
  return (
    <Section theme={block.theme === 'light' ? 'light' : 'transparent'}>
      <Container>
        <div
          ref={ref}
          className={`cta-banner reveal${block.image ? '' : ' cta-banner--plain'}`}
        >
          <div className="cta-banner__text">
            <h2>{block.title}</h2>
            {block.description && (
              <p className="cta-banner__description">{block.description}</p>
            )}
            <div className="cta-banner__actions">
              <ButtonLink href={block.cta.href} external={block.cta.external}>
                {block.cta.label}
              </ButtonLink>
              {block.secondaryCta && (
                <ButtonLink
                  href={block.secondaryCta.href}
                  external={block.secondaryCta.external}
                  variant="onDark"
                  withArrow={false}
                >
                  {block.secondaryCta.label}
                </ButtonLink>
              )}
            </div>
          </div>
          {block.image && (
            <div className="cta-banner__media">
              <SmartImage media={block.image} />
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}

/* --- Link list ------------------------------------------------------------ */

export function LinkList({ block }: { block: LinkListBlock }) {
  const ref = useRevealGroup<HTMLDivElement>()
  const slug = slugify(block.eyebrow)

  return (
    <Section theme="light" id={slug}>
      <Container>
        <SectionHead
          eyebrow={block.eyebrow}
          title={block.title}
          description={block.description}
        />
        <div
          ref={ref}
          className="link-list"
          data-columns={String(block.columns ?? 3)}
        >
          {block.groups.map((group) => (
            <div className="link-group reveal" key={group.title}>
              <h3>{group.title}</h3>
              {group.description && (
                <p className="link-group__description">{group.description}</p>
              )}
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <ArrowLink href={link.href} external={link.external}>
                      {link.label}
                    </ArrowLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* --- Quote ---------------------------------------------------------------- */

export function Quote({ block }: { block: QuoteBlock }) {
  const ref = useReveal<HTMLElement>()

  return (
    <Section tight>
      <Container>
        <figure className="quote reveal" ref={ref}>
          <svg
            className="quote__mark"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.2 6C4.9 7.5 3.5 10 3.5 12.9c0 2.9 1.7 5.1 4.2 5.1 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.3-3.1-3.3-.4 0-.8.1-1 .2.3-1.5 1.6-3 3.2-3.9L7.2 6zm9.4 0c-2.3 1.5-3.7 4-3.7 6.9 0 2.9 1.7 5.1 4.2 5.1 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.3-3.1-3.3-.4 0-.8.1-1 .2.3-1.5 1.6-3 3.2-3.9L16.6 6z" />
          </svg>
          <blockquote className="quote__text">«{block.quote}»</blockquote>
          <figcaption>
            <div className="quote__author">{block.author}</div>
            {block.role && <div className="quote__role">{block.role}</div>}
          </figcaption>
        </figure>
      </Container>
    </Section>
  )
}
