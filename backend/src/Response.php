<?php

declare(strict_types=1);

namespace App;

/**
 * Emisión de respuestas JSON.
 */
final class Response
{
    /**
     * @param array<mixed>|object $data
     */
    public static function json(array|object $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        // El contenido lo edita el cliente desde el panel: una respuesta
        // cacheada es contenido viejo servido como si fuera el vigente.
        //
        // Hacía falta decirlo aquí y no en el `.htaccess`: allí la regla de
        // `no-cache` va por extensión (`.html`, `.json`) y las rutas de la API
        // no tienen extensión —`/api/pages/quienes-somos`—, así que salían sin
        // ninguna cabecera de caché. Sin instrucción, la CDN aplica su propia
        // heurística: comprobado, Cloudflare servía la versión anterior de una
        // página ya desplegada mientras el origen devolvía la nueva.
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');

        echo json_encode(
            $data,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
        );
    }

    public static function error(string $message, int $status = 400): void
    {
        self::json(['ok' => false, 'message' => $message], $status);
    }

    public static function notFound(string $message = 'Recurso no encontrado.'): void
    {
        self::error($message, 404);
    }
}
