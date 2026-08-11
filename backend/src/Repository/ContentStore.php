<?php

declare(strict_types=1);

namespace App\Repository;

/**
 * Contrato del almacenamiento de contenido.
 *
 * Existe porque «la misma firma pública» no basta en PHP: los controladores
 * tipaban la clase concreta `ContentRepository`, así que pasarles
 * `MySqlContentRepository` reventaba con un TypeError aunque tuviera todos los
 * métodos. Se descubrió en producción, con la API devolviendo 500.
 *
 * Ahora ambos implementan esta interfaz y los controladores dependen de ella.
 * Añadir un almacenamiento nuevo —otro motor, una caché— es implementarla.
 */
interface ContentStore
{
    /** @return array<string, mixed>|null */
    public function site(): ?array;

    /** @return array<string, mixed>|null */
    public function navigation(): ?array;

    /** @return list<array<string, mixed>>|null */
    public function businessLines(): ?array;

    /** @return list<array<string, mixed>>|null */
    public function markets(): ?array;

    /** @return array<string, mixed>|null */
    public function colors(): ?array;

    /**
     * Textos compartidos por las páginas que genera una plantilla.
     *
     * Los antetítulos, títulos y cierres de las nueve páginas de producto y
     * sector estaban escritos en el componente de React: existían en el sitio
     * pero no en el panel, así que el cliente no podía tocarlos.
     *
     * @return array<string, mixed>|null
     */
    public function templates(): ?array;

    /** @return list<array<string, mixed>>|null */
    public function featuredProducts(): ?array;

    /** @return array<string, mixed>|null */
    public function businessLine(string $slug): ?array;

    /** @return array<string, mixed>|null */
    public function page(string $slug): ?array;

    /** @return list<string> */
    public function pageSlugs(): array;

    /** @param array<string, mixed> $payload */
    public function storeContactMessage(array $payload): bool;

    /** @param array<string, mixed> $page */
    public function savePage(string $slug, array $page): bool;

    public function deletePage(string $slug): bool;

    /** @param array<string, mixed> $navigation */
    public function saveNavigation(array $navigation): bool;

    /** @param array<string, mixed> $site */
    public function saveSite(array $site): bool;

    /** @param list<array<string, mixed>> $lines */
    public function saveBusinessLines(array $lines): bool;

    /** @param list<array<string, mixed>> $markets */
    public function saveMarkets(array $markets): bool;

    /** @param array<string, mixed> $catalog */
    public function saveColors(array $catalog): bool;

    /** @param array<string, mixed> $templates */
    public function saveTemplates(array $templates): bool;

    /** @param list<array<string, mixed>> $products */
    public function saveFeaturedProducts(array $products): bool;

    /** @return list<array<string, mixed>> */
    public function listContactMessages(): array;

    public function deleteContactMessage(int $id): bool;
}
