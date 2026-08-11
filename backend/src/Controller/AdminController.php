<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ContentStore;
use App\Response;
use App\Validator\ContentValidator;

/**
 * Escritura de contenido desde el panel.
 *
 * Toda ruta que llega aquí ya pasó por Auth::requireLogin() y requireCsrf().
 */
final class AdminController
{
    private const MAX_BODY_BYTES = 1048576; // 1 MB

    public function __construct(
        private readonly ContentStore $repository,
        private readonly ContentValidator $validator,
    ) {
    }

    /* --- Páginas ----------------------------------------------------------- */

    public function pages(): void
    {
        $slugs = $this->repository->pageSlugs();
        $pages = [];

        foreach ($slugs as $slug) {
            $page = $this->repository->page($slug);

            if ($page === null) {
                continue;
            }

            $blocks = $page['blocks'] ?? [];

            $pages[] = [
                'slug' => $slug,
                'title' => $page['seo']['title'] ?? $slug,
                'blockCount' => is_array($blocks) ? count($blocks) : 0,
            ];
        }

        Response::json($pages);
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

    /** @param array<string, string> $params */
    public function savePage(array $params): void
    {
        $slug = $params['slug'] ?? '';
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        // El slug de la URL manda: no se permite renombrar por el cuerpo.
        $payload['slug'] = $slug;

        $errors = $this->validator->validatePage($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        if (!$this->repository->savePage($slug, $payload)) {
            Response::error('No se pudo guardar la página.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Página guardada.']);
    }

    /** @param array<string, string> $params */
    public function deletePage(array $params): void
    {
        $slug = $params['slug'] ?? '';

        // La portada no se puede borrar: dejaría el sitio sin raíz.
        if ($slug === 'home') {
            Response::error('La portada no se puede eliminar.', 422);
            return;
        }

        if (!$this->repository->deletePage($slug)) {
            Response::notFound('Página no encontrada.');
            return;
        }

        Response::json(['ok' => true, 'message' => 'Página eliminada. Se guardó una copia de seguridad.']);
    }

    /* --- Navegación, ajustes y líneas de negocio ---------------------------- */

    public function saveNavigation(): void
    {
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateNavigation($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        if (!$this->repository->saveNavigation($payload)) {
            Response::error('No se pudo guardar la navegación.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Navegación guardada.']);
    }

    public function saveSite(): void
    {
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateSite($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        if (!$this->repository->saveSite($payload)) {
            Response::error('No se pudieron guardar los ajustes.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Ajustes guardados.']);
    }

    public function saveBusinessLines(): void
    {
        $payload = $this->readBody(true);

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateBusinessLines($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        /** @var list<array<string, mixed>> $payload */
        if (!$this->repository->saveBusinessLines($payload)) {
            Response::error('No se pudieron guardar las líneas de negocio.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Líneas de negocio guardadas.']);
    }

    /* --- Catálogo: mercados, color y destacados ----------------------------- */

    public function saveMarkets(): void
    {
        $payload = $this->readBody(true);

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateMarkets($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        /** @var list<array<string, mixed>> $payload */
        if (!$this->repository->saveMarkets($payload)) {
            Response::error('No se pudieron guardar los mercados.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Mercados guardados.']);
    }

    public function saveColors(): void
    {
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateColors($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        if (!$this->repository->saveColors($payload)) {
            Response::error('No se pudo guardar la carta de color.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Carta de color guardada.']);
    }

    public function saveTemplates(): void
    {
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateTemplates($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        if (!$this->repository->saveTemplates($payload)) {
            Response::error('No se pudieron guardar los textos de las plantillas.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Textos de las plantillas guardados.']);
    }

    public function saveFeaturedProducts(): void
    {
        $payload = $this->readBody(true);

        if ($payload === null) {
            return;
        }

        $errors = $this->validator->validateFeaturedProducts($payload);

        if ($errors !== []) {
            $this->unprocessable($errors);
            return;
        }

        /** @var list<array<string, mixed>> $payload */
        if (!$this->repository->saveFeaturedProducts($payload)) {
            Response::error('No se pudieron guardar los productos destacados.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Productos destacados guardados.']);
    }

    /* --- Bandeja de mensajes ------------------------------------------------ */

    public function messages(): void
    {
        Response::json($this->repository->listContactMessages());
    }

    /** @param array<string, string> $params */
    public function deleteMessage(array $params): void
    {
        $id = $params['id'] ?? '';

        if (!ctype_digit($id)) {
            Response::error('Identificador inválido.', 422);
            return;
        }

        if (!$this->repository->deleteContactMessage((int) $id)) {
            Response::notFound('Mensaje no encontrado.');
            return;
        }

        Response::json(['ok' => true, 'message' => 'Mensaje eliminado.']);
    }

    /* --- Utilidades --------------------------------------------------------- */

    /** @param list<string> $errors */
    private function unprocessable(array $errors): void
    {
        Response::json([
            'ok' => false,
            'message' => 'No se guardó nada. ' . implode(' ', $errors),
            'errors' => $errors,
        ], 422);
    }

    /**
     * @return array<mixed>|null Null si ya se emitió una respuesta de error.
     */
    private function readBody(bool $allowList = false): ?array
    {
        $raw = file_get_contents('php://input');

        if ($raw === false || $raw === '') {
            Response::error('Cuerpo de la petición vacío.', 400);
            return null;
        }

        if (strlen($raw) > self::MAX_BODY_BYTES) {
            Response::error('El contenido es demasiado grande.', 413);
            return null;
        }

        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            Response::error('El cuerpo debe ser JSON válido.', 400);
            return null;
        }

        if (!$allowList && array_is_list($payload)) {
            Response::error('Se esperaba un objeto JSON.', 400);
            return null;
        }

        return $payload;
    }
}
