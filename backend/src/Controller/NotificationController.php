<?php

declare(strict_types=1);

namespace App\Controller;

use App\Config\NotificationSettings;
use App\Mailer\ContactMailer;
use App\Response;

/**
 * Configuración de los avisos por correo, editable desde el panel.
 */
final class NotificationController
{
    public function __construct(
        private readonly NotificationSettings $settings,
        private readonly string $siteUrl,
    ) {
    }

    public function show(): void
    {
        Response::json($this->settings->leer());
    }

    public function save(): void
    {
        $payload = $this->cuerpo();

        if ($payload === null) {
            Response::error('El cuerpo debe ser un objeto JSON válido.', 400);
            return;
        }

        $resultado = $this->settings->guardar($payload);

        if (!$resultado['ok']) {
            Response::json([
                'ok' => false,
                'message' => implode(' ', $resultado['errores']),
                'errors' => $resultado['errores'],
            ], 422);
            return;
        }

        Response::json([
            'ok' => true,
            'message' => 'Configuración de correo guardada.',
            'settings' => $resultado['ajustes'],
        ]);
    }

    /**
     * Envía un correo de prueba.
     *
     * Es la única forma de que alguien sin conocimientos técnicos sepa si la
     * configuración funciona: guardar una dirección no prueba nada, recibir
     * el correo sí.
     */
    public function test(): void
    {
        $payload = $this->cuerpo() ?? [];
        $ajustes = $this->settings->leer();

        $destino = trim((string) ($payload['to'] ?? ''));
        if ($destino === '') {
            $destino = (string) ($ajustes['recipients'][0] ?? '');
        }

        if (filter_var($destino, FILTER_VALIDATE_EMAIL) === false) {
            Response::json([
                'ok' => false,
                'message' => 'Indica una dirección válida a la que enviar la prueba.',
            ], 422);
            return;
        }

        // La prueba se envía aunque los avisos estén desactivados: se está
        // comprobando la configuración, no el funcionamiento del formulario.
        $ajustes['enabled'] = true;
        $ajustes['recipients'] = [$destino];
        $ajustes['copyToSender'] = false;

        $resultado = (new ContactMailer($ajustes, $this->siteUrl))->enviarPrueba($destino);

        if (!$resultado['enviado']) {
            Response::json([
                'ok' => false,
                'message' => 'No se pudo enviar: ' . $resultado['motivo'],
            ], 502);
            return;
        }

        Response::json([
            'ok' => true,
            'message' => "Correo de prueba enviado a $destino. Si no aparece en unos minutos, revisa la carpeta de spam.",
        ]);
    }

    /** @return array<string, mixed>|null */
    private function cuerpo(): ?array
    {
        $raw = file_get_contents('php://input');

        if ($raw === false || $raw === '') {
            return null;
        }

        $datos = json_decode($raw, true);

        return is_array($datos) ? $datos : null;
    }
}
