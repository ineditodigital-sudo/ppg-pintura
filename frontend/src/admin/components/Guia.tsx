import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import { guiaDeLaRuta, type PasoGuia } from '../guia'

/**
 * Guía de primeros pasos de cada módulo.
 *
 * Se abre sola la primera vez que se entra a una pantalla y señala el elemento
 * del que habla cada paso. La ayuda escrita ya existía, pero plegada detrás de
 * un botón: quien entra por primera vez no sabe que está ahí, y es justo quien
 * la necesita.
 *
 * Se recuerda por módulo, no en bloque: haber visto la guía de Páginas no
 * significa saber usar la carta de color. Y se puede repetir siempre desde el
 * botón de ayuda de la cabecera.
 */

/** Marca de versión: subirla vuelve a enseñar las guías a todo el mundo. */
const VERSION = 'v1'
const clave = (modulo: string) => `ppg-guia-${modulo}-${VERSION}`

function yaVista(modulo: string): boolean {
  try {
    return localStorage.getItem(clave(modulo)) === 'ok'
  } catch {
    // En navegación privada `localStorage` puede lanzar. Sin memoria, la guía
    // se ofrece siempre: molesta menos que no llegar a verla nunca.
    return false
  }
}

function marcarVista(modulo: string) {
  try {
    localStorage.setItem(clave(modulo), 'ok')
  } catch {
    /* Sin memoria no hay nada que recordar. */
  }
}

/** Evento con el que la cabecera pide repetir la guía de su pantalla. */
export const REPETIR_GUIA = 'ppg:repetir-guia'

export function abrirGuia() {
  window.dispatchEvent(new CustomEvent(REPETIR_GUIA))
}

interface Recuadro {
  top: number
  left: number
  width: number
  height: number
}

/** Dónde está el objetivo del paso, o null si no hay objetivo o no se ve. */
function medir(objetivo: string | undefined): Recuadro | null {
  if (!objetivo) return null

  const nodo = document.querySelector(objetivo)
  if (!nodo) return null

  const r = nodo.getBoundingClientRect()
  // Un elemento de tamaño cero —oculto, aún sin datos— no se puede señalar.
  if (r.width === 0 || r.height === 0) return null

  // Ni uno que quede fuera de la pantalla. El pie del menú lateral cae en el
  // 838 con una ventana de 720: se iluminaba un trozo de nada por debajo del
  // borde y la tarjeta se colocaba respecto a algo que el usuario no veía.
  // Sin objetivo visible, el paso se cuenta centrado, que sigue sirviendo.
  const { innerWidth: W, innerHeight: H } = window
  if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return null

  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const MARGEN = 14
const ANCHO_MAX = 340

/**
 * Lo que mide la tarjeta de verdad. En un móvil de 375px no caben 340 más los
 * márgenes, y la colocación creía que sí: elegía ponerla al lado del objetivo
 * y la mitad de la tarjeta quedaba fuera de la pantalla. El mismo valor está
 * en el CSS con `min()`; aquí hace falta para decidir dónde cabe.
 */
function anchoTarjeta(): number {
  return Math.min(ANCHO_MAX, window.innerWidth - MARGEN * 2)
}
/** Alto de partida, hasta que se mide el real. Depende de lo largo que sea el texto. */
const ALTO_INICIAL = 240

/**
 * Dónde poner la tarjeta para que no tape lo que está señalando.
 *
 * Se prueban cuatro sitios por orden —debajo, encima, a la derecha, a la
 * izquierda— y se coge el primero que cabe entero en pantalla sin solaparse
 * con el objetivo. Bastaba con «debajo, y si no encima» hasta que un paso
 * señaló el menú lateral entero: 732 px de alto no dejan hueco arriba ni
 * abajo, y la tarjeta caía justo encima de lo que quería enseñar.
 *
 * Si no cabe en ningún lado, se centra: el aro del foco sigue viéndose
 * alrededor y es preferible a empujarla fuera de la pantalla.
 */
function colocar(r: Recuadro | null, ALTO: number): React.CSSProperties {
  const { innerWidth: W, innerHeight: H } = window
  const ANCHO = anchoTarjeta()

  /**
   * Centrada con coordenadas, no con `translate(-50%, -50%)`.
   *
   * La animación de entrada anima `transform`, y con `fill-mode: both` se
   * queda con el valor que había cuando arrancó —antes de que se aplicara el
   * centrado—, así que dejaba la tarjeta a media pantalla de distancia. En un
   * escritorio no se notaba porque casi nunca se recurre a centrarla; en un
   * móvil no cabe en ningún lado y es el único caso que se da.
   */
  const centrada: React.CSSProperties = {
    left: Math.max(MARGEN, (W - ANCHO) / 2),
    top: Math.max(MARGEN, (H - ALTO) / 2),
  }

  if (!r) return centrada
  const centroX = r.left + r.width / 2 - ANCHO / 2
  const centroY = r.top + r.height / 2 - ALTO / 2
  const dentro = (v: number, max: number) => Math.min(Math.max(MARGEN, v), Math.max(MARGEN, max))

  const candidatos = [
    { top: r.top + r.height + MARGEN, left: dentro(centroX, W - ANCHO - MARGEN) },
    { top: r.top - MARGEN - ALTO, left: dentro(centroX, W - ANCHO - MARGEN) },
    { top: dentro(centroY, H - ALTO - MARGEN), left: r.left + r.width + MARGEN },
    { top: dentro(centroY, H - ALTO - MARGEN), left: r.left - MARGEN - ANCHO },
  ]

  /** Cuánta superficie de la tarjeta pisa el objetivo, en píxeles cuadrados. */
  const solape = (c: { top: number; left: number }) => {
    const x = Math.max(0, Math.min(c.left + ANCHO, r.left + r.width) - Math.max(c.left, r.left))
    const y = Math.max(0, Math.min(c.top + ALTO, r.top + r.height) - Math.max(c.top, r.top))
    return x * y
  }

  const caben = candidatos.filter(
    (c) =>
      c.top >= MARGEN && c.left >= MARGEN &&
      c.top + ALTO <= H - MARGEN && c.left + ANCHO <= W - MARGEN,
  )

  if (caben.length === 0) return centrada

  // El primero que no pise nada; si todos pisan —un objetivo que ocupa media
  // pantalla no deja hueco— el que pise menos. Centrar la tarjeta sobre una
  // rejilla grande tapaba justo lo que estaba señalando.
  const limpio = caben.find((c) => solape(c) === 0)

  return limpio ?? caben.reduce((a, b) => (solape(a) <= solape(b) ? a : b))
}

export function Guia() {
  const { pathname } = useLocation()
  const encontrada = guiaDeLaRuta(pathname)

  const [abierta, setAbierta] = useState(false)
  const [paso, setPaso] = useState(0)
  const [recuadro, setRecuadro] = useState<Recuadro | null>(null)
  /**
   * El alto real de la tarjeta.
   *
   * Se colocaba reservando 240 px fijos, pero un texto largo la hace más alta
   * y entonces se metía encima de lo que estaba señalando. Se mide después de
   * pintarla y se vuelve a colocar con la medida buena.
   */
  const [alto, setAlto] = useState(ALTO_INICIAL)
  const tarjetaRef = useRef<HTMLDivElement>(null)

  const modulo = encontrada?.clave ?? ''

  /**
   * Los pasos que aplican a esta pantalla y a este tamaño.
   *
   * Se calcula al abrir y no en cada render: si se recalculara mientras la
   * guía está abierta, iluminar un paso podría hacer aparecer o desaparecer
   * otro y la numeración bailaría bajo los pies de quien la está leyendo.
   */
  const pasos = useMemo(() => {
    const todos = encontrada?.guia.pasos ?? []
    if (!abierta) return todos

    return todos.filter(
      (p) => !p.soloConObjetivo || (p.objetivo && document.querySelector(p.objetivo)),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encontrada, abierta])

  const actual: PasoGuia | undefined = pasos[paso]

  const cerrar = useCallback(() => {
    setAbierta(false)
    if (modulo) marcarVista(modulo)
  }, [modulo])

  // Primera visita al módulo: se abre sola. El retardo deja que la pantalla
  // termine de pintar sus datos; señalar un elemento que aún no existe sería
  // señalar el vacío.
  useEffect(() => {
    setAbierta(false)
    setPaso(0)

    if (!modulo || yaVista(modulo)) return

    const t = setTimeout(() => setAbierta(true), 700)
    return () => clearTimeout(t)
  }, [modulo])

  // Repetir a petición, desde el botón de la cabecera.
  useEffect(() => {
    const alPedir = () => {
      setPaso(0)
      setAbierta(true)
    }

    window.addEventListener(REPETIR_GUIA, alPedir)
    return () => window.removeEventListener(REPETIR_GUIA, alPedir)
  }, [])

  // Se vuelve a medir en cada paso y cuando la página se mueve debajo.
  useEffect(() => {
    if (!abierta || !actual) return

    const recolocar = () => setRecuadro(medir(actual.objetivo))

    const nodo = actual.objetivo ? document.querySelector(actual.objetivo) : null

    // Desplazamiento instantáneo, no suave. El suave es más bonito pero el
    // navegador no avisa de cuándo termina: había que medir a ciegas unos
    // milisegundos después y el botón de «Añadir un bloque», que está en el
    // píxel 1897 de una ventana de 720, se leía todavía fuera de pantalla y se
    // quedaba sin iluminar. Así las coordenadas ya son buenas en la línea
    // siguiente. El foco tiene su propia transición, así que se sigue viendo
    // el movimiento de un paso al otro.
    nodo?.scrollIntoView({ block: 'center', behavior: 'auto' })

    // Aun así se vuelve a medir: una imagen que termina de cargar o un panel
    // que se despliega mueven lo que hay debajo.
    recolocar()
    const relojes = [150, 400, 800].map((ms) => setTimeout(recolocar, ms))

    window.addEventListener('resize', recolocar)
    window.addEventListener('scroll', recolocar, true)

    return () => {
      relojes.forEach(clearTimeout)
      window.removeEventListener('resize', recolocar)
      window.removeEventListener('scroll', recolocar, true)
    }
  }, [abierta, actual])

  // El alto real, antes de pintar. Con `useEffect` la corrección llegaba un
  // fotograma tarde: la tarjeta ya se había colocado con el alto del paso
  // anterior y el hueco de 14 px se lo comía el texto más largo, dejándola
  // pegada al elemento que señalaba.
  useLayoutEffect(() => {
    const nodo = tarjetaRef.current
    if (!abierta || !nodo) return

    const medirAlto = () => setAlto(nodo.getBoundingClientRect().height || ALTO_INICIAL)

    medirAlto()
    const observador = new ResizeObserver(medirAlto)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [abierta, paso])

  // Teclado: escapar cierra, flechas y Enter avanzan. El foco entra en la
  // tarjeta para que el lector de pantalla anuncie el paso.
  useEffect(() => {
    if (!abierta) return

    tarjetaRef.current?.focus()

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cerrar()
      } else if (e.key === 'ArrowRight') {
        setPaso((p) => Math.min(p + 1, pasos.length - 1))
      } else if (e.key === 'ArrowLeft') {
        setPaso((p) => Math.max(p - 1, 0))
      }
    }

    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [abierta, cerrar, pasos.length, paso])

  if (!abierta || !encontrada || !actual) return null

  const ultimo = paso === pasos.length - 1

  const estilo = colocar(recuadro, alto)

  return (
    <div className="adm-guia" role="presentation">
      {/* El foco es un solo elemento con una sombra enorme alrededor: recorta
          el agujero sin máscaras SVG ni cuatro divs que cuadrar. */}
      {recuadro && (
        <div
          className="adm-guia__foco"
          style={{
            top: recuadro.top - 6,
            left: recuadro.left - 6,
            width: recuadro.width + 12,
            height: recuadro.height + 12,
          }}
        />
      )}
      {!recuadro && <div className="adm-guia__velo" />}

      <div
        className="adm-guia__tarjeta"
        style={estilo}
        ref={tarjetaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-guia-titulo"
      >
        <p className="adm-guia__modulo">
          {encontrada.guia.titulo} · paso {paso + 1} de {pasos.length}
        </p>
        <h2 id="adm-guia-titulo">{actual.titulo}</h2>
        <p className="adm-guia__texto">{actual.texto}</p>

        <div className="adm-guia__puntos" aria-hidden="true">
          {pasos.map((_, i) => (
            <span key={i} className={i === paso ? 'is-actual' : ''} />
          ))}
        </div>

        <div className="adm-guia__acciones">
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={cerrar}>
            {ultimo ? 'Cerrar' : 'Saltar'}
          </button>
          <div className="adm-guia__pasar">
            {paso > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn--sm"
                onClick={() => setPaso((p) => p - 1)}
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              className="adm-btn adm-btn--primary adm-btn--sm"
              onClick={() => (ultimo ? cerrar() : setPaso((p) => p + 1))}
            >
              {ultimo ? 'Entendido' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
