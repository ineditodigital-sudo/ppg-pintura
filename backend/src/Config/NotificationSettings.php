<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Ajustes de los avisos por correo.
 *
 * Viven en `config/`, no en `data/`, y por dos razones: `data/` se sirve
 * públicamente a través de la API —la dirección de destino no tiene por qué
 * ser pública— y el despliegue nunca pisa `config/`, así que lo que se
 * configure desde el panel sobrevive a las actualizaciones del sitio.
 */
final class NotificationSettings
{
    private const ARCHIVO = 'notifications.json';

    private const POR_DEFECTO = [
        'enabled' => false,
        'recipients' => [],
        'fromName' => 'Coating Systems MX',
        'fromEmail' => '',
        'subjectPrefix' => 'Nuevo mensaje del sitio',
        'copyToSender' => false,
    ];

    public function __construct(private readonly string $configDir)
    {
    }

    /** @return array<string, mixed> */
    public function leer(): array
    {
        $ruta = $this->configDir . '/' . self::ARCHIVO;

        if (!is_file($ruta)) {
            return self::POR_DEFECTO;
        }

        $datos = json_decode((string) file_get_contents($ruta), true);

        return is_array($datos)
            ? array_merge(self::POR_DEFECTO, $datos)
            : self::POR_DEFECTO;
    }

    /**
     * Guarda sólo las claves conocidas y ya saneadas.
     *
     * @param array<string, mixed> $entrada
     * @return array{ok: bool, errores: list<string>, ajustes: array<string, mixed>}
     */
    public function guardar(array $entrada): array
    {
        $errores = [];

        $destinos = [];
        foreach ((array) ($entrada['recipients'] ?? []) as $d) {
            $d = trim((string) $d);
            if ($d === '') {
                continue;
            }
            if (filter_var($d, FILTER_VALIDATE_EMAIL) === false) {
                // Llaves obligatorias: PHP admite bytes ≥ 0x80 en los nombres
                // de variable, así que `"$d»"` se interpreta como la variable
                // `$d»` —que no existe— y el valor desaparecía del mensaje.
                $errores[] = "«{$d}» no es una dirección de correo válida.";
                continue;
            }
            $destinos[] = $d;
        }

        $remitente = trim((string) ($entrada['fromEmail'] ?? ''));
        if ($remitente !== '' && filter_var($remitente, FILTER_VALIDATE_EMAIL) === false) {
            $errores[] = 'La dirección del remitente no es válida.';
        }

        $activo = (bool) ($entrada['enabled'] ?? false);
        if ($activo && $destinos === []) {
            $errores[] = 'Para activar los avisos hace falta al menos un destinatario.';
        }

        if ($errores !== []) {
            return ['ok' => false, 'errores' => $errores, 'ajustes' => $this->leer()];
        }

        $ajustes = [
            'enabled' => $activo,
            'recipients' => array_values(array_unique($destinos)),
            'fromName' => trim((string) ($entrada['fromName'] ?? '')) ?: 'Coating Systems MX',
            'fromEmail' => $remitente,
            'subjectPrefix' => trim((string) ($entrada['subjectPrefix'] ?? ''))
                ?: 'Nuevo mensaje del sitio',
            'copyToSender' => (bool) ($entrada['copyToSender'] ?? false),
        ];

        if (!is_dir($this->configDir) && !mkdir($this->configDir, 0775, true) && !is_dir($this->configDir)) {
            return ['ok' => false, 'errores' => ['No se pudo acceder a la configuración.'], 'ajustes' => $ajustes];
        }

        $destino = $this->configDir . '/' . self::ARCHIVO;
        $temporal = $destino . '.tmp';
        $json = json_encode($ajustes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // Escritura atómica: si el proceso muere a media escritura, el archivo
        // anterior sigue intacto en vez de quedar truncado.
        if ($json === false
            || file_put_contents($temporal, $json . "\n", LOCK_EX) === false
            || !rename($temporal, $destino)
        ) {
            @unlink($temporal);
            return ['ok' => false, 'errores' => ['No se pudo guardar la configuración.'], 'ajustes' => $ajustes];
        }

        return ['ok' => true, 'errores' => [], 'ajustes' => $ajustes];
    }
}
