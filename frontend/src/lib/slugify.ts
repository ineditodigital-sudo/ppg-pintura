/**
 * Convierte un texto en un identificador apto para `id` y anclas `#`.
 * Descompone los acentos y descarta las marcas combinantes (U+0300–U+036F),
 * de modo que "Innovación" → "innovacion".
 */
export function slugify(value: string | undefined): string | undefined {
  if (!value) return undefined
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || undefined
  )
}
