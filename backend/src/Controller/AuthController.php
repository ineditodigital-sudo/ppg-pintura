<?php

declare(strict_types=1);

namespace App\Controller;

use App\Auth\Auth;
use App\Response;

final class AuthController
{
    private const MAX_BODY_BYTES = 8192;

    public function __construct(private readonly Auth $auth)
    {
    }

    public function session(): void
    {
        $user = $this->auth->currentUser();

        if ($user === null) {
            Response::json(['authenticated' => false], 200);
            return;
        }

        Response::json([
            'authenticated' => true,
            'user' => $user,
            'csrfToken' => $this->auth->csrfToken(),
        ]);
    }

    public function login(): void
    {
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        $username = trim((string) ($payload['username'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($username === '' || $password === '') {
            Response::error('Introduce usuario y contraseña.', 422);
            return;
        }

        $result = $this->auth->login($username, $password);

        if (!$result['ok']) {
            Response::json(['ok' => false, 'message' => $result['message']], $result['status']);
            return;
        }

        Response::json([
            'ok' => true,
            'user' => $username,
            'csrfToken' => $this->auth->csrfToken(),
        ]);
    }

    public function logout(): void
    {
        $this->auth->logout();
        Response::json(['ok' => true, 'message' => 'Sesión cerrada.']);
    }

    public function changePassword(): void
    {
        $payload = $this->readBody();

        if ($payload === null) {
            return;
        }

        $result = $this->auth->changePassword(
            (string) ($payload['currentPassword'] ?? ''),
            (string) ($payload['newPassword'] ?? '')
        );

        Response::json(
            ['ok' => $result['ok'], 'message' => $result['message']],
            $result['status']
        );
    }

    /** @return array<string, mixed>|null Null si ya se emitió una respuesta de error. */
    private function readBody(): ?array
    {
        $raw = file_get_contents('php://input');

        if ($raw === false || $raw === '' || strlen($raw) > self::MAX_BODY_BYTES) {
            Response::error('Petición vacía o demasiado grande.', 413);
            return null;
        }

        $payload = json_decode($raw, true);

        if (!is_array($payload)) {
            Response::error('El cuerpo debe ser un objeto JSON válido.', 400);
            return null;
        }

        return $payload;
    }
}
