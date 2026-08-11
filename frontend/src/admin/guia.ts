/**
 * Guía de cada módulo del panel.
 *
 * La ayuda ya existía, pero plegada detrás de un botón: había que saber que
 * estaba ahí y pulsarla. Quien entra por primera vez no sabe ni eso. Estos
 * mismos pasos ahora se abren solos la primera vez que se entra a un módulo,
 * señalando el elemento del que hablan, y se pueden repetir cuando se quiera.
 *
 * Un paso sin `objetivo` es contexto —qué es esta pantalla, qué alimenta— y se
 * enseña centrado. Uno con `objetivo` ilumina ese elemento: es la diferencia
 * entre leer «arrastra para reordenar» y ver cuál es el asa.
 *
 * Los selectores son de clases que ya existen en el marcado. Si un elemento no
 * está —una lista vacía, una acción que sólo sale con datos— el paso se enseña
 * centrado en vez de apuntar a la nada.
 */

export interface PasoGuia {
  /** Elemento que se ilumina. Sin él, el paso va centrado. */
  objetivo?: string
  titulo: string
  texto: string
}

export interface Guia {
  /** Se lee en la cabecera de la guía. */
  titulo: string
  pasos: PasoGuia[]
}

/**
 * Pasos comunes a las pantallas que se guardan.
 *
 * La barra de guardado aparece sola al tocar algo, así que en la primera
 * visita no está en pantalla: el paso se enseña centrado y sigue explicando lo
 * que hace falta saber —que nada se publica hasta pulsar Guardar—.
 */
const GUARDAR: PasoGuia = {
  objetivo: '.adm-savebar',
  titulo: 'Nada se publica hasta que guardas',
  texto:
    'En cuanto cambies algo aparece abajo una barra con Guardar y Descartar. Mientras no pulses Guardar, el sitio sigue como estaba. Si te equivocas, Descartar deja la pantalla como la encontraste.',
}

export const GUIAS: Record<string, Guia> = {
  inicio: {
    titulo: 'Bienvenido a tu panel',
    pasos: [
      {
        titulo: 'Desde aquí editas tu sitio, sin tocar código',
        texto:
          'Todo lo que se ve en la web —textos, imágenes, colores, menús, contactos— se cambia desde estas pantallas. Esta guía se abre sola la primera vez que entras a cada una.',
      },
      {
        objetivo: '.admin-side',
        titulo: 'El menú, agrupado por lo que hace',
        texto:
          'Contenido es lo que se lee en la web. Catálogo son tus productos y colores. Biblioteca son las imágenes y los mensajes que te llegan. Sistema son los ajustes de correo y tu contraseña.',
      },
      {
        objetivo: '.admin-side__ver',
        titulo: 'Ver el sitio en cualquier momento',
        texto:
          'Abre tu web en otra pestaña para comprobar cómo quedó lo que acabas de guardar.',
      },
      {
        objetivo: '.admin-head__ayuda-btn',
        titulo: 'Si te pierdes, esta guía vuelve',
        texto:
          'Este botón está en todas las pantallas. Repite la guía del módulo en el que estés, tantas veces como quieras.',
      },
    ],
  },

  paginas: {
    titulo: 'Las páginas de tu sitio',
    pasos: [
      {
        titulo: 'Las catorce páginas, en un sitio',
        texto:
          'Aquí están todas: las que puedes armar bloque a bloque y las que se construyen solas con tus datos de producto y sector.',
      },
      {
        objetivo: '.adm-grupo:first-of-type .adm-tarjeta',
        titulo: 'Páginas propias: se editan bloque a bloque',
        texto:
          'Inicio, Quiénes Somos, Mercados y Contacto. Cada una es una lista de secciones que puedes reordenar, añadir o quitar. Pulsa Editar en su tarjeta para abrirla.',
      },
      {
        objetivo: '.adm-tarjeta__mini',
        titulo: 'La miniatura es la de la propia página',
        texto:
          'La foto que ves aquí es la que sale publicada. Sirve para reconocer la página de un vistazo, sin leer su dirección.',
      },
      {
        objetivo: '.adm-tarjeta__pie',
        titulo: 'Editar, ver y eliminar',
        texto:
          'Editar abre la página. Ver la abre en el sitio, tal como la ve un visitante. Eliminar sólo aparece en las páginas propias, y guarda una copia de seguridad antes de borrar.',
      },
      {
        titulo: 'Las que dicen «Desde plantilla» se editan en otro sitio',
        texto:
          'Las nueve páginas de producto y sector se arman solas. Sus datos salen de Líneas y de Mercados, y el resto de su texto, de «Textos de producto y sector». Su tarjeta te dice a dónde ir.',
      },
    ],
  },

  plantillas: {
    titulo: 'Textos de producto y sector',
    pasos: [
      {
        titulo: 'Un texto, nueve páginas',
        texto:
          'Estas nueve páginas son la misma plantilla repetida con datos distintos. Lo que cambies aquí se aplica de golpe a todas las de ese grupo: es a propósito, para que no se separen sin querer.',
      },
      {
        objetivo: '.adm-grupo:first-of-type > .adm-grupo__titulo',
        titulo: 'Páginas de producto',
        texto:
          'Afecta a las tres páginas de /productos/…. Los títulos de sección, las tarjetas de servicio y el cierre.',
      },
      {
        objetivo: '.adm-grupo:last-of-type > .adm-grupo__titulo',
        titulo: 'Páginas de sector',
        texto:
          'Afecta a las seis de /mercados/…. Además del texto, aquí está la tabla de qué implica recubrir cada material.',
      },
      {
        titulo: 'Ojo con {sector} y {exigencias}',
        texto:
          'Son marcadores: se sustituyen por el nombre del sector y por sus exigencias en cada página. Si los borras, la frase queda coja en las seis a la vez, así que el guardado te avisará.',
      },
      GUARDAR,
    ],
  },

  navegacion: {
    titulo: 'El menú y el pie',
    pasos: [
      {
        titulo: 'Lo que sale arriba y abajo en todas las páginas',
        texto:
          'El menú principal, las columnas del pie y la línea de enlaces legales.',
      },
      {
        objetivo: '.adm-tarjeta',
        titulo: 'Cada tarjeta es una entrada del menú',
        texto:
          'Pulsa Editar en una para cambiar su texto y su destino. Una entrada con subenlaces abre el mega-menú; sin ellos, es un enlace directo y necesita su dirección.',
      },
      {
        objetivo: '.adm-tarjeta__orden',
        titulo: 'El orden es el que se ve',
        texto:
          'Las flechas suben y bajan la entrada. El orden de esta lista es exactamente el orden en pantalla.',
      },
      {
        titulo: 'Direcciones internas y externas',
        texto:
          'Las de tu propio sitio empiezan por una barra: /colores. Las de fuera, por https://.',
      },
      GUARDAR,
    ],
  },

  lineas: {
    titulo: 'Líneas de producto',
    pasos: [
      {
        titulo: 'Las líneas que alimentan /productos/…',
        texto:
          'Cada línea de esta lista es una página del sitio y una entrada del mega-menú. Añadir una línea es crear su página.',
      },
      {
        objetivo: '.adm-tarjeta__abrir',
        titulo: 'Pulsa la tarjeta para editarla',
        texto:
          'Se abre debajo un formulario con todo lo suyo: nombre, titular, descripción, imagen y las cifras de la banda azul.',
      },
      {
        titulo: 'El slug forma la dirección',
        texto:
          'Cambiarlo cambia la URL de esa página y rompe los enlaces que ya circulan y su posición en Google. Piénsalo antes de tocarlo.',
      },
      {
        titulo: 'Las cifras son opcionales',
        texto:
          'Si una línea no las tiene, su página no muestra esa banda, en vez de enseñar las de otra línea. Es preferible el hueco al dato prestado.',
      },
      GUARDAR,
    ],
  },

  mercados: {
    titulo: 'Mercados',
    pasos: [
      {
        titulo: 'Los sectores a los que te diriges',
        texto:
          'Cada uno alimenta su página en /mercados/… y la rejilla de la portada.',
      },
      {
        objetivo: '.adm-tarjeta__abrir',
        titulo: 'Pulsa la tarjeta para editarla',
        texto:
          'Dentro están su nombre, su titular, su imagen, los materiales sobre los que se aplica y lo que ese sector exige.',
      },
      {
        objetivo: '.adm-tarjeta__sello',
        titulo: 'El icono del sector',
        texto:
          'El que ves sellado sobre la foto es el que sale publicado. Se elige dentro del formulario.',
      },
      {
        objetivo: '.adm-tarjeta__orden',
        titulo: 'El orden manda en la portada',
        texto:
          'Este es el orden en el que salen en la página de mercados y en el mega-menú.',
      },
      GUARDAR,
    ],
  },

  colores: {
    titulo: 'La carta de color',
    pasos: [
      {
        titulo: 'Las 83 referencias de tu catálogo',
        texto:
          'Alimentan la página de colores, la ficha que se abre al pulsar un color y la carta de la página de pintura en polvo.',
      },
      {
        objetivo: '.adm-hoja',
        titulo: 'Para cambiar muchas a la vez, usa Excel',
        texto:
          'Descarga la carta, edítala en Excel y vuelve a subir el mismo archivo. Es mucho más rápido que ir una a una.',
      },
      {
        objetivo: '.adm-hoja__subir',
        titulo: 'Antes de aplicar, te enseño qué cambiaría',
        texto:
          'Al subir el archivo no se guarda nada: primero verás una tabla con cada valor antes y después. Tú confirmas.',
      },
      {
        objetivo: '.adm-indice',
        titulo: 'Esta pantalla es larga: aquí está el índice',
        texto:
          'Seis secciones. Pulsa una para saltar directamente, sin bajar buscando.',
      },
      {
        objetivo: '#carta-ficha',
        titulo: 'La ficha técnica que ve el visitante',
        texto:
          'El recuadro que se abre al pulsar un color. Aquí se editan los textos comunes a las 83 referencias; los datos de cada una —RAL, acabado, brillo— salen de la tabla de más abajo.',
      },
      {
        objetivo: '.adm-carta__filtros',
        titulo: 'Buscar una referencia concreta',
        texto:
          'Filtra por código, nombre o RAL, o por familia, para no bajar por las 83.',
      },
      {
        objetivo: '.adm-carta__acciones',
        titulo: 'Editar una referencia a fondo',
        texto:
          'La tabla sirve para repasar y para cambios rápidos. Con «Ficha» se abre esa referencia sola, con los nombres de cada dato escritos y la muestra en grande, y se pasa de una a otra sin cerrar.',
      },
      {
        titulo: 'Las familias son las pestañas de la carta',
        texto:
          'Borrar una familia deja huérfanas sus referencias y el guardado se rechaza. Cambia antes las referencias de familia.',
      },
      GUARDAR,
    ],
  },

  destacados: {
    titulo: 'Productos destacados',
    pasos: [
      {
        titulo: 'Los que salen en la portada',
        texto: 'La selección de producto que aparece en la página de inicio.',
      },
      {
        objetivo: '.adm-tarjeta__abrir',
        titulo: 'Pulsa la tarjeta para editarla',
        texto: 'Su nombre, su clave, su imagen y el texto que la acompaña.',
      },
      GUARDAR,
    ],
  },

  ajustes: {
    titulo: 'Ajustes del sitio',
    pasos: [
      {
        titulo: 'Lo que sale en todas las páginas',
        texto:
          'Marca, logotipos, colores, redes sociales, aviso de copyright y la página de error.',
      },
      {
        objetivo: 'input[type="color"]',
        titulo: 'Los colores de marca cambian todo el sitio',
        texto:
          'Eliges el principal y el resto —el color al pasar el ratón, al pulsar, los bordes— se calcula solo. Si eliges un color claro, el texto de los botones pasa a oscuro para que se siga leyendo.',
      },
      {
        titulo: 'El WhatsApp sale de aquí',
        texto:
          'El número que pongas en la red social «whatsapp» es el que usan el botón flotante, el pie y todos los botones verdes del sitio. Se cambia en un solo sitio.',
      },
      {
        titulo: 'Dos logotipos, no uno',
        texto:
          'El claro se usa sobre fondo oscuro —la portada— y el azul sobre fondo blanco. Si sólo cambias uno, se verá mal en la mitad de las páginas.',
      },
      GUARDAR,
    ],
  },

  medios: {
    titulo: 'Biblioteca de imágenes',
    pasos: [
      {
        titulo: 'Todas tus imágenes, en un sitio',
        texto:
          'Lo que subas aquí queda disponible en cualquier campo de imagen del panel.',
      },
      {
        objetivo: '.admin-head__actions',
        titulo: 'Subir una imagen',
        texto:
          'JPG, PNG, WEBP y GIF hasta 5 MB. Se comprueba el contenido real del archivo, no su extensión: renombrar un archivo no cuela.',
      },
      {
        titulo: 'Cómo usar una imagen',
        texto:
          'Copia su ruta con el botón de copiar y pégala en el campo de imagen que necesites. Sólo se pueden eliminar las que hayas subido desde aquí.',
      },
    ],
  },

  mensajes: {
    titulo: 'Mensajes recibidos',
    pasos: [
      {
        titulo: 'Lo que llega por el formulario de contacto',
        texto: 'Cada persona que rellena el formulario de tu web aparece aquí.',
      },
      {
        titulo: 'Eliminar es definitivo',
        texto: 'No hay papelera. Un mensaje borrado no se puede recuperar.',
      },
      {
        titulo: 'Si esperas mensajes y no llega ninguno',
        texto:
          'Revisa la pantalla de Correo: puede que el aviso por email no esté configurado y los mensajes estén llegando aquí sin avisarte.',
      },
    ],
  },

  correo: {
    titulo: 'Avisos por correo',
    pasos: [
      {
        titulo: 'A quién avisa el sitio',
        texto:
          'Cuando alguien rellena el formulario de contacto, aquí decides a qué buzón llega el aviso.',
      },
      {
        titulo: 'El remitente tiene que ser de tu dominio',
        texto:
          'Si pones una dirección de otro proveedor, muchos servidores marcarán el aviso como spam y no lo verás.',
      },
      {
        objetivo: '.admin-card:last-of-type',
        titulo: 'Pruébalo antes de darlo por bueno',
        texto:
          'El botón de prueba envía un correo real. Compruébalo en la bandeja antes de confiar en que funciona.',
      },
      GUARDAR,
    ],
  },

  contrasena: {
    titulo: 'Tu contraseña',
    pasos: [
      {
        titulo: 'Cambia la clave de acceso al panel',
        texto: 'Mínimo diez caracteres. Al cambiarla, tu sesión sigue abierta.',
      },
      {
        titulo: 'No se guarda en ningún sitio en claro',
        texto:
          'Sólo se guarda su huella cifrada, que no se puede revertir. Si la pierdes, hay que restablecerla desde el servidor: apúntala en un sitio seguro.',
      },
    ],
  },
}

/** La guía del editor de una página. Comparte clave con `paginas/:slug`. */
GUIAS['editor'] = {
  titulo: 'Editar una página',
  pasos: [
    {
      titulo: 'Una página es una lista de secciones',
      texto:
        'A la izquierda están sus bloques, en el mismo orden en que salen en la web. A la derecha, la página de verdad.',
    },
    {
      objetivo: '.adm-bloque__orden',
      titulo: 'El número dice en qué posición va',
      texto:
        'El 1 es lo primero que ve el visitante. Se resalta en azul el bloque que tienes abierto.',
    },
    {
      objetivo: '.adm-bloque__resumen',
      titulo: 'Pulsa un bloque para editarlo',
      texto:
        'Se abre debajo su formulario. Lo que escribas se ve al momento en la vista previa de la derecha.',
    },
    {
      objetivo: '.adm-bloque__asa',
      titulo: 'Arrastra para reordenar',
      texto:
        'Coge un bloque por este asa y suéltalo donde quieras. Cambiar el orden aquí cambia el orden en la página.',
    },
    {
      objetivo: '.adm-preview__anchos',
      titulo: 'Compruébalo en móvil',
      texto:
        'La vista previa no es una aproximación: monta la página real. Cambia el ancho para ver cómo queda en un teléfono antes de publicar.',
    },
    {
      objetivo: '.adm-anadir',
      titulo: 'Añadir una sección nueva',
      texto:
        'Se abre un catálogo con todos los tipos de bloque disponibles y lo que hace cada uno.',
    },
    GUARDAR,
  ],
}

/**
 * Qué guía toca según la ruta.
 *
 * `/admin/paginas/home` usa la del editor, no la del listado: son dos
 * pantallas distintas aunque compartan el primer tramo de la dirección.
 */
export function guiaDeLaRuta(pathname: string): { clave: string; guia: Guia } | null {
  const tramos = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)
  const clave = tramos[0] === 'paginas' && tramos[1] ? 'editor' : (tramos[0] ?? 'inicio')
  const guia = GUIAS[clave]

  return guia ? { clave, guia } : null
}
