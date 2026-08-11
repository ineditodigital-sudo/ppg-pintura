<?php

declare(strict_types=1);

namespace App\Repository;

/**
 * Única clase que toca el almacenamiento de contenido.
 *
 * Hoy lee los JSON de `backend/data`. Cuando llegue el CMS personalizado con
 * base de datos, se sustituye la implementación de estos métodos (o se crea un
 * `MySqlContentRepository` con la misma firma) sin tocar controladores,
 * router ni frontend.
 */
final class ContentRepository implements ContentStore
{
    /** Copias de seguridad que se conservan por archivo. */
    private const BACKUPS_KEPT = 10;

    public function __construct(private readonly string $dataDir)
    {
    }

    /** @return array<string, mixed>|null */
    public function site(): ?array
    {
        return $this->readJson('site.json');
    }

    /** @return array<string, mixed>|null */
    public function navigation(): ?array
    {
        return $this->readJson('navigation.json');
    }

    /** @return list<array<string, mixed>>|null */
    public function businessLines(): ?array
    {
        /** @var list<array<string, mixed>>|null $lines */
        $lines = $this->readJson('business-lines.json');

        return $lines;
    }

    /** @return list<array<string, mixed>>|null */
    public function markets(): ?array
    {
        /** @var list<array<string, mixed>>|null $markets */
        $markets = $this->readJson('markets.json');

        return $markets;
    }

    /**
     * Catálogo de pintura en polvo.
     *
     * Los 83 colores salen del PDF oficial de PPG: código, nombre, RAL, brillo
     * y el hexadecimal leído del propio vector del documento.
     *
     * @return array<string, mixed>|null
     */
    public function colors(): ?array
    {
        /** @var array<string, mixed>|null $colors */
        $colors = $this->readJson('colors.json');

        return $colors;
    }

    /**
     * Textos compartidos por las páginas que genera una plantilla.
     *
     * @return array<string, mixed>|null
     */
    public function templates(): ?array
    {
        /** @var array<string, mixed>|null $templates */
        $templates = $this->readJson('templates.json');

        return $templates;
    }

    /** @return list<array<string, mixed>>|null */
    public function featuredProducts(): ?array
    {
        $data = $this->readJson('featured-products.json');

        /** @var list<array<string, mixed>>|null $products */
        $products = $data['products'] ?? null;

        return $products;
    }

    /** @return array<string, mixed>|null */
    public function businessLine(string $slug): ?array
    {
        foreach ($this->businessLines() ?? [] as $line) {
            if (($line['slug'] ?? null) === $slug) {
                return $line;
            }
        }

        return null;
    }

    /** @return array<string, mixed>|null */
    public function page(string $slug): ?array
    {
        if (!$this->isSafeSlug($slug)) {
            return null;
        }

        return $this->readJson("pages/{$slug}.json");
    }

    /** @return list<string> */
    public function pageSlugs(): array
    {
        $files = glob($this->dataDir . '/pages/*.json') ?: [];

        return array_values(array_map(
            static fn (string $file): string => basename($file, '.json'),
            $files
        ));
    }

    /**
     * Persiste un mensaje de contacto como JSON Lines.
     * Es deliberadamente simple: el CMS lo reemplazará por una tabla.
     *
     * @param array<string, mixed> $payload
     */
    public function storeContactMessage(array $payload): bool
    {
        $storageDir = $this->storageDir();

        if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
            return false;
        }

        $line = json_encode(
            $payload + ['receivedAt' => date(DATE_ATOM)],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        if ($line === false) {
            return false;
        }

        return file_put_contents(
            $storageDir . '/contact-messages.jsonl',
            $line . PHP_EOL,
            FILE_APPEND | LOCK_EX
        ) !== false;
    }

    /* --- Escritura (panel de administración) ------------------------------ */

    /** @param array<string, mixed> $page */
    public function savePage(string $slug, array $page): bool
    {
        if (!$this->isSafeSlug($slug)) {
            return false;
        }

        return $this->writeJson("pages/{$slug}.json", $page);
    }

    public function deletePage(string $slug): bool
    {
        if (!$this->isSafeSlug($slug)) {
            return false;
        }

        $file = $this->dataDir . "/pages/{$slug}.json";

        if (!is_file($file)) {
            return false;
        }

        // Se conserva una copia antes de borrar: el borrado es reversible.
        $this->backup($file, "pages/{$slug}.json");

        return unlink($file);
    }

    /** @param array<string, mixed> $navigation */
    public function saveNavigation(array $navigation): bool
    {
        return $this->writeJson('navigation.json', $navigation);
    }

    /** @param array<string, mixed> $site */
    public function saveSite(array $site): bool
    {
        return $this->writeJson('site.json', $site);
    }

    /** @param list<array<string, mixed>> $lines */
    public function saveBusinessLines(array $lines): bool
    {
        return $this->writeJson('business-lines.json', $lines);
    }

    /** @param list<array<string, mixed>> $markets */
    public function saveMarkets(array $markets): bool
    {
        return $this->writeJson('markets.json', $markets);
    }

    /** @param array<string, mixed> $catalog */
    public function saveColors(array $catalog): bool
    {
        return $this->writeJson('colors.json', $catalog);
    }

    /** @param array<string, mixed> $templates */
    public function saveTemplates(array $templates): bool
    {
        return $this->writeJson('templates.json', $templates);
    }

    /**
     * El archivo envuelve la lista en «products»; el resto del sistema sólo
     * conoce la lista, así que el envoltorio se pone y se quita aquí.
     *
     * @param list<array<string, mixed>> $products
     */
    public function saveFeaturedProducts(array $products): bool
    {
        return $this->writeJson('featured-products.json', ['products' => $products]);
    }

    /* --- Bandeja de mensajes ---------------------------------------------- */

    /** @return list<array<string, mixed>> Más recientes primero. */
    public function listContactMessages(): array
    {
        $file = $this->storageDir() . '/contact-messages.jsonl';

        if (!is_file($file)) {
            return [];
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        $messages = [];

        foreach ($lines as $index => $line) {
            $decoded = json_decode($line, true);

            if (is_array($decoded)) {
                // El índice de línea sirve de identificador estable.
                $messages[] = ['id' => $index] + $decoded;
            }
        }

        return array_reverse($messages);
    }

    /** Reescribe el archivo sin la línea indicada. */
    public function deleteContactMessage(int $id): bool
    {
        $file = $this->storageDir() . '/contact-messages.jsonl';

        if (!is_file($file)) {
            return false;
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        if (!array_key_exists($id, $lines)) {
            return false;
        }

        unset($lines[$id]);
        $content = $lines === [] ? '' : implode(PHP_EOL, $lines) . PHP_EOL;

        return $this->atomicWrite($file, $content);
    }

    /* --- Internos de escritura -------------------------------------------- */

    private function storageDir(): string
    {
        return dirname($this->dataDir) . '/storage';
    }

    /**
     * Guarda respaldando primero y escribiendo de forma atómica.
     *
     * @param array<mixed> $data
     */
    private function writeJson(string $relativePath, array $data): bool
    {
        $file = $this->dataDir . '/' . $relativePath;
        $dir = dirname($file);

        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            return false;
        }

        if (is_file($file)) {
            $this->backup($file, $relativePath);
        }

        $json = json_encode(
            $data,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
        );

        if ($json === false) {
            return false;
        }

        return $this->atomicWrite($file, $json . PHP_EOL);
    }

    /**
     * Escribe en un temporal del mismo directorio y renombra.
     *
     * `rename` dentro del mismo sistema de archivos es atómico: el archivo
     * final nunca queda a medias, ni siquiera si el proceso muere. Es lo que
     * evita que un guardado interrumpido tumbe el sitio público.
     */
    private function atomicWrite(string $file, string $contents): bool
    {
        $temp = $file . '.tmp' . bin2hex(random_bytes(4));

        if (file_put_contents($temp, $contents, LOCK_EX) === false) {
            @unlink($temp);
            return false;
        }

        if (!rename($temp, $file)) {
            @unlink($temp);
            return false;
        }

        return true;
    }

    /** Copia el archivo a data/.backups y conserva sólo las 10 más recientes. */
    private function backup(string $file, string $relativePath): void
    {
        $backupDir = $this->dataDir . '/.backups';

        if (!is_dir($backupDir) && !mkdir($backupDir, 0775, true) && !is_dir($backupDir)) {
            return;
        }

        $name = str_replace(['/', '\\'], '_', $relativePath);
        $name = preg_replace('/\.json$/', '', $name) ?? $name;

        @copy($file, sprintf('%s/%s.%s.json', $backupDir, $name, date('Ymd-His')));

        $existing = glob($backupDir . '/' . $name . '.*.json') ?: [];

        if (count($existing) > self::BACKUPS_KEPT) {
            sort($existing); // El nombre lleva la marca de tiempo, así que ordena cronológicamente.

            foreach (array_slice($existing, 0, count($existing) - self::BACKUPS_KEPT) as $old) {
                @unlink($old);
            }
        }
    }

    /** @return array<mixed>|null */
    private function readJson(string $relativePath): ?array
    {
        $file = $this->dataDir . '/' . $relativePath;

        if (!is_file($file)) {
            return null;
        }

        $raw = file_get_contents($file);

        if ($raw === false) {
            return null;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : null;
    }

    /** Evita que un slug del cliente escape del directorio de páginas. */
    private function isSafeSlug(string $slug): bool
    {
        return preg_match('/^[a-z0-9][a-z0-9-]{0,80}$/', $slug) === 1;
    }
}
