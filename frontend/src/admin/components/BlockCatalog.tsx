import { BLOCK_SCHEMA, BLOCK_TYPES } from '../schema'

/**
 * Catálogo visual de bloques.
 *
 * Antes esto era una lista de nombres técnicos. Quien no ha montado una web
 * no sabe qué es un «cardGrid», pero sí reconoce un dibujo de tres tarjetas
 * en fila. Cada entrada lleva un esquema del bloque hecho con rectángulos:
 * se elige por la forma, no por el nombre.
 */

type Familia = { titulo: string; pista: string; tipos: string[] }

const FAMILIAS: Familia[] = [
  {
    titulo: 'Para abrir la página',
    pista: 'Lo primero que ve quien entra.',
    tipos: ['hero', 'heroSlider'],
  },
  {
    titulo: 'Para contar algo',
    pista: 'Texto, imágenes y datos.',
    tipos: ['richText', 'contentBanner', 'mediaGrid', 'quote', 'timeline'],
  },
  {
    titulo: 'Para enumerar',
    pista: 'Varios elementos con el mismo formato.',
    tipos: ['cardGrid', 'specList', 'statGrid', 'linkList', 'colorShowcase', 'brandStrip'],
  },
  {
    titulo: 'Para que te contacten',
    pista: 'Lo que convierte una visita en un cliente.',
    tipos: ['ctaBanner', 'contactForm'],
  },
]

/** Miniatura esquemática: barras grises que insinúan la forma del bloque. */
function Miniatura({ tipo }: { tipo: string }) {
  const c = 'adm-mini__caja'
  const t = 'adm-mini__texto'

  const formas: Record<string, React.ReactNode> = {
    hero: (
      <>
        <span className={`${c} adm-mini--alto`} />
        <span className={`${t} adm-mini--sobre`} style={{ width: '58%' }} />
        <span className={`${t} adm-mini--sobre`} style={{ width: '40%', top: '58%' }} />
      </>
    ),
    heroSlider: (
      <>
        <span className={`${c} adm-mini--alto`} />
        <span className={`${t} adm-mini--sobre`} style={{ width: '52%' }} />
        <span className="adm-mini__puntos">
          <i /><i /><i />
        </span>
      </>
    ),
    richText: (
      <>
        <span className={t} style={{ width: '70%' }} />
        <span className={t} style={{ width: '100%' }} />
        <span className={t} style={{ width: '92%' }} />
      </>
    ),
    contentBanner: (
      <span className="adm-mini__fila">
        <span className={c} style={{ flex: 1, height: 34 }} />
        <span className="adm-mini__col">
          <span className={t} style={{ width: '80%' }} />
          <span className={t} style={{ width: '100%' }} />
          <span className={t} style={{ width: '60%' }} />
        </span>
      </span>
    ),
    mediaGrid: (
      <span className="adm-mini__fila">
        <span className={c} style={{ flex: 1, height: 30 }} />
        <span className={c} style={{ flex: 1, height: 30 }} />
        <span className={c} style={{ flex: 1, height: 30 }} />
      </span>
    ),
    cardGrid: (
      <span className="adm-mini__fila">
        {[0, 1, 2].map((i) => (
          <span className="adm-mini__tarjeta" key={i}>
            <span className={t} style={{ width: '70%' }} />
            <span className={t} style={{ width: '90%' }} />
          </span>
        ))}
      </span>
    ),
    specList: (
      <>
        {[0, 1, 2].map((i) => (
          <span className="adm-mini__linea" key={i}>
            <span className="adm-mini__punto" />
            <span className={t} style={{ width: `${70 - i * 12}%` }} />
          </span>
        ))}
      </>
    ),
    statGrid: (
      <span className="adm-mini__fila">
        {[0, 1, 2].map((i) => (
          <span className="adm-mini__tarjeta" key={i}>
            <span className="adm-mini__cifra" />
            <span className={t} style={{ width: '80%' }} />
          </span>
        ))}
      </span>
    ),
    linkList: (
      <span className="adm-mini__fila">
        {[0, 1].map((i) => (
          <span className="adm-mini__col" key={i}>
            <span className={t} style={{ width: '60%' }} />
            <span className={t} style={{ width: '85%' }} />
            <span className={t} style={{ width: '75%' }} />
          </span>
        ))}
      </span>
    ),
    colorShowcase: (
      <span className="adm-mini__fila">
        {['#0078A9', '#2A4B7C', '#8A9BA8', '#C8102E', '#3B4A54'].map((hex) => (
          <span className="adm-mini__muestra" key={hex} style={{ background: hex }} />
        ))}
      </span>
    ),
    brandStrip: (
      <span className="adm-mini__fila">
        {[0, 1].map((i) => (
          <span className="adm-mini__tarjeta" key={i}>
            <span className={c} style={{ height: 14, width: '55%' }} />
          </span>
        ))}
      </span>
    ),
    quote: (
      <>
        <span className="adm-mini__comilla">&ldquo;</span>
        <span className={t} style={{ width: '86%' }} />
        <span className={t} style={{ width: '64%' }} />
      </>
    ),
    timeline: (
      <>
        {[0, 1, 2].map((i) => (
          <span className="adm-mini__linea" key={i}>
            <span className="adm-mini__punto" />
            <span className={t} style={{ width: `${55 + i * 10}%` }} />
          </span>
        ))}
      </>
    ),
    ctaBanner: (
      <span className="adm-mini__cta">
        <span className={t} style={{ width: '58%', background: 'rgba(255,255,255,.9)' }} />
        <span className="adm-mini__boton" />
      </span>
    ),
    contactForm: (
      <>
        <span className="adm-mini__campo" />
        <span className="adm-mini__campo" />
        <span className="adm-mini__boton adm-mini--izq" />
      </>
    ),
  }

  return <span className="adm-mini">{formas[tipo] ?? <span className={t} style={{ width: '80%' }} />}</span>
}

export function BlockCatalog({
  onPick,
  onCancel,
}: {
  onPick: (tipo: string) => void
  onCancel: () => void
}) {
  const conocidos = new Set(FAMILIAS.flatMap((f) => f.tipos))
  const sueltos = BLOCK_TYPES.filter((t) => !conocidos.has(t))
  const familias = sueltos.length
    ? [...FAMILIAS, { titulo: 'Otros', pista: '', tipos: sueltos }]
    : FAMILIAS

  return (
    <div className="adm-catalogo">
      <div className="adm-catalogo__cabecera">
        <div>
          <h3>¿Qué quieres añadir?</h3>
          <p>Elige por la forma que tendrá en la página.</p>
        </div>
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {familias.map((familia) => (
        <section className="adm-catalogo__familia" key={familia.titulo}>
          <h4>
            {familia.titulo}
            {familia.pista && <small>{familia.pista}</small>}
          </h4>
          <div className="adm-catalogo__rejilla">
            {familia.tipos
              .filter((tipo) => BLOCK_SCHEMA[tipo])
              .map((tipo) => (
                <button
                  type="button"
                  className="adm-catalogo__opcion"
                  key={tipo}
                  onClick={() => onPick(tipo)}
                >
                  <Miniatura tipo={tipo} />
                  <span className="adm-catalogo__nombre">{BLOCK_SCHEMA[tipo].label}</span>
                  <span className="adm-catalogo__desc">{BLOCK_SCHEMA[tipo].description}</span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
