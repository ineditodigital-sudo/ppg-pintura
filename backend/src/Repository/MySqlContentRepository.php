<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;

/**
 * Contenido en MySQL. Misma firma pública que `ContentRepository`.
 *
 * Los controladores, el router y el frontend no distinguen cuál está en uso:
 * el front controller elige uno u otro según haya o no configuración de base
 * de datos, y todo lo demás sigue igual. Era el objetivo de que
 * `ContentRepository` fuera la única clase que tocaba el almacenamiento.
 *
 * Cada documento se guarda entero como JSON bajo una clave —`site`,
 * `pages/home`—, con su historial en otra tabla. Ver `Database::migrar()` para
 * por qué el modelo es documental y no una tabla por tipo de bloque.
 */
final class MySqlContentRepository implements ContentStore
{
    /** Versiones que se conservan por documento, como en los archivos. */
    private const HISTORIAL = 10;

    public function __construct(private readonly PDO $db)
    {
    }

    /* --- Lectura ---------------------------------------------------------- */

    /** @return array<string, mixed>|null */
    public function site(): ?array
    {
        return $this->leer('site');
    }

    /** @return array<string, mixed>|null */
    public function navigation(): ?array
    {
        return $this->leer('navigation');
    }

    /** @return list<array<string, mixed>>|null */
    public function businessLines(): ?array
    {
        /** @var list<array<string, mixed>>|null $lines */
        $lines = $this->leer('business-lines');

        return $lines;
    }

    /** @return list<array<string, mixed>>|null */
    public function markets(): ?array
    {
        /** @var list<array<string, mixed>>|null $markets */
        $markets = $this->leer('markets');

        return $markets;
    }

    /** @return array<string, mixed>|null */
    public function colors(): ?array
    {
        return $this->leer('colors');
    }

    /** @return list<array<string, mixed>>|null */
    public function featuredProducts(): ?array
    {
        $datos = $this->leer('featured-products');

        if ($datos === null) {
            return null;
        }

        // El archivo envuelve la lista en `products`; la API la devuelve
        // desenvuelta. Se replica aquí para que el contrato no cambie.
        /** @var list<array<string, mixed>> $lista */
        $lista = $datos['products'] ?? $datos;

        return $lista;
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
        if (!$this->slugSeguro($slug)) {
            return null;
        }

        return $this->leer("pages/{$slug}");
    }

    /** @return list<string> */
    public function pageSlugs(): array
    {
        $stmt = $this->db->query("SELECT clave FROM contenido WHERE clave LIKE 'pages/%' ORDER BY clave");
        $slugs = [];

        foreach ($stmt?->fetchAll() ?: [] as $fila) {
            $slugs[] = substr((string) $fila['clave'], strlen('pages/'));
        }

        return $slugs;
    }

    /* --- Escritura -------------------------------------------------------- */

    /** @param array<string, mixed> $page */
    public function savePage(string $slug, array $page): bool
    {
        if (!$this->slugSeguro($slug)) {
            return false;
        }

        return $this->guardar("pages/{$slug}", $page);
    }

    public function deletePage(string $slug): bool
    {
        if (!$this->slugSeguro($slug)) {
            return false;
        }

        $actual = $this->leer("pages/{$slug}");

        if ($actual === null) {
            return false;
        }

        // Igual que en archivos: se historia antes de borrar, así el borrado
        // sigue siendo reversible desde la base de datos.
        $this->historiar("pages/{$slug}", $actual);

        $stmt = $this->db->prepare('DELETE FROM contenido WHERE clave = ?');

        return $stmt->execute(["pages/{$slug}"]);
    }

    /** @param array<string, mixed> $navigation */
    public function saveNavigation(array $navigation): bool
    {
        return $this->guardar('navigation', $navigation);
    }

    /** @param array<string, mixed> $site */
    public function saveSite(array $site): bool
    {
        return $this->guardar('site', $site);
    }

    /** @param list<array<string, mixed>> $lines */
    public function saveBusinessLines(array $lines): bool
    {
        return $this->guardar('business-lines', $lines);
    }

    /** @param list<array<string, mixed>> $markets */
    public function saveMarkets(array $markets): bool
    {
        return $this->guardar('markets', $markets);
    }

    /** @param array<string, mixed> $catalog */
    public function saveColors(array $catalog): bool
    {
        return $this->guardar('colors', $catalog);
    }

    /** @param list<array<string, mixed>> $products */
    public function saveFeaturedProducts(array $products): bool
    {
        return $this->guardar('featured-products', ['products' => $products]);
    }

    /* --- Mensajes de contacto --------------------------------------------- */

    /** @param array<string, mixed> $payload */
    public function storeContactMessage(array $payload): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO mensajes (nombre, email, empresa, asunto, mensaje, recibido, ip)
             VALUES (?, ?, ?, ?, ?, NOW(), ?)'
        );

        return $stmt->execute([
            (string) ($payload['name'] ?? ''),
            (string) ($payload['email'] ?? ''),
            isset($payload['company']) ? (string) $payload['company'] : null,
            (string) ($payload['topic'] ?? ''),
            (string) ($payload['message'] ?? ''),
            isset($payload['ip']) ? (string) $payload['ip'] : null,
        ]);
    }

    /** @return list<array<string, mixed>> */
    public function listContactMessages(): array
    {
        $stmt = $this->db->query('SELECT * FROM mensajes ORDER BY recibido DESC, id DESC');
        $salida = [];

        foreach ($stmt?->fetchAll() ?: [] as $fila) {
            $salida[] = [
                'id' => (int) $fila['id'],
                'name' => $fila['nombre'],
                'email' => $fila['email'],
                'company' => $fila['empresa'],
                'topic' => $fila['asunto'],
                'message' => $fila['mensaje'],
                'receivedAt' => date(DATE_ATOM, strtotime((string) $fila['recibido'])),
            ];
        }

        return $salida;
    }

    public function deleteContactMessage(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM mensajes WHERE id = ?');
        $stmt->execute([$id]);

        return $stmt->rowCount() > 0;
    }

    /* --- Interno ----------------------------------------------------------- */

    /** Minúsculas, números y guiones: lo mismo que exige el validador. */
    private function slugSeguro(string $slug): bool
    {
        return preg_match('/^[a-z0-9][a-z0-9-]{0,80}$/', $slug) === 1;
    }

    /** @return array<string, mixed>|list<mixed>|null */
    private function leer(string $clave): ?array
    {
        $stmt = $this->db->prepare('SELECT documento FROM contenido WHERE clave = ?');
        $stmt->execute([$clave]);
        $doc = $stmt->fetchColumn();

        if (!is_string($doc)) {
            return null;
        }

        $datos = json_decode($doc, true);

        return is_array($datos) ? $datos : null;
    }

    /** @param array<string, mixed>|list<mixed> $datos */
    private function guardar(string $clave, array $datos): bool
    {
        $json = json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        if ($json === false) {
            return false;
        }

        // Historial y escritura en la misma transacción: si algo falla no queda
        // una versión historiada de un guardado que nunca ocurrió.
        $this->db->beginTransaction();

        try {
            $previo = $this->leer($clave);

            if ($previo !== null) {
                $this->historiar($clave, $previo);
            }

            // Actualizar y, si no había fila, insertar. Se prefiere a
            // `ON DUPLICATE KEY UPDATE` —que es sintaxis exclusiva de MySQL—
            // porque así este método se puede ejercitar contra SQLite en las
            // pruebas. Va dentro de la transacción, así que no hay hueco entre
            // el UPDATE y el INSERT en el que otro escritor se cuele.
            $update = $this->db->prepare(
                'UPDATE contenido SET documento = ?, actualizado = NOW() WHERE clave = ?'
            );
            $update->execute([$json, $clave]);

            if ($update->rowCount() === 0 && $previo === null) {
                $this->db->prepare(
                    'INSERT INTO contenido (clave, documento, actualizado) VALUES (?, ?, NOW())'
                )->execute([$clave, $json]);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            error_log('MySQL guardar ' . $clave . ': ' . $e->getMessage());

            return false;
        }

        return true;
    }

    /** @param array<string, mixed>|list<mixed> $datos */
    private function historiar(string $clave, array $datos): void
    {
        $json = json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            return;
        }

        $this->db->prepare(
            'INSERT INTO contenido_historial (clave, documento, guardado) VALUES (?, ?, NOW())'
        )->execute([$clave, $json]);

        // Se podan las sobrantes. `DELETE ... LIMIT` con subconsulta sobre la
        // misma tabla no lo admite MySQL, así que se resuelve en dos pasos.
        $ids = $this->db->prepare(
            'SELECT id FROM contenido_historial WHERE clave = ? ORDER BY guardado DESC, id DESC LIMIT 1000 OFFSET ?'
        );
        $ids->execute([$clave, self::HISTORIAL]);
        $sobrantes = $ids->fetchAll(PDO::FETCH_COLUMN);

        if ($sobrantes) {
            $marcas = implode(',', array_fill(0, count($sobrantes), '?'));
            $this->db->prepare("DELETE FROM contenido_historial WHERE id IN ({$marcas})")
                ->execute($sobrantes);
        }
    }
}
