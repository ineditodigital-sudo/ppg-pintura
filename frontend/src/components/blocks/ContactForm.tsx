import { useId, useState } from 'react'
import type { ContactFormBlock } from '@/types/content'
import { Container, Section, SectionHead } from '@/components/ui'
import { submitContact, type ContactResult } from '@/lib/api'
import './blocks.css'

/**
 * Mejora sobre el original: ppg.com/es-MX sólo enlaza a páginas por industria,
 * sin formulario propio. Aquí sí se puede escribir directamente.
 */
export function ContactForm({ block }: { block: ContactFormBlock }) {
  const id = useId()
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ContactResult | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setSending(true)
    setResult(null)

    const response = await submitContact({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      company: String(data.get('company') ?? ''),
      topic: String(data.get('topic') ?? ''),
      message: String(data.get('message') ?? ''),
    })

    setSending(false)
    setResult(response)
    if (response.ok) form.reset()
  }

  return (
    <Section id="formulario">
      <Container>
        <SectionHead title={block.title} description={block.description} />
        {/* Formulario y datos lado a lado: así se ven ambos sin desplazarse. */}
        <div className={`contact-layout${block.aside ? '' : ' contact-layout--solo'}`}>
        <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
          <div className="field">
            <label htmlFor={`${id}-name`}>
              Nombre <span className="field__required">*</span>
            </label>
            <input
              id={`${id}-name`}
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={120}
            />
          </div>

          <div className="field">
            <label htmlFor={`${id}-email`}>
              Correo electrónico <span className="field__required">*</span>
            </label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={180}
            />
          </div>

          <div className="field">
            <label htmlFor={`${id}-company`}>Empresa</label>
            <input
              id={`${id}-company`}
              name="company"
              type="text"
              autoComplete="organization"
              maxLength={120}
            />
          </div>

          <div className="field">
            <label htmlFor={`${id}-topic`}>
              Tema <span className="field__required">*</span>
            </label>
            <select id={`${id}-topic`} name="topic" required defaultValue="">
              <option value="" disabled>
                Selecciona un tema
              </option>
              {block.topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div className="field field--wide">
            <label htmlFor={`${id}-message`}>
              Mensaje <span className="field__required">*</span>
            </label>
            <textarea
              id={`${id}-message`}
              name="message"
              required
              minLength={10}
              maxLength={4000}
              placeholder="Cuéntanos qué necesitas: industria, sustrato, volumen estimado o el problema que buscas resolver."
            />
          </div>

          {result && (
            <p
              className={`form-status ${result.ok ? 'form-status--ok' : 'form-status--error'}`}
              role="status"
              aria-live="polite"
            >
              {result.message}
            </p>
          )}

          <div className="contact-form__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={sending}
            >
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </div>
        </form>

        {block.aside && (
          <aside className="contact-aside">
            {block.aside.logo && (
              <img
                className="contact-aside__logo"
                src={block.aside.logo.src}
                alt={block.aside.logo.alt}
                width={block.aside.logo.width}
                height={block.aside.logo.height}
                decoding="async"
              />
            )}
            {block.aside.title && <h3>{block.aside.title}</h3>}
            {block.aside.subtitle && (
              <p className="contact-aside__subtitle">{block.aside.subtitle}</p>
            )}

            <ul className="contact-aside__list">
              {block.aside.details.map((d) => (
                <li key={d.label}>
                  <span className="contact-aside__label">{d.label}</span>
                  {d.href ? (
                    <a
                      className="contact-aside__value"
                      href={d.href}
                      target={d.href.startsWith('http') ? '_blank' : undefined}
                      rel={d.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                    >
                      {d.value}
                    </a>
                  ) : (
                    <span className="contact-aside__value">{d.value}</span>
                  )}
                  {/* Cada valor extra va con su propio enlace, no como nota
                      suelta: un correo que no se puede pulsar obliga a
                      copiarlo a mano. */}
                  {d.extra?.map((e) =>
                    e.href ? (
                      <a className="contact-aside__value" href={e.href} key={e.value}>
                        {e.value}
                      </a>
                    ) : (
                      <span className="contact-aside__value" key={e.value}>
                        {e.value}
                      </span>
                    ),
                  )}
                  {d.note && <span className="contact-aside__note">{d.note}</span>}
                </li>
              ))}
            </ul>

            {block.aside.addresses && block.aside.addresses.length > 0 && (
              <div className="contact-aside__addresses">
                {block.aside.addresses.map((a) => (
                  <div key={a.label}>
                    <span className="contact-aside__label">{a.label}</span>
                    <span className="contact-aside__address">{a.value}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
        </div>
      </Container>
    </Section>
  )
}
