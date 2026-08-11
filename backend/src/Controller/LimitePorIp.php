<?php

declare(strict_types=1);

namespace App\Controller;

/**
 * Cuenta cuántas veces ha hecho algo una IP en una ventana de tiempo.
 *
 * El acceso al panel ya se frenaba así, pero el formulario de contacto no:
 * era un endpoint abierto que envía correo, sin límite ninguno. Bastaba un
 * bucle para llenar la bandeja del cliente y quemar la cuota de envío del
 * hosting.
 *
 * Se guarda en un archivo JSON, igual que los intentos de acceso. No hace
 * falta más: son unas pocas decenas de entradas y se podan solas al caducar.
 * Con varios servidores haría falta almacenamiento compartido, pero aquí hay
 * uno.
 */
final class LimitePorIp
{
    public function __construct(
        private readonly string $archivo,
        private readonly int $maximo,
        private readonly int $ventanaSegundos,
    ) {
    }

    /** ¿Esta IP ya agotó su cupo? */
    public function agotado(): bool
    {
        $entrada = $this->leer()[$this->ip()] ?? null;

        if (!is_array($entrada)) {
            return false;
        }

        if ((time() - (int) ($entrada['primero'] ?? 0)) > $this->ventanaSegundos) {
            return false;
        }

        return (int) ($entrada['veces'] ?? 0) >= $this->maximo;
    }

    /** Apunta un envío. */
    public function apuntar(): void
    {
        $registro = $this->leer();
        $ip = $this->ip();
        $ahora = time();
        $entrada = $registro[$ip] ?? null;

        if (!is_array($entrada) || ($ahora - (int) ($entrada['primero'] ?? 0)) > $this->ventanaSegundos) {
            $registro[$ip] = ['veces' => 1, 'primero' => $ahora];
        } else {
            $registro[$ip] = [
                'veces' => (int) ($entrada['veces'] ?? 0) + 1,
                'primero' => (int) $entrada['primero'],
            ];
        }

        // Se podan las caducadas para que el archivo no crezca sin fin.
        foreach ($registro as $clave => $valor) {
            if ($clave === $ip) {
                continue;
            }

            if (!is_array($valor) || ($ahora - (int) ($valor['primero'] ?? 0)) > $this->ventanaSegundos) {
                unset($registro[$clave]);
            }
        }

        $this->escribir($registro);
    }

    private function ip(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

        return is_string($ip) ? $ip : 'desconocida';
    }

    /** @return array<string, mixed> */
    private function leer(): array
    {
        if (!is_file($this->archivo)) {
            return [];
        }

        $datos = json_decode((string) file_get_contents($this->archivo), true);

        return is_array($datos) ? $datos : [];
    }

    /** @param array<string, mixed> $registro */
    private function escribir(array $registro): void
    {
        $dir = dirname($this->archivo);

        if (!is_dir($dir)) {
            @mkdir($dir, 0770, true);
        }

        // Escritura atómica: un archivo a medias dejaría el contador ilegible
        // y, al no poder leerlo, el límite dejaría de aplicarse.
        $temporal = $this->archivo . '.tmp';

        if (file_put_contents($temporal, json_encode($registro), LOCK_EX) !== false) {
            @rename($temporal, $this->archivo);
        }
    }
}
