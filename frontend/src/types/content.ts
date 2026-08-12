/**
 * Modelo de contenido por bloques.
 *
 * Refleja la arquitectura del sitio original (Kentico Kontent), donde cada
 * página es una lista ordenada de componentes tipados. Es también el contrato
 * que consumirá el CMS personalizado: añadir un tipo de bloque = añadir una
 * entrada aquí, un componente en `components/blocks` y una fila en el editor.
 */

export type Theme = 'light' | 'dark' | 'transparent' | 'brand'

export interface Link {
  label: string
  href: string
  external?: boolean
}

export interface Media {
  src: string
  alt: string
  width?: number
  height?: number
}

/* --- Bloques -------------------------------------------------------------- */

export interface HeroBlock {
  type: 'hero'
  eyebrow?: string
  title: string
  subtitle?: string
  image?: Media
  cta?: Link
  secondaryCta?: Link
  theme?: Theme
  /** Icono del juego de `lib/icons`, sólo en la variante `feature`. */
  icon?: string
  /**
   * `full` ocupa el ancho completo con imagen de fondo; `split` parte en dos;
   * `feature` es el panel de las landings de sector, pensado para fotos de
   * origen pequeño (ver `.hero--feature` en `blocks.css`).
   */
  variant?: 'full' | 'split' | 'compact' | 'feature'
}

export interface HeroSlide {
  eyebrow?: string
  title: string
  subtitle?: string
  cta?: Link
  secondaryCta?: Link
}

/** Hero con varias diapositivas. */
export interface HeroSliderBlock {
  type: 'heroSlider'
  slides: HeroSlide[]
  /** Segundos entre diapositivas. 0 desactiva el avance automático. */
  autoplaySeconds?: number
  /**
   * Vídeo de fondo y su póster. El fondo es común a todas las diapositivas
   * —cada una aporta su texto, no su imagen—, y estaba escrito dentro del
   * componente, así que cambiar el vídeo obligaba a tocar código.
   */
  video?: string
  poster?: Media
}

export interface RichTextBlock {
  type: 'richText'
  eyebrow?: string
  title?: string
  /** Cada entrada es un párrafo. */
  paragraphs: string[]
  align?: 'left' | 'center'
}

export interface CardItem {
  title: string
  description?: string
  image?: Media
  href?: string
  external?: boolean
  label?: string
  /** Rellena la tarjeta en color de marca para romper la rejilla. Usar una por grupo. */
  highlight?: boolean
  /** Nombre de icono de `lib/icons.tsx`. Se dibuja sobre el título. */
  icon?: string
}

export interface CardGridBlock {
  type: 'cardGrid'
  eyebrow?: string
  title?: string
  description?: string
  columns?: 2 | 3 | 4
  variant?: 'image' | 'overlay' | 'thumb' | 'text' | 'compact'
  theme?: Theme
  items: CardItem[]
}

export interface MediaItem {
  title: string
  label?: string
  thumbnail: Media
  href: string
}

export interface MediaGridBlock {
  type: 'mediaGrid'
  title?: string
  items: MediaItem[]
}

export interface ContentBannerBlock {
  type: 'contentBanner'
  eyebrow?: string
  title: string
  subtitle?: string
  body?: string
  image?: Media
  cta?: Link
  theme?: Theme
  /** Lado en el que se coloca la imagen. Las páginas alternan para dar ritmo. */
  imageSide?: 'left' | 'right'
  /**
   * `cover` recorta la imagen al marco apaisado; `natural` respeta su propia
   * proporción. Hace falta cuando la imagen lleva texto incrustado o es
   * vertical: recortada, se pierde justo lo que había que leer.
   */
  fit?: 'cover' | 'natural'
  children?: CardItem[]
}

export interface StatItem {
  value: string
  label: string
  detail?: string
  /** Igual que en las tarjetas: destaca un mosaico dentro del grupo. */
  highlight?: boolean
}

/** Vídeo destacado a dos columnas; el reproductor se abre en un diálogo. */
export interface VideoFeatureBlock {
  type: 'videoFeature'
  eyebrow?: string
  title: string
  paragraphs?: string[]
  /** URL de YouTube en cualquier formato: watch, youtu.be, embed o shorts. */
  video: string
  videoTitle?: string
  thumbnail: Media
  theme?: Theme
}

export interface StatGridBlock {
  type: 'statGrid'
  eyebrow?: string
  title?: string
  description?: string
  theme?: Theme
  items: StatItem[]
}

export interface TimelineEntry {
  period: string
  title?: string
  description: string
}

export interface TimelineBlock {
  type: 'timeline'
  eyebrow?: string
  title?: string
  entries: TimelineEntry[]
}

export interface CtaBannerBlock {
  type: 'ctaBanner'
  title: string
  description?: string
  cta: Link
  secondaryCta?: Link
  theme?: Theme
  /** Si se indica, sangra por la derecha del panel. */
  image?: Media
}

export interface LinkGroup {
  title: string
  description?: string
  links: Link[]
}

export interface LinkListBlock {
  type: 'linkList'
  eyebrow?: string
  title?: string
  description?: string
  columns?: 2 | 3 | 4
  groups: LinkGroup[]
}

export interface QuoteBlock {
  type: 'quote'
  quote: string
  author: string
  role?: string
}

export interface ContactDetail {
  label: string
  value: string
  href?: string
  note?: string
  /**
   * Más valores bajo la misma etiqueta, cada uno con su enlace. Los dos
   * correos alternos iban antes como un enlace y una nota en texto plano, así
   * que sólo uno se podía pulsar: el segundo había que copiarlo a mano.
   */
  extra?: { value: string; href?: string }[]
}

export interface ContactFormBlock {
  type: 'contactForm'
  title: string
  description?: string
  topics: string[]
  /** Texto de ejemplo dentro del campo de mensaje. */
  messagePlaceholder?: string
  /** Etiqueta del botón de envío. */
  submitLabel?: string
  /** Datos que se muestran junto al formulario, en la columna lateral. */
  aside?: {
    /** Logotipo del distribuidor, arriba del todo. */
    logo?: Media
    title?: string
    /** Línea secundaria: el distribuidor, debajo del rótulo de marca. */
    subtitle?: string
    details: ContactDetail[]
    addresses?: { label: string; value: string }[]
  }
}

export interface SpecItem {
  /** El término de la ficha: un sustrato, un acabado, una norma. */
  term: string
  /** Qué implica en la práctica. Es lo que evita que la lista sea decorativa. */
  note?: string
  icon?: string
}

/**
 * Ficha técnica: listado de términos con su nota.
 *
 * Existe porque una rejilla de tarjetas con dos palabras dentro se lee como
 * relleno. Aquí la unidad es la fila, no la tarjeta: entra el doble de
 * información en menos espacio y sin aire muerto.
 */
export interface SpecListBlock {
  type: 'specList'
  eyebrow?: string
  title?: string
  description?: string
  theme?: Theme
  columns?: 1 | 2
  items: SpecItem[]
}

export interface BrandItem {
  name: string
  logo: Media
  description?: string
  href?: string
}

/** Tira de marcas representadas. */
export interface BrandStripBlock {
  type: 'brandStrip'
  eyebrow?: string
  title?: string
  description?: string
  theme?: Theme
  brands: BrandItem[]
}

export interface Swatch {
  /** Color en hexadecimal, tal como se muestra en la muestra. */
  hex: string
  /** Referencia del color. Se usan códigos RAL, estándar público del sector. */
  code?: string
  name?: string
}

export interface FinishItem {
  name: string
  description?: string
}

/** Muestrario de color y acabados. */
export interface ColorShowcaseBlock {
  type: 'colorShowcase'
  eyebrow?: string
  title: string
  description?: string
  note?: string
  theme?: Theme
  finishes?: FinishItem[]
  swatches: Swatch[]
  cta?: Link
}

export type Block =
  | HeroBlock
  | HeroSliderBlock
  | RichTextBlock
  | CardGridBlock
  | MediaGridBlock
  | ContentBannerBlock
  | StatGridBlock
  | VideoFeatureBlock
  | TimelineBlock
  | CtaBannerBlock
  | LinkListBlock
  | QuoteBlock
  | ContactFormBlock
  | BrandStripBlock
  | ColorShowcaseBlock
  | SpecListBlock
  | ProductShowcaseBlock
  | ColorCarouselBlock
  | ColorCatalogBlock

/* --- Página y datos globales ---------------------------------------------- */

/** Una referencia del catálogo de pintura en polvo PPG. */
export interface CatalogColor {
  /** Código PPG, p. ej. `PCTH80109`. */
  code: string
  name: string
  /** Equivalencia RAL sin el prefijo, p. ej. `9016`. */
  ral: string | null
  /**
   * Nombre con el que PPG publica ese RAL en su catálogo, p. ej. `Traffic
   * White`. Nulo cuando PPG no lo nombra: se deja vacío antes que suponerlo.
   */
  ralName?: string | null
  /** `Gofrado`, `Texturizado`… Nulo si es liso. */
  finish: string | null
  /** Rango de brillo tal como lo publica el catálogo, p. ej. `80-100`. */
  gloss: string | null
  hex: string
  family: string
  textured: boolean
  /** Existencia en México. Lo marca el cliente desde el CMS. */
  stock: boolean
}

export interface ColorFamily {
  id: string
  name: string
  description: string
}

export interface ColorCatalog {
  families: ColorFamily[]
  colors: CatalogColor[]
  /**
   * Textos del recuadro que se abre al pulsar un color. Viven con el catálogo
   * y no con un bloque porque la ficha sale igual desde la carta completa y
   * desde la página de producto.
   */
  ficha?: {
    aviso?: string
    ctaFicha?: string
    ctaWhatsApp?: string
  }
  /** La banda oscura que abre /colores. */
  portada?: {
    eyebrow?: string
    title?: string
    /** Lleva `{n}`, que se sustituye por el número real de referencias. */
    entradilla?: string
    aviso?: string
    cta?: Link
  }
  /** Título y descripción de /colores para los buscadores. */
  seo?: Seo
}

export interface FeaturedProduct {
  slug: string
  name: string
  sku: string | null
  tagline: string
  description: string
  image: Media
  cta?: Link
}

/** Los tres productos que abren el sitio. Se leen de `featured-products.json`. */
export interface ProductShowcaseBlock {
  type: 'productShowcase'
}

/** Adelanto del catálogo de color en la portada. */
export interface ColorCarouselBlock {
  type: 'colorCarousel'
  eyebrow?: string
  title?: string
  /** Admite «{total}», que se sustituye por el número de colores del catálogo. */
  description?: string
  /** Texto del enlace al final. También admite «{total}». */
  linkLabel?: string
  linkHref?: string
  /** Cuántas muestras se adelantan. Por defecto 16. */
  count?: number
}

/**
 * La carta entera —pestañas, buscador y rejilla— dentro de una página.
 * A diferencia de `colorCarousel`, que es un adelanto de quince muestras, aquí
 * se puede buscar y filtrar sin salir de la página.
 */
export interface ColorCatalogBlock {
  type: 'colorCatalog'
}

export interface Seo {
  title: string
  description: string
  /** Pide a los buscadores que no indexen esta página. */
  noindex?: boolean
}

export interface Breadcrumb {
  label: string
  href?: string
}

export interface Page {
  slug: string
  seo: Seo
  breadcrumbs?: Breadcrumb[]
  blocks: Block[]
}

export interface NavItem {
  label: string
  href?: string
  /** Cuando trae hijos, el header lo abre como panel del mega-menú. */
  children?: NavItem[]
  description?: string
  featured?: boolean
}

export interface Navigation {
  main: NavItem[]
  cta: Link
  locale: string
  footer: LinkGroup[]
  legal: Link[]
}

export interface SocialLink {
  network: string
  href: string
}

export interface Site {
  /** Marca que encabeza el sitio: PPG. */
  name: string
  tagline: string
  /**
   * Colores de marca, editables desde Ajustes.
   *
   * Se piden dos y el resto se deriva —ver `lib/tema.ts`—. No se llama `theme`
   * para no confundirlo con el `Theme` de los bloques, que elige entre fondo
   * claro, oscuro o de marca y es otra cosa. Si falta, mandan los valores de
   * `tokens.css`.
   */
  brandColors?: {
    /** Color principal: botones, enlaces y acentos. */
    brand?: string
    /** Fondo de las bandas oscuras. */
    dark?: string
  }
  /** Texto de la página de error. */
  notFound?: {
    eyebrow?: string
    title?: string
    body?: string
    seoTitle?: string
    seoDescription?: string
    cta?: Link
    ctaSecundario?: Link
  }
  logo: Media
  /** Versión calada en blanco, para cabecera y bloques oscuros. */
  logoLight?: Media
  footerLogo: Media
  /**
   * Distribuidor autorizado.
   *
   * El sitio es de PPG; Coating Systems aparece como quien lo representa en
   * México, no como la marca del sitio. Va en un sello discreto, no en el
   * lugar del logotipo.
   */
  distributor?: {
    name: string
    legalName?: string
    logo?: Media
    label?: string
  }
  social: SocialLink[]
  copyright: string
}

export interface MarketRequirement {
  title: string
  description: string
  icon?: string
}

/** Sector de mercado con su propia página. */
export interface Market {
  slug: string
  name: string
  headline: string
  description: string
  image: Media
  icon?: string
  sustratos: string[]
  exigencias: MarketRequirement[]
  recomendado: string
}

export interface BusinessLine {
  slug: string
  name: string
  headline: string
  description: string
  image: Media
  href: string
  /**
   * Cifras propias de la línea. Estaban escritas en la plantilla, así que las
   * tres enseñaban las mismas —«25 kg por caja» salía también en pintura
   * líquida—. Si una línea no las trae, su página no monta el bloque: antes
   * un hueco que un dato prestado de otra.
   */
  stats?: StatItem[]
  /**
   * Monta la carta de color en la página de la línea. Sólo lo lleva la de
   * pintura en polvo: las 83 referencias son de ese catálogo, y enseñarlas en
   * pre tratamientos —que son químicos de limpieza, no acabados— sería
   * sencillamente falso.
   */
  showColors?: boolean
}

/**
 * Textos que comparten las páginas generadas por una plantilla.
 *
 * Las nueve páginas de producto y sector no son documentos: las compone
 * `BusinessLinePage` y `MarketPage` a partir de los datos de cada línea o
 * sector. Todo lo que las rodea —antetítulos, títulos de sección, las tres
 * tarjetas de servicio, el cierre— estaba escrito en el componente, así que
 * existía en el sitio publicado pero no en el panel.
 *
 * Cada campo es opcional: si falta, la página usa su valor por defecto. Así un
 * documento a medio llenar no deja nueve páginas rotas.
 */
export interface PlantillaLineas {
  /** Título en Google. Lleva `{nombre}`, el de la línea. */
  seoTitle?: string
  heroCta?: Link
  comoTrabajamos?: {
    eyebrow?: string
    title?: string
    items?: { title: string; description: string; href?: string }[]
  }
  otras?: { eyebrow?: string; title?: string }
  cierre?: { title?: string; description?: string; cta?: Link }
}

export interface PlantillaMercados {
  /** Título en Google. Lleva `{nombre}`, el del sector. */
  seoTitle?: string
  heroCta?: Link
  exige?: {
    eyebrow?: string
    /** Lleva `{sector}`, que se sustituye por el nombre del sector. */
    title?: string
    /** Lleva `{exigencias}`, que se sustituye por las del propio sector. */
    body?: string
    image?: Media
  }
  sustratos?: {
    eyebrow?: string
    title?: string
    description?: string
    /**
     * Qué implica recubrir cada material. Se busca por `material` sin
     * distinguir mayúsculas: el nombre lo escribe quien edita el sector.
     */
    fichas?: { material: string; icon?: string; note: string }[]
  }
  suministro?: {
    eyebrow?: string
    title?: string
    body?: string
    image?: Media
    cta?: Link
  }
  recomendado?: { eyebrow?: string; cierre?: string }
  otros?: { eyebrow?: string; title?: string }
  cierre?: { title?: string; description?: string; image?: Media; cta?: Link }
}

export interface Templates {
  lineas?: PlantillaLineas
  mercados?: PlantillaMercados
}
