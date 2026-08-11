<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ContentStore;
use App\Response;

/**
 * Endpoints de lectura de contenido.
 */
final class ContentController
{
    public function __construct(private readonly ContentStore $repository)
    {
    }

    public function site(): void
    {
        $site = $this->repository->site();

        if ($site === null) {
            Response::error('No hay datos del sitio configurados.', 500);
            return;
        }

        Response::json($site);
    }

    public function navigation(): void
    {
        $navigation = $this->repository->navigation();

        if ($navigation === null) {
            Response::error('No hay navegación configurada.', 500);
            return;
        }

        Response::json($navigation);
    }

    public function businessLines(): void
    {
        $lines = $this->repository->businessLines();

        if ($lines === null) {
            Response::error('No hay líneas de negocio configuradas.', 500);
            return;
        }

        Response::json($lines);
    }

    public function markets(): void
    {
        $markets = $this->repository->markets();

        if ($markets === null) {
            Response::error('No hay sectores de mercado configurados.', 500);
            return;
        }

        Response::json($markets);
    }

    public function colors(): void
    {
        $colors = $this->repository->colors();

        if ($colors === null) {
            Response::error('No hay catálogo de colores configurado.', 500);
            return;
        }

        Response::json($colors);
    }

    /**
     * Textos compartidos de las páginas de plantilla.
     *
     * Devuelve un objeto vacío en vez de un 500 si aún no hay documento: las
     * páginas saben caer en sus valores por defecto, y tumbar nueve páginas
     * por un texto que falta sería desproporcionado.
     */
    public function templates(): void
    {
        Response::json($this->repository->templates() ?? []);
    }

    public function featuredProducts(): void
    {
        $products = $this->repository->featuredProducts();

        if ($products === null) {
            Response::error('No hay productos destacados configurados.', 500);
            return;
        }

        Response::json($products);
    }

    /** @param array<string, string> $params */
    public function businessLine(array $params): void
    {
        $line = $this->repository->businessLine($params['slug'] ?? '');

        if ($line === null) {
            Response::notFound('Línea de negocio no encontrada.');
            return;
        }

        Response::json($line);
    }

    /** @param array<string, string> $params */
    public function page(array $params): void
    {
        $page = $this->repository->page($params['slug'] ?? '');

        if ($page === null) {
            Response::notFound('Página no encontrada.');
            return;
        }

        Response::json($page);
    }

    public function pages(): void
    {
        Response::json(['slugs' => $this->repository->pageSlugs()]);
    }
}
