/**
 * Textos de fábrica de las páginas que no son documentos.
 *
 * Se comparten entre la página que los pinta y el panel que los edita: si
 * vivieran sólo en la página, el campo del CMS saldría vacío y quien lo abre
 * no sabría qué está cambiando. Un recuadro en blanco con un «si lo dejas así
 * se usa otra cosa» no es editar, es adivinar.
 */

/** Página de error. */
export const NOT_FOUND_POR_DEFECTO = {
  eyebrow: 'Error 404',
  title: 'No encontramos esta página',
  body: 'Puede que el enlace haya cambiado o que la página ya no exista. Desde el inicio puedes llegar a todo nuestro catálogo.',
  cta: { label: 'Volver al inicio', href: '/' },
  ctaSecundario: { label: 'Contáctanos', href: '/contacto' },
  seoTitle: 'Página no encontrada | PPG',
  seoDescription: 'La página que buscas no existe o fue movida.',
} as const
