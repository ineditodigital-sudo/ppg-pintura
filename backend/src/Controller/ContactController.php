<?php

declare(strict_types=1);

namespace App\Controller;

use App\Config\NotificationSettings;
use App\Mailer\ContactMailer;
use App\Repository\ContentStore;
use App\Response;

/**
 * Recepción de mensajes del formulario de contacto.
 */
final class ContactController
{
    private const MAX_BODY_BYTES = 16384;

    /**
     * Cuántos mensajes acepta una misma IP y en cuánto tiempo.
     *
     * Cinco en una hora deja pasar de sobra a quien escribe de verdad —y aun
     * a quien se equivoca y reenvía— y corta el bucle que llenaría la bandeja
     * del cliente y quemaría la cuota de correo del hosting.
     */
    private const MAX_POR_IP = 5;
    private const VENTANA_SEGUNDOS = 3600;

    public function __construct(
        private readonly ContentStore $repository,
        private readonly NotificationSettings $settings,
        private readonly string $siteUrl,
        private readonly string $storageDir,
    ) {
    }

    public function submit(): void
    {
        $raw = file_get_contents('php://input');

        if ($raw === false || $raw === '' || strlen($raw) > self::MAX_BODY_BYTES) {
            Response::error('Cuerpo de la petición vacío o demasiado grande.', 413);
            return;
        }

        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            Response::error('El cuerpo debe ser un objeto JSON válido.', 400);
            return;
        }

        // Campo trampa: va oculto en el formulario, así que una persona no lo
        // rellena nunca y casi cualquier robot sí. Se responde 201 como si
        // todo hubiera ido bien —decirle «te he pillado» sólo le enseña a
        // esquivarlo— pero no se guarda ni se envía nada.
        if (trim((string) ($payload['website'] ?? '')) !== '') {
            Response::json([
                'ok' => true,
                'message' => 'Gracias. Hemos recibido tu mensaje y te responderemos en dos días hábiles.',
            ], 201);
            return;
        }

        $limite = new LimitePorIp(
            $this->storageDir . '/contacto-envios.json',
            self::MAX_POR_IP,
            self::VENTANA_SEGUNDOS,
        );

        if ($limite->agotado()) {
            Response::error(
                'Has enviado varios mensajes seguidos. Espera un rato o escríbenos por WhatsApp.',
                429
            );
            return;
        }

        $errors = [];

        $name = trim((string) ($payload['name'] ?? ''));
        $email = trim((string) ($payload['email'] ?? ''));
        $topic = trim((string) ($payload['topic'] ?? ''));
        $message = trim((string) ($payload['message'] ?? ''));
        $company = trim((string) ($payload['company'] ?? ''));

        if ($name === '' || mb_strlen($name) > 120) {
            $errors[] = 'El nombre es obligatorio (máximo 120 caracteres).';
        }

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors[] = 'El correo electrónico no es válido.';
        }

        if ($topic === '') {
            $errors[] = 'Selecciona un tema.';
        }

        if (mb_strlen($message) < 10 || mb_strlen($message) > 4000) {
            $errors[] = 'El mensaje debe tener entre 10 y 4000 caracteres.';
        }

        if ($errors !== []) {
            Response::json([
                'ok' => false,
                'message' => implode(' ', $errors),
                'errors' => $errors,
            ], 422);
            return;
        }

        $mensaje = [
            'name' => $name,
            'email' => $email,
            'company' => $company,
            'topic' => $topic,
            'message' => $message,
        ];

        // Guardar primero. El registro es la copia fiable: el correo puede
        // fallar por causas ajenas (cuota del servidor, filtros, DNS) y un
        // prospecto no se puede perder por eso.
        // Se apunta antes de guardar: si el registro falla, el intento igual
        // cuenta. Lo contrario dejaría un hueco por el que reintentar sin fin.
        $limite->apuntar();

        // Se apunta antes de guardar: si el registro falla, el intento cuenta
        // igual. Lo contrario dejaría un hueco por el que reintentar sin fin.
        $limite->apuntar();

        $stored = $this->repository->storeContactMessage($mensaje);

        if (!$stored) {
            Response::error(
                'No pudimos registrar tu mensaje. Inténtalo de nuevo más tarde.',
                500
            );
            return;
        }

        // El aviso es un extra: si no sale, el mensaje ya está a salvo y quien
        // escribe no tiene por qué enterarse de un problema que no es suyo.
        $aviso = (new ContactMailer($this->settings->leer(), $this->siteUrl))->enviar($mensaje);

        if (!$aviso['enviado'] && $aviso['motivo'] !== '') {
            error_log('[contacto] Aviso no enviado: ' . $aviso['motivo']);
        }

        Response::json([
            'ok' => true,
            'message' => 'Gracias. Hemos recibido tu mensaje y te responderemos en dos días hábiles.',
        ], 201);
    }
}
