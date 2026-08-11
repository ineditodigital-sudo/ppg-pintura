<?php

declare(strict_types=1);

namespace App\Validator;

/**
 * Valida el contenido antes de escribirlo a disco.
 *
 * Es la barrera que impide que el panel deje una página en un estado que el
 * frontend no sepa renderizar. Si algo no cuadra, la petición devuelve 422 y
 * el archivo en disco no se toca.
 */
final class ContentValidator
{
    /** Minúsculas, números y guiones: lo que puede viajar en una URL. */
    private const SLUG = '/^[a-z0-9][a-z0-9-]{0,80}$/';

    /** Tipos de bloque que `BlockRenderer.tsx` sabe renderizar. */
    private const BLOCK_TYPES = [
        'hero',
        'heroSlider',
        'richText',
        'cardGrid',
        'mediaGrid',
        'contentBanner',
        'statGrid',
        'videoFeature',
        'timeline',
        'ctaBanner',
        'linkList',
        'quote',
        'contactForm',
        'brandStrip',
        'colorShowcase',
        'specList',
        'productShowcase',
        'colorCarousel',
        'colorCatalog',
    ];

    /** Campos obligatorios por tipo de bloque. */
    private const REQUIRED = [
        'hero' => ['title'],
        'heroSlider' => ['slides'],
        'richText' => ['paragraphs'],
        'cardGrid' => ['items'],
        'mediaGrid' => ['items'],
        'contentBanner' => ['title'],
        'statGrid' => ['items'],
        'videoFeature' => ['title', 'video', 'thumbnail'],
        'timeline' => ['entries'],
        'ctaBanner' => ['title', 'cta'],
        'linkList' => ['groups'],
        'quote' => ['quote', 'author'],
        'contactForm' => ['title', 'topics'],
        'brandStrip' => ['brands'],
        'colorShowcase' => ['title', 'swatches'],
        'specList' => ['items'],
    ];

    /** Campos que deben ser una lista no vacía. */
    private const LIST_FIELDS = [
        'heroSlider' => ['slides'],
        'richText' => ['paragraphs'],
        'cardGrid' => ['items'],
        'mediaGrid' => ['items'],
        'statGrid' => ['items'],
        'videoFeature' => ['title', 'video', 'thumbnail'],
        'timeline' => ['entries'],
        'linkList' => ['groups'],
        'contactForm' => ['topics'],
        'brandStrip' => ['brands'],
        'colorShowcase' => ['swatches', 'finishes'],
        'specList' => ['items'],
    ];

    /**
     * @param array<string, mixed> $page
     * @return list<string> Lista de errores; vacía significa válido.
     */
    public function validatePage(array $page): array
    {
        $errors = [];

        $slug = $page['slug'] ?? null;

        if (!is_string($slug) || preg_match(self::SLUG, $slug) !== 1) {
            $errors[] = 'El slug debe ser minúsculas, números y guiones (máximo 81 caracteres).';
        }

        $seo = $page['seo'] ?? null;

        if (!is_array($seo)) {
            $errors[] = 'Falta el bloque seo.';
        } else {
            if (!is_string($seo['title'] ?? null) || trim((string) $seo['title']) === '') {
                $errors[] = 'seo.title es obligatorio.';
            }
            if (!is_string($seo['description'] ?? null) || trim((string) $seo['description']) === '') {
                $errors[] = 'seo.description es obligatorio.';
            }
        }

        $blocks = $page['blocks'] ?? null;

        if (!is_array($blocks) || !array_is_list($blocks)) {
            $errors[] = 'blocks debe ser una lista.';

            return $errors;
        }

        if ($blocks === []) {
            $errors[] = 'La página debe tener al menos un bloque.';
        }

        foreach ($blocks as $index => $block) {
            $errors = [...$errors, ...$this->validateBlock($block, $index)];
        }

        return $errors;
    }

    /**
     * @param mixed $block
     * @return list<string>
     */
    private function validateBlock(mixed $block, int $index): array
    {
        $position = $index + 1;

        if (!is_array($block)) {
            return ["El bloque {$position} no es un objeto."];
        }

        $type = $block['type'] ?? null;

        if (!is_string($type) || !in_array($type, self::BLOCK_TYPES, true)) {
            $shown = is_string($type) ? $type : gettype($type);

            return ["El bloque {$position} tiene un tipo desconocido: «{$shown}»."];
        }

        $errors = [];

        foreach (self::REQUIRED[$type] ?? [] as $field) {
            $value = $block[$field] ?? null;

            if ($value === null || $value === '' || $value === []) {
                $errors[] = "El bloque {$position} ({$type}) necesita el campo «{$field}».";
            }
        }

        foreach (self::LIST_FIELDS[$type] ?? [] as $field) {
            $value = $block[$field] ?? null;

            if ($value !== null && (!is_array($value) || !array_is_list($value))) {
                $errors[] = "En el bloque {$position} ({$type}), «{$field}» debe ser una lista.";
            }
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $navigation
     * @return list<string>
     */
    public function validateNavigation(array $navigation): array
    {
        $errors = [];

        foreach (['main', 'footer', 'legal'] as $key) {
            $value = $navigation[$key] ?? null;

            if (!is_array($value) || !array_is_list($value)) {
                $errors[] = "«{$key}» debe ser una lista.";
            }
        }

        $cta = $navigation['cta'] ?? null;

        if (!is_array($cta) || !is_string($cta['label'] ?? null) || !is_string($cta['href'] ?? null)) {
            $errors[] = 'cta necesita «label» y «href».';
        }

        if (!is_string($navigation['locale'] ?? null)) {
            $errors[] = 'Falta «locale».';
        }

        if (is_array($navigation['main'] ?? null)) {
            foreach ($navigation['main'] as $i => $item) {
                if (!is_array($item) || !is_string($item['label'] ?? null) || trim((string) $item['label']) === '') {
                    $errors[] = 'Cada entrada del menú necesita una etiqueta (posición ' . ($i + 1) . ').';
                }
            }
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $site
     * @return list<string>
     */
    public function validateSite(array $site): array
    {
        $errors = [];

        foreach (['name', 'tagline', 'copyright'] as $key) {
            if (!is_string($site[$key] ?? null) || trim((string) $site[$key]) === '') {
                $errors[] = "«{$key}» es obligatorio.";
            }
        }

        foreach (['logo', 'footerLogo'] as $key) {
            $media = $site[$key] ?? null;

            if (!is_array($media) || !is_string($media['src'] ?? null) || trim((string) $media['src']) === '') {
                $errors[] = "«{$key}» necesita un «src».";
            }
        }

        $social = $site['social'] ?? null;

        if (!is_array($social) || !array_is_list($social)) {
            $errors[] = '«social» debe ser una lista.';

            return $errors;
        }

        // No se valida el nombre de la red contra una lista cerrada: el
        // catálogo vive en el frontend y una red desconocida degrada a un
        // icono genérico, no rompe nada. Sí se exige que ambos campos estén.
        foreach ($social as $index => $item) {
            $position = $index + 1;

            if (!is_array($item)) {
                $errors[] = "La red social {$position} no es un objeto.";
                continue;
            }

            if (!is_string($item['network'] ?? null) || trim((string) $item['network']) === '') {
                $errors[] = "La red social {$position} necesita un nombre de red.";
            }

            $href = $item['href'] ?? null;

            if (!is_string($href) || trim($href) === '') {
                $errors[] = "La red social {$position} necesita una URL.";
            } elseif (preg_match('#^https?://#i', $href) !== 1) {
                $errors[] = "La URL de la red social {$position} debe empezar por http:// o https://.";
            }
        }

        return $errors;
    }

    /**
     * @param mixed $lines
     * @return list<string>
     */
    public function validateBusinessLines(mixed $lines): array
    {
        if (!is_array($lines) || !array_is_list($lines)) {
            return ['Las líneas de negocio deben ser una lista.'];
        }

        if ($lines === []) {
            return ['Debe haber al menos una línea de negocio.'];
        }

        $errors = [];
        $seen = [];

        foreach ($lines as $index => $line) {
            $position = $index + 1;

            if (!is_array($line)) {
                $errors[] = "La línea {$position} no es un objeto.";
                continue;
            }

            $slug = $line['slug'] ?? null;

            if (!is_string($slug) || preg_match(self::SLUG, $slug) !== 1) {
                $errors[] = "La línea {$position} necesita un slug válido.";
            } elseif (in_array($slug, $seen, true)) {
                $errors[] = "El slug «{$slug}» está repetido.";
            } else {
                $seen[] = $slug;
            }

            foreach (['name', 'headline', 'description'] as $field) {
                if (!is_string($line[$field] ?? null) || trim((string) $line[$field]) === '') {
                    $errors[] = "La línea {$position} necesita «{$field}».";
                }
            }

            // Las cifras son opcionales: una línea sin ellas no monta el
            // bloque en su página. Pero si vienen, tienen que estar completas.
            $stats = $line['stats'] ?? null;

            if ($stats !== null) {
                if (!is_array($stats) || !array_is_list($stats)) {
                    $errors[] = "Las cifras de la línea {$position} deben ser una lista.";
                    continue;
                }

                foreach ($stats as $j => $stat) {
                    $cifra = $j + 1;

                    if (!is_array($stat)) {
                        $errors[] = "La cifra {$cifra} de la línea {$position} no es un objeto.";
                        continue;
                    }

                    foreach (['value', 'label'] as $field) {
                        if (!is_string($stat[$field] ?? null) || trim((string) $stat[$field]) === '') {
                            $errors[] = "La cifra {$cifra} de la línea {$position} necesita «{$field}».";
                        }
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Sectores de mercado: alimentan `/mercados` y cada `/mercados/{slug}`.
     *
     * @param mixed $markets
     * @return list<string>
     */
    public function validateMarkets(mixed $markets): array
    {
        if (!is_array($markets) || !array_is_list($markets)) {
            return ['Los mercados deben ser una lista.'];
        }

        if ($markets === []) {
            return ['Debe haber al menos un mercado.'];
        }

        $errors = [];
        $seen = [];

        foreach ($markets as $index => $market) {
            $position = $index + 1;

            if (!is_array($market)) {
                $errors[] = "El mercado {$position} no es un objeto.";
                continue;
            }

            $slug = $market['slug'] ?? null;

            if (!is_string($slug) || preg_match(self::SLUG, $slug) !== 1) {
                $errors[] = "El mercado {$position} necesita un slug válido.";
            } elseif (in_array($slug, $seen, true)) {
                $errors[] = "El slug «{$slug}» está repetido.";
            } else {
                $seen[] = $slug;
            }

            $name = $this->label($slug, $position);

            foreach (['name', 'headline', 'description', 'recomendado'] as $field) {
                if (!is_string($market[$field] ?? null) || trim((string) $market[$field]) === '') {
                    $errors[] = "El mercado {$name} necesita «{$field}».";
                }
            }

            $image = $market['image'] ?? null;

            if (!is_array($image) || !is_string($image['src'] ?? null) || trim((string) $image['src']) === '') {
                $errors[] = "El mercado {$name} necesita una imagen.";
            }

            $errors = [
                ...$errors,
                ...$this->validateStringList($market['sustratos'] ?? null, "Los sustratos del mercado {$name}"),
            ];

            $exigencias = $market['exigencias'] ?? null;

            if (!is_array($exigencias) || !array_is_list($exigencias) || $exigencias === []) {
                $errors[] = "El mercado {$name} necesita al menos una exigencia.";
                continue;
            }

            foreach ($exigencias as $i => $exigencia) {
                $ordinal = $i + 1;

                if (
                    !is_array($exigencia)
                    || !is_string($exigencia['title'] ?? null)
                    || trim((string) $exigencia['title']) === ''
                    || !is_string($exigencia['description'] ?? null)
                    || trim((string) $exigencia['description']) === ''
                ) {
                    $errors[] = "La exigencia {$ordinal} del mercado {$name} necesita título y descripción.";
                }
            }
        }

        return $errors;
    }

    /**
     * Carta de color: familias y referencias de pintura en polvo.
     *
     * @param mixed $catalog
     * @return list<string>
     */
    public function validateColors(mixed $catalog): array
    {
        if (!is_array($catalog) || array_is_list($catalog)) {
            return ['El catálogo debe ser un objeto con «families» y «colors».'];
        }

        $families = $catalog['families'] ?? null;
        $colors = $catalog['colors'] ?? null;

        if (!is_array($families) || !array_is_list($families) || $families === []) {
            return ['Debe haber al menos una familia de color.'];
        }

        if (!is_array($colors) || !array_is_list($colors) || $colors === []) {
            return ['Debe haber al menos una referencia de color.'];
        }

        $errors = [];
        $ids = [];

        foreach ($families as $index => $family) {
            $position = $index + 1;

            if (!is_array($family)) {
                $errors[] = "La familia {$position} no es un objeto.";
                continue;
            }

            $id = $family['id'] ?? null;

            if (!is_string($id) || preg_match(self::SLUG, $id) !== 1) {
                $errors[] = "La familia {$position} necesita un identificador de minúsculas y guiones.";
            } elseif (in_array($id, $ids, true)) {
                $errors[] = "El identificador de familia «{$id}» está repetido.";
            } else {
                $ids[] = $id;
            }

            if (!is_string($family['name'] ?? null) || trim((string) $family['name']) === '') {
                $errors[] = "La familia {$position} necesita un nombre.";
            }
        }

        $codes = [];

        foreach ($colors as $index => $color) {
            $position = $index + 1;

            if (!is_array($color)) {
                $errors[] = "La referencia {$position} no es un objeto.";
                continue;
            }

            $code = $color['code'] ?? null;

            if (!is_string($code) || trim($code) === '') {
                $errors[] = "La referencia {$position} necesita un código.";
                $code = null;
            } elseif (in_array($code, $codes, true)) {
                $errors[] = "El código «{$code}» está repetido.";
            } else {
                $codes[] = $code;
            }

            $name = $code ?? (string) $position;

            if (!is_string($color['name'] ?? null) || trim((string) $color['name']) === '') {
                $errors[] = "La referencia {$name} necesita un nombre.";
            }

            if (!is_string($color['hex'] ?? null) || preg_match('/^#[0-9a-f]{6}$/i', (string) $color['hex']) !== 1) {
                $errors[] = "La referencia {$name} necesita un hexadecimal de seis dígitos, como #A12222.";
            }

            // La familia se comprueba contra las de arriba: una referencia
            // huérfana no saldría en ninguna pestaña de la carta y se daría
            // por perdida sin que nada avisara.
            if (!is_string($color['family'] ?? null) || !in_array($color['family'], $ids, true)) {
                $errors[] = "La referencia {$name} apunta a una familia que no existe.";
            }

            foreach (['textured', 'stock'] as $flag) {
                if (array_key_exists($flag, $color) && !is_bool($color[$flag])) {
                    $errors[] = "En la referencia {$name}, «{$flag}» debe ser sí o no.";
                }
            }

            foreach (['ral', 'ralName', 'finish', 'gloss'] as $optional) {
                $value = $color[$optional] ?? null;

                if ($value !== null && !is_string($value)) {
                    $errors[] = "En la referencia {$name}, «{$optional}» debe ser texto o quedar vacío.";
                }
            }
        }

        return $errors;
    }

    /**
     * Productos destacados de la portada (bloque `productShowcase`).
     *
     * @param mixed $products
     * @return list<string>
     */
    /**
     * Textos compartidos de las páginas de plantilla.
     *
     * La validación es deliberadamente laxa: aquí no hay nada estructural que
     * romper —ni slugs, ni referencias entre documentos—, sólo texto. Lo único
     * que se exige es que las dos secciones sean objetos y que un texto que se
     * escriba sea texto; si una clave falta, la página cae en su valor por
     * defecto. Rechazar el guardado entero porque falta un antetítulo dejaría
     * al cliente sin poder arreglar el que sí quiere cambiar.
     *
     * @param mixed $templates
     * @return list<string>
     */
    public function validateTemplates(mixed $templates): array
    {
        if (!is_array($templates)) {
            return ['Los textos de las plantillas deben ser un objeto.'];
        }

        $errors = [];

        foreach (['lineas', 'mercados'] as $seccion) {
            if (!array_key_exists($seccion, $templates)) {
                continue;
            }

            if (!is_array($templates[$seccion])) {
                $errors[] = "«{$seccion}» debe ser un objeto.";
            }
        }

        // El marcador {sector} es el que sustituye el nombre del mercado. Sin
        // él la frase queda coja en las seis páginas a la vez, así que se
        // avisa antes de guardar y no después de publicarlo.
        $titulo = $templates['mercados']['exige']['title'] ?? null;

        if (is_string($titulo) && $titulo !== '' && !str_contains($titulo, '{sector}')) {
            $errors[] = 'El título de «Qué exige este sector» debe incluir {sector}, que es donde se escribe el nombre del sector.';
        }

        $cuerpo = $templates['mercados']['exige']['body'] ?? null;

        if (is_string($cuerpo) && $cuerpo !== '' && !str_contains($cuerpo, '{exigencias}')) {
            $errors[] = 'El texto de «Qué exige este sector» debe incluir {exigencias}, que es donde se enumeran las de cada sector.';
        }

        return $errors;
    }

    public function validateFeaturedProducts(mixed $products): array
    {
        if (!is_array($products) || !array_is_list($products)) {
            return ['Los productos destacados deben ser una lista.'];
        }

        if ($products === []) {
            return ['Debe haber al menos un producto destacado.'];
        }

        $errors = [];
        $seen = [];

        foreach ($products as $index => $product) {
            $position = $index + 1;

            if (!is_array($product)) {
                $errors[] = "El producto {$position} no es un objeto.";
                continue;
            }

            $slug = $product['slug'] ?? null;

            if (!is_string($slug) || preg_match(self::SLUG, $slug) !== 1) {
                $errors[] = "El producto {$position} necesita un slug válido.";
            } elseif (in_array($slug, $seen, true)) {
                $errors[] = "El slug «{$slug}» está repetido.";
            } else {
                $seen[] = $slug;
            }

            $name = $this->label($slug, $position);

            foreach (['name', 'tagline', 'description'] as $field) {
                if (!is_string($product[$field] ?? null) || trim((string) $product[$field]) === '') {
                    $errors[] = "El producto {$name} necesita «{$field}».";
                }
            }

            $image = $product['image'] ?? null;

            if (!is_array($image) || !is_string($image['src'] ?? null) || trim((string) $image['src']) === '') {
                $errors[] = "El producto {$name} necesita una imagen.";
            }

            $cta = $product['cta'] ?? null;

            if (
                $cta !== null
                && (!is_array($cta) || !is_string($cta['label'] ?? null) || !is_string($cta['href'] ?? null))
            ) {
                $errors[] = "El botón del producto {$name} necesita texto y destino.";
            }
        }

        return $errors;
    }

    /* --- Utilidades --------------------------------------------------------- */

    /** Nombra el elemento por su slug si lo tiene; si no, por su posición. */
    private function label(mixed $slug, int $position): string
    {
        return is_string($slug) && trim($slug) !== '' ? "«{$slug}»" : (string) $position;
    }

    /**
     * Lista de textos opcional: si viene, no admite huecos.
     *
     * @return list<string>
     */
    private function validateStringList(mixed $value, string $etiqueta): array
    {
        if ($value === null) {
            return [];
        }

        if (!is_array($value) || !array_is_list($value)) {
            return ["{$etiqueta} deben ser una lista."];
        }

        foreach ($value as $item) {
            if (!is_string($item) || trim($item) === '') {
                return ["{$etiqueta} no pueden tener entradas vacías."];
            }
        }

        return [];
    }
}
