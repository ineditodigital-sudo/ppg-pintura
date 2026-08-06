/**
 * Recorta una descripción a la longitud que Google muestra sin truncar.
 *
 * El límite práctico ronda los 155–160 caracteres. Cortar por el número exacto
 * parte palabras por la mitad, así que se retrocede hasta el último espacio y
 * se cierra con puntos suspensivos sólo si de verdad se ha cortado algo.
 */
export function resumirSeo(texto: string, maximo = 155): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= maximo) return limpio

  const recorte = limpio.slice(0, maximo - 1)
  const corte = recorte.lastIndexOf(' ')

  return `${(corte > maximo * 0.6 ? recorte.slice(0, corte) : recorte).replace(/[,;:.\s]+$/, '')}…`
}
