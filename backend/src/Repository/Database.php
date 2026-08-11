<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Conexión MySQL y creación del esquema.
 *
 * La configuración vive en `config/database.json`, que no viaja en el
 * repositorio ni se despliega: son credenciales. Si el archivo no existe, o la
 * conexión falla, `Database::conectar()` devuelve null y el front controller
 * sigue con el almacenamiento en archivos. Esa caída es deliberada: un fallo de
 * base de datos deja el sitio sirviendo contenido, no una página de error.
 */
final class Database
{
    private static ?PDO $conexion = null;
    private static bool $intentado = false;
    private static string $motivo = '';

    /** Por qué no hay conexión. Vacío si la hay o si no se ha intentado. */
    public static function motivo(): string
    {
        return self::$motivo;
    }

    public static function conectar(string $configFile): ?PDO
    {
        if (self::$intentado) {
            return self::$conexion;
        }

        self::$intentado = true;

        if (!is_file($configFile)) {
            self::$motivo = 'No existe config/database.json.';

            return null;
        }

        $raw = file_get_contents($configFile);
        $cfg = is_string($raw) ? json_decode($raw, true) : null;

        if (!is_array($cfg)) {
            self::$motivo = 'config/database.json no es un JSON válido.';

            return null;
        }

        foreach (['host', 'database', 'user', 'password'] as $clave) {
            if (!isset($cfg[$clave]) || !is_string($cfg[$clave])) {
                self::$motivo = "Falta «{$clave}» en config/database.json.";

                return null;
            }
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $cfg['host'],
            (int) ($cfg['port'] ?? 3306),
            $cfg['database'],
        );

        try {
            self::$conexion = new PDO($dsn, $cfg['user'], $cfg['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Sentencias preparadas de verdad, no emuladas: es lo que
                // impide que un valor acabe interpretándose como SQL.
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // El mensaje puede llevar host y usuario: no se propaga al cliente.
            self::$motivo = 'No se pudo conectar a MySQL.';
            error_log('MySQL: ' . $e->getMessage());

            return null;
        }

        return self::$conexion;
    }

    /**
     * Crea las tablas si faltan.
     *
     * El contenido se guarda como documento JSON por clave y no repartido en
     * columnas tipadas. Es a propósito: cada página es una lista de bloques de
     * forma distinta —un hero no tiene los campos de una cronología—, y
     * normalizar eso serían veinte tablas que habría que migrar cada vez que se
     * añade un tipo de bloque. Es el mismo modelo que usan los CMS de bloques.
     * La validación fuerte ya la hace `ContentValidator` antes de escribir.
     */
    public static function migrar(PDO $db): void
    {
        $db->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS contenido (
                clave        VARCHAR(191) NOT NULL PRIMARY KEY,
                documento    LONGTEXT     NOT NULL,
                actualizado  DATETIME     NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        // Historial: el equivalente a `data/.backups`. Diez versiones por clave.
        $db->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS contenido_historial (
                id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                clave      VARCHAR(191)    NOT NULL,
                documento  LONGTEXT        NOT NULL,
                guardado   DATETIME        NOT NULL,
                INDEX idx_clave_guardado (clave, guardado)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);

        $db->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS mensajes (
                id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                nombre    VARCHAR(191)    NOT NULL,
                email     VARCHAR(191)    NOT NULL,
                empresa   VARCHAR(191)    NULL,
                asunto    VARCHAR(191)    NOT NULL,
                mensaje   TEXT            NOT NULL,
                recibido  DATETIME        NOT NULL,
                ip        VARCHAR(45)     NULL,
                INDEX idx_recibido (recibido)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        SQL);
    }

    /**
     * Carga en MySQL el contenido que hoy vive en archivos.
     *
     * No pisa lo que ya esté en la tabla: sembrar dos veces no puede deshacer
     * ediciones hechas desde el panel.
     *
     * @return array{sembradas: list<string>, omitidas: list<string>}
     */
    public static function sembrar(PDO $db, string $dataDir): array
    {
        $sembradas = [];
        $omitidas = [];

        $archivos = ['site', 'navigation', 'business-lines', 'markets', 'colors', 'featured-products', 'templates'];

        $rutas = [];
        foreach ($archivos as $nombre) {
            $rutas[$nombre] = "{$dataDir}/{$nombre}.json";
        }

        foreach (glob("{$dataDir}/pages/*.json") ?: [] as $ruta) {
            $rutas['pages/' . basename($ruta, '.json')] = $ruta;
        }

        $existe = $db->prepare('SELECT 1 FROM contenido WHERE clave = ?');
        $insertar = $db->prepare(
            'INSERT INTO contenido (clave, documento, actualizado) VALUES (?, ?, NOW())'
        );

        foreach ($rutas as $clave => $ruta) {
            if (!is_file($ruta)) {
                continue;
            }

            $existe->execute([$clave]);

            if ($existe->fetchColumn() !== false) {
                $omitidas[] = $clave;
                continue;
            }

            $contenido = file_get_contents($ruta);

            if ($contenido === false || json_decode($contenido, true) === null) {
                throw new RuntimeException("El archivo {$ruta} no contiene JSON válido.");
            }

            $insertar->execute([$clave, $contenido]);
            $sembradas[] = $clave;
        }

        return ['sembradas' => $sembradas, 'omitidas' => $omitidas];
    }
}
