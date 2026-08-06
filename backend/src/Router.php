<?php

declare(strict_types=1);

namespace App;

/**
 * Router mínimo con parámetros de ruta al estilo `/pages/{slug}`.
 */
final class Router
{
    /** @var list<array{method: string, pattern: string, handler: callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->routes[] = ['method' => 'GET', 'pattern' => $pattern, 'handler' => $handler];
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->routes[] = ['method' => 'POST', 'pattern' => $pattern, 'handler' => $handler];
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->routes[] = ['method' => 'PUT', 'pattern' => $pattern, 'handler' => $handler];
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->routes[] = ['method' => 'DELETE', 'pattern' => $pattern, 'handler' => $handler];
    }

    public function dispatch(string $method, string $path): void
    {
        $path = '/' . trim($path, '/');
        $pathMatched = false;

        foreach ($this->routes as $route) {
            $regex = $this->toRegex($route['pattern']);

            if (preg_match($regex, $path, $matches) !== 1) {
                continue;
            }

            $pathMatched = true;

            if ($route['method'] !== $method) {
                continue;
            }

            $params = array_filter(
                $matches,
                static fn (int|string $key): bool => is_string($key),
                ARRAY_FILTER_USE_KEY
            );

            ($route['handler'])($params);
            return;
        }

        // Distinguir 405 de 404 ayuda a depurar el cliente.
        if ($pathMatched) {
            Response::error('Método no permitido para esta ruta.', 405);
            return;
        }

        Response::notFound('La ruta solicitada no existe.');
    }

    private function toRegex(string $pattern): string
    {
        $escaped = preg_quote($pattern, '#');
        // preg_quote escapa las llaves; se restauran para capturar {param}.
        $withParams = preg_replace(
            '#\\\\\{([a-zA-Z_][a-zA-Z0-9_]*)\\\\\}#',
            '(?P<$1>[^/]+)',
            $escaped
        );

        return '#^' . $withParams . '$#';
    }
}
