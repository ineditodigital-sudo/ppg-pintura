<?php

declare(strict_types=1);

namespace App\Auth;

use App\Response;

/**
 * Sesión del panel de administración.
 *
 * Tres defensas independientes:
 *   1. Sesión con cookie endurecida (httponly / secure / samesite=Strict).
 *   2. Token CSRF exigido en todo método que no sea GET.
 *   3. Límite de intentos de inicio de sesión por IP.
 *
 * Las credenciales viven en `config/users.json`, un directorio bloqueado por
 * .htaccess. La contraseña sólo se guarda como hash bcrypt.
 */
final class Auth
{
    private const SESSION_NAME = 'ppgadmin';
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 900; // 15 minutos
    private const SESSION_TTL = 28800;   // 8 horas

    public function __construct(
        private readonly string $configDir,
        private readonly string $storageDir,
    ) {
    }

    /** Arranca la sesión con parámetros seguros. Idempotente. */
    public function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $https = (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        session_name(self::SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'secure' => $https,
            'samesite' => 'Strict',
        ]);
        session_start();
    }

    public function isLoggedIn(): bool
    {
        $this->start();

        if (empty($_SESSION['user'])) {
            return false;
        }

        // Caducidad por inactividad.
        $last = (int) ($_SESSION['lastSeen'] ?? 0);

        if ($last > 0 && (time() - $last) > self::SESSION_TTL) {
            $this->logout();
            return false;
        }

        $_SESSION['lastSeen'] = time();

        return true;
    }

    public function currentUser(): ?string
    {
        return $this->isLoggedIn() ? (string) $_SESSION['user'] : null;
    }

    /** Corta la petición con 401 si no hay sesión válida. */
    public function requireLogin(): bool
    {
        if ($this->isLoggedIn()) {
            return true;
        }

        Response::error('Necesitas iniciar sesión.', 401);

        return false;
    }

    /**
     * Corta la petición con 403 si el token CSRF no coincide.
     * Se exige en POST, PUT y DELETE; las lecturas no lo necesitan.
     */
    public function requireCsrf(): bool
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET' || $method === 'HEAD') {
            return true;
        }

        $this->start();
        $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $expected = (string) ($_SESSION['csrf'] ?? '');

        if ($expected !== '' && is_string($sent) && hash_equals($expected, $sent)) {
            return true;
        }

        Response::error('Token de seguridad inválido. Recarga el panel.', 403);

        return false;
    }

    public function csrfToken(): string
    {
        $this->start();

        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION['csrf'];
    }

    /**
     * Verifica credenciales y abre sesión.
     *
     * @return array{ok: bool, status: int, message: string}
     */
    public function login(string $username, string $password): array
    {
        $this->start();

        if ($this->isLockedOut()) {
            return [
                'ok' => false,
                'status' => 429,
                'message' => 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.',
            ];
        }

        $users = $this->readUsers();
        $hash = $users[$username]['password'] ?? null;

        // Se comprueba siempre un hash para que el tiempo de respuesta no
        // revele si el usuario existe.
        $reference = '$2y$10$usuarioInexistenteRellenoParaIgualarElTiempo0000000000000';
        $valid = password_verify($password, is_string($hash) ? $hash : $reference);

        if (!is_string($hash) || !$valid) {
            $this->recordFailure();

            return [
                'ok' => false,
                'status' => 401,
                'message' => 'Usuario o contraseña incorrectos.',
            ];
        }

        $this->clearFailures();

        // Evita la fijación de sesión.
        session_regenerate_id(true);
        $_SESSION['user'] = $username;
        $_SESSION['lastSeen'] = time();
        $_SESSION['csrf'] = bin2hex(random_bytes(32));

        return ['ok' => true, 'status' => 200, 'message' => 'Sesión iniciada.'];
    }

    public function logout(): void
    {
        $this->start();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'httponly' => true,
                'secure' => $params['secure'],
                'samesite' => 'Strict',
            ]);
        }

        session_destroy();
    }

    /**
     * Cambia la contraseña del usuario en sesión.
     *
     * @return array{ok: bool, status: int, message: string}
     */
    public function changePassword(string $current, string $new): array
    {
        $user = $this->currentUser();

        if ($user === null) {
            return ['ok' => false, 'status' => 401, 'message' => 'Sesión no válida.'];
        }

        $users = $this->readUsers();
        $hash = $users[$user]['password'] ?? null;

        if (!is_string($hash) || !password_verify($current, $hash)) {
            return ['ok' => false, 'status' => 422, 'message' => 'La contraseña actual no es correcta.'];
        }

        if (mb_strlen($new) < 10) {
            return ['ok' => false, 'status' => 422, 'message' => 'La nueva contraseña debe tener al menos 10 caracteres.'];
        }

        if ($new === $current) {
            return ['ok' => false, 'status' => 422, 'message' => 'La nueva contraseña debe ser distinta de la actual.'];
        }

        $users[$user]['password'] = password_hash($new, PASSWORD_BCRYPT);
        $users[$user]['updatedAt'] = date(DATE_ATOM);

        if (!$this->writeUsers($users)) {
            return ['ok' => false, 'status' => 500, 'message' => 'No se pudo guardar la nueva contraseña.'];
        }

        return ['ok' => true, 'status' => 200, 'message' => 'Contraseña actualizada.'];
    }

    /* --- Control de intentos ---------------------------------------------- */

    private function attemptsFile(): string
    {
        return $this->storageDir . '/login-attempts.json';
    }

    private function clientIp(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

        return is_string($ip) ? $ip : 'desconocida';
    }

    private function isLockedOut(): bool
    {
        $entry = $this->readAttempts()[$this->clientIp()] ?? null;

        if (!is_array($entry)) {
            return false;
        }

        $count = (int) ($entry['count'] ?? 0);
        $first = (int) ($entry['first'] ?? 0);

        if ((time() - $first) > self::LOCKOUT_SECONDS) {
            return false;
        }

        return $count >= self::MAX_ATTEMPTS;
    }

    private function recordFailure(): void
    {
        $attempts = $this->readAttempts();
        $ip = $this->clientIp();
        $entry = $attempts[$ip] ?? null;
        $now = time();

        if (!is_array($entry) || ($now - (int) ($entry['first'] ?? 0)) > self::LOCKOUT_SECONDS) {
            $attempts[$ip] = ['count' => 1, 'first' => $now];
        } else {
            $attempts[$ip] = [
                'count' => (int) ($entry['count'] ?? 0) + 1,
                'first' => (int) $entry['first'],
            ];
        }

        // Poda de entradas caducadas para que el archivo no crezca sin límite.
        foreach ($attempts as $key => $value) {
            if (!is_array($value) || ($now - (int) ($value['first'] ?? 0)) > self::LOCKOUT_SECONDS) {
                if ($key !== $ip) {
                    unset($attempts[$key]);
                }
            }
        }

        $this->writeJson($this->attemptsFile(), $attempts);
    }

    private function clearFailures(): void
    {
        $attempts = $this->readAttempts();
        unset($attempts[$this->clientIp()]);
        $this->writeJson($this->attemptsFile(), $attempts);
    }

    /** @return array<string, mixed> */
    private function readAttempts(): array
    {
        return $this->readJson($this->attemptsFile());
    }

    /* --- Usuarios ---------------------------------------------------------- */

    /** @return array<string, array<string, mixed>> */
    private function readUsers(): array
    {
        /** @var array<string, array<string, mixed>> $users */
        $users = $this->readJson($this->configDir . '/users.json');

        return $users;
    }

    /** @param array<string, array<string, mixed>> $users */
    private function writeUsers(array $users): bool
    {
        return $this->writeJson($this->configDir . '/users.json', $users);
    }

    /* --- Utilidades de disco ----------------------------------------------- */

    /** @return array<string, mixed> */
    private function readJson(string $file): array
    {
        if (!is_file($file)) {
            return [];
        }

        $raw = file_get_contents($file);

        if ($raw === false) {
            return [];
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, mixed> $data */
    private function writeJson(string $file, array $data): bool
    {
        $dir = dirname($file);

        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            return false;
        }

        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        if ($json === false) {
            return false;
        }

        return file_put_contents($file, $json, LOCK_EX) !== false;
    }
}
