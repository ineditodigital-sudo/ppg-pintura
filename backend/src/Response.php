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
