/**
 * Prepara la miniatura de placa que la carta de color tiñe con cada referencia.
 *
 * De la foto original salen dos piezas:
 *
 *   placa-mascara.webp   silueta de las piezas (blanco = pieza). Recorta el
 *                        color plano, de modo que el fondo no se tiñe.
 *   placa-relieve.webp   la misma foto en gris y normalizada, con alfa
 *                        recortado por la silueta, para multiplicar encima:
 *                        es lo que le devuelve el volumen al color.
 *   placa-suelo.webp     sólo la sombra proyectada, en gris y sin mezcla.
 *
 * La separación se hace por saturación, no por luminancia: las piezas están
 * pintadas —saturadas— y todo lo demás (fondo y sombra proyectada) es gris.
 * Un umbral de luminancia se comería la sombra del suelo, que debe seguir
 * siendo gris y no tomar el color de la pieza.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..', '..')
const origen = join(raiz, 'miniatura pintura.png')
const destino = join(aqui, '..', 'public', 'assets', 'csmx')

/** Recorta el margen blanco y deja la pieza a sangre. */
const RECORTE_UMBRAL = 12

const { data, info } = await sharp(origen)
  .trim({ threshold: RECORTE_UMBRAL })
  .resize(640, 640, { fit: 'contain', background: '#ffffff' })
  .flatten({ background: '#ffffff' })
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width, height, channels } = info
const total = width * height

/**
 * Con qué fuerza puede oscurecer el sombreado.
 *
 * La foto original es de un vino oscuro: su luminancia media ronda el 40 %, y
 * multiplicar por ella directamente convertía cualquier referencia en un tono
 * casi negro —el blanco roto salía gris marengo—. El relieve se conserva
 * mapeando la luz de la pieza a este rango en vez de a [0, 1].
 */
const SOMBRA_MINIMA = 0.62

const mascara = Buffer.alloc(total)
const sombras = Buffer.alloc(total)
const luces = new Float32Array(total)

let maxLuzPieza = 0
let minLuzPieza = 255

// El logotipo de PPG va aparte: es lo único azul de la imagen y no debe
// teñirse con cada referencia. Se localiza para borrarlo de las dos capas.
let logo = { x0: width, y0: height, x1: 0, y1: 0, visto: false }

for (let i = 0; i < total; i++) {
  const r = data[i * channels]
  const g = data[i * channels + 1]
  const b = data[i * channels + 2]

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturacion = max === 0 ? 0 : (max - min) / max
  const luz = (max + min) / 2

  luces[i] = luz

  if (b > r + 25 && b > g + 25) {
    const x = i % width
    const y = (i / width) | 0
    logo = {
      x0: Math.min(logo.x0, x),
      y0: Math.min(logo.y0, y),
      x1: Math.max(logo.x1, x),
      y1: Math.max(logo.y1, y),
      visto: true,
    }
  }

  // Rampa suave en lugar de umbral duro: los bordes de la pieza quedan con
  // antialias en vez de escalonados.
  const valor = Math.min(1, Math.max(0, (saturacion - 0.12) / 0.18))
  mascara[i] = Math.round(valor * 255)

  if (valor > 0.9) {
    if (luz > maxLuzPieza) maxLuzPieza = luz
    if (luz < minLuzPieza) minLuzPieza = luz
  }
}

// El logotipo se borra con margen: fuera de la máscara y a blanco en las
// sombras, para que no deje ni halo ni recuadro gris.
if (logo.visto) {
  const margen = 6
  for (let y = Math.max(0, logo.y0 - margen); y <= Math.min(height - 1, logo.y1 + margen); y++) {
    for (let x = Math.max(0, logo.x0 - margen); x <= Math.min(width - 1, logo.x1 + margen); x++) {
      const i = y * width + x
      mascara[i] = 0
      luces[i] = 255
    }
  }
}

// Mapa de sombras. Dentro de la pieza, su rango de luz se estira al tramo
// [SOMBRA_MINIMA, 1]: el punto más iluminado deja pasar el color puro y el más
// oscuro lo baja lo justo para que se lea el relieve. Fuera se conserva el gris
// original, que es lo que mantiene la sombra proyectada sobre el fondo.
const recorrido = Math.max(1, maxLuzPieza - minLuzPieza)

for (let i = 0; i < total; i++) {
  const luz = luces[i]
  const dentro = mascara[i] / 255

  const normalizada =
    (SOMBRA_MINIMA + (1 - SOMBRA_MINIMA) * Math.min(1, Math.max(0, (luz - minLuzPieza) / recorrido))) * 255

  sombras[i] = Math.round(normalizada * dentro + luz * (1 - dentro))
}

/*
 * La máscara se guarda en el canal ALFA, no como escala de grises.
 *
 * `mask-image` con una imagen de mapa de bits usa el alfa —`mask-mode` vale
 * `match-source`, que para estas imágenes equivale a `alpha`—, no la
 * luminancia. Una máscara en grises es opaca de lado a lado: no recorta nada,
 * el color plano cubre el recuadro entero y el fondo acaba teñido.
 */
const mascaraConAlfa = Buffer.alloc(total * 2)

for (let i = 0; i < total; i++) {
  mascaraConAlfa[i * 2] = 0
  mascaraConAlfa[i * 2 + 1] = mascara[i]
}

await sharp(mascaraConAlfa, { raw: { width, height, channels: 2 } })
  .toColourspace('b-w')
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(join(destino, 'placa-mascara.webp'))

/*
 * El relieve se guarda CON canal alfa recortado por la máscara.
 *
 * Antes era una imagen opaca que se multiplicaba sobre todo el recuadro: el
 * fondo salía blanco por pura aritmética —blanco × blanco— pero cualquier
 * píxel gris de la foto original (el borde suavizado de la pieza, el grano de
 * la compresión) teñía el fondo al mezclarse con el color de debajo. Con alfa,
 * el multiply no existe fuera de la pieza: no hay nada que mezclar.
 */
const relieve = Buffer.alloc(total * 2)

for (let i = 0; i < total; i++) {
  relieve[i * 2] = sombras[i]
  relieve[i * 2 + 1] = mascara[i]
}

await sharp(relieve, { raw: { width, height, channels: 2 } })
  .toColourspace('b-w')
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(join(destino, 'placa-relieve.webp'))

/*
 * Y la sombra que la pieza proyecta sobre el suelo va en su propia imagen, sin
 * mezcla ninguna: es lo único que queda fuera de la silueta y tiene que
 * seguir siendo gris, no del color de la referencia.
 */
const suelo = Buffer.alloc(total * 2)

for (let i = 0; i < total; i++) {
  const fuera = 1 - mascara[i] / 255
  // 255 es fondo limpio; cuanto más oscura la foto ahí, más sombra.
  const oscuridad = Math.max(0, 255 - luces[i])
  suelo[i * 2] = 0
  suelo[i * 2 + 1] = Math.round(oscuridad * fuera)
}

await sharp(suelo, { raw: { width, height, channels: 2 } })
  .toColourspace('b-w')
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(join(destino, 'placa-suelo.webp'))

const cubierto = mascara.reduce((suma, v) => suma + (v > 127 ? 1 : 0), 0)

console.log(`Placa generada: ${width}×${height}`)
console.log(`  pieza: ${((cubierto / total) * 100).toFixed(1)} % del lienzo`)
console.log(`  luz máxima de la pieza: ${maxLuzPieza} → normalizada a 255`)
