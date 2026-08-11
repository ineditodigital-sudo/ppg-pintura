<?php

declare(strict_types=1);

/**
 * Front controller de la API de contenido de PPG.
 *
 * Arranque:
 *   php -S localhost:8000 -t backend/public
 *
 * Rutas públicas:
 *   GET  /api/health · site · navigation · pages · pages/{slug}
 *   GET  /api/business-lines · business-lines/{slug}
 *   POST /api/contact
 *
 * Sesión:
 *   GET  /api/auth/session
 *   POST /api/auth/login · logout · password
 *
 * Panel — exige sesión y cabecera X-CSRF-Token en métodos de escritura:
 *   GET/PUT/DELETE   /api/admin/pages[/{slug}]
 *   PUT              /api/admin/navigation · site · business-lines
 *   GET/DELETE       /api/admin/messages[/{id}]
 *   GET/POST/DELETE  /api/admin/media[/{name}]
 */

use App\Auth\Auth;
use App\Config\NotificationSettings;
use App\Controller\AdminController;
use App\Controller\AuthController;
use App\Controller\ContactController;
use App\Controller\ContentController;
use App\Controller\MediaController;
use App\Controller\NotificationController;
use App\Repository\ContentRepository;
use App\Repository\Database;
use App\Repository\MySqlContentRepository;
use App\Response;
use App\Router;
use App\Validator\ContentValidator;

/**
 * `src/` y `data/` se resuelven según el despliegue:
 *   desarrollo  backend/public/index.php  →  están en backend/  (un nivel arriba)
 *   producción  <docroot>/api/index.php   →  están junto a este archivo
 * Se prueba el layout de producción primero para no buscar nunca en la raíz
 * web si ambos existieran.
 */
$baseDir = is_dir(__DIR__ . '/src') ? __DIR__ : dirname(__DIR__);

// Autoload PSR-4 sin Composer: App\Foo\Bar → <base>/src/Foo/Bar.php
spl_autoload_register(static function (string $class) use ($baseDir): void {
    $prefix = 'App\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $file = $baseDir . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . $relative . '.php';

    if (is_file($file)) {
        require $file;
    }
});

/**
 * Nada de la API entra en el índice de un buscador.
 *
 * `robots.txt` ya la bloquea, pero bloquear no es excluir: una URL prohibida a
 * la que alguien enlace desde fuera puede acabar saliendo en los resultados
 * como enlace pelado —sin título ni descripción— porque el buscador sabe que
 * existe y tiene prohibido entrar a ver qué es. Esta cabecera lo dice sin
 * ambigüedad.
 *
 * Va aquí y no en el `.htaccess` porque se probó allí con `SetEnvIf` y este
 * servidor no llega a aplicarla.
 */
header('X-Robots-Tag: noindex, nofollow');

// CORS para el servidor de desarrollo de Vite.
$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, X-CSRF-Token');
    // El panel se autentica por cookie de sesión.
    header('Access-Control-Allow-Credentials: true');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * `assets/` está en la raíz web: junto a `api/` en producción, y en
 * `frontend/public/` durante el desarrollo.
 */
$assetsDir = is_dir(dirname($baseDir) . '/assets')
    ? dirname($baseDir) . '/assets'
    : dirname($baseDir) . '/frontend/public/assets';

/**
 * URL pública del sitio. Se deduce de la petición para que los correos
 * enlacen y muestren el logotipo desde el dominio correcto sin tener que
 * configurarlo a mano en cada entorno.
 */
$esHttps = ($_SERVER['HTTPS'] ?? '') === 'on'
    || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
$siteUrl = ($esHttps ? 'https://' : 'http://')
    . ($_SERVER['HTTP_HOST'] ?? 'localhost');

/**
 * Almacenamiento: MySQL si está configurado, archivos si no.
 *
 * `MySqlContentRepository` tiene la misma firma pública que
 * `ContentRepository`, así que a partir de aquí nada más en la aplicación
 * distingue cuál está en uso.
 *
 * La caída a archivos es deliberada y no un descuido: si la base de datos no
 * responde, el sitio sigue sirviendo contenido en vez de devolver un error.
 * Para saber cuál está activo, `/api/health` lo dice.
 */
$db = Database::conectar($baseDir . '/config/database.json');

if ($db !== null) {
    // Con `data/` como respaldo de lectura: un documento que aún no esté en la
    // base se sirve del archivo hasta que alguien lo guarde desde el panel.
    $repository = new MySqlContentRepository($db, $baseDir . '/data');
    $almacen = 'mysql';
} else {
    $repository = new ContentRepository($baseDir . '/data');
    $almacen = 'archivos';
}
$auth = new Auth($baseDir . '/config', $baseDir . '/storage');
$validator = new ContentValidator();
$notificationSettings = new NotificationSettings($baseDir . '/config');

$content = new ContentController($repository);
$contact = new ContactController($repository, $notificationSettings, $siteUrl, $baseDir . '/storage');
$authController = new AuthController($auth);
$admin = new AdminController($repository, $validator);
$media = new MediaController($assetsDir);
$notifications = new NotificationController($notificationSettings, $siteUrl);

/**
 * Envuelve un handler del panel: exige sesión y token CSRF antes de ejecutarlo.
 * Si alguna comprobación falla, ya emitió su respuesta y aquí no se hace nada.
 */
$guard = static function (callable $handler) use ($auth): callable {
    return static function (array $params = []) use ($handler, $auth): void {
        if (!$auth->requireLogin()) {
            return;
        }

        if (!$auth->requireCsrf()) {
            return;
        }

        $handler($params);
    };
};

$router = new Router();

$router->get('/api/health', static fn () => Response::json([
    'ok' => true,
    'service' => 'ppg-content-api',
    'php' => PHP_VERSION,
    // Qué almacenamiento está sirviendo. Sin detalle del porqué: el motivo
    // puede nombrar host o base de datos y esta ruta es pública.
    'almacen' => $almacen,
]));

$router->get('/api/site', static fn () => $content->site());
$router->get('/api/navigation', static fn () => $content->navigation());
$router->get('/api/pages', static fn () => $content->pages());
$router->get('/api/pages/{slug}', static fn (array $p) => $content->page($p));
$router->get('/api/business-lines', static fn () => $content->businessLines());
$router->get('/api/markets', static fn () => $content->markets());
$router->get('/api/colors', static fn () => $content->colors());
$router->get('/api/featured-products', static fn () => $content->featuredProducts());
$router->get('/api/templates', static fn () => $content->templates());
$router->get('/api/business-lines/{slug}', static fn (array $p) => $content->businessLine($p));
$router->post('/api/contact', static fn () => $contact->submit());

/* --- Sesión ------------------------------------------------------------- */

$router->get('/api/auth/session', static fn () => $authController->session());
$router->post('/api/auth/login', static fn () => $authController->login());
$router->post('/api/auth/logout', $guard(static fn () => $authController->logout()));
$router->post('/api/auth/password', $guard(static fn () => $authController->changePassword()));

/* --- Panel (requiere sesión + CSRF) ------------------------------------- */

$router->get('/api/admin/pages', $guard(static fn () => $admin->pages()));
$router->get('/api/admin/pages/{slug}', $guard(static fn (array $p) => $admin->page($p)));
$router->put('/api/admin/pages/{slug}', $guard(static fn (array $p) => $admin->savePage($p)));
$router->delete('/api/admin/pages/{slug}', $guard(static fn (array $p) => $admin->deletePage($p)));

$router->put('/api/admin/navigation', $guard(static fn () => $admin->saveNavigation()));
$router->put('/api/admin/site', $guard(static fn () => $admin->saveSite()));
$router->put('/api/admin/business-lines', $guard(static fn () => $admin->saveBusinessLines()));
$router->put('/api/admin/markets', $guard(static fn () => $admin->saveMarkets()));
$router->put('/api/admin/colors', $guard(static fn () => $admin->saveColors()));
$router->put('/api/admin/featured-products', $guard(static fn () => $admin->saveFeaturedProducts()));
$router->put('/api/admin/templates', $guard(static fn () => $admin->saveTemplates()));

$router->get('/api/admin/messages', $guard(static fn () => $admin->messages()));
$router->delete('/api/admin/messages/{id}', $guard(static fn (array $p) => $admin->deleteMessage($p)));

$router->get('/api/admin/notifications', $guard(static fn () => $notifications->show()));
$router->put('/api/admin/notifications', $guard(static fn () => $notifications->save()));
$router->post('/api/admin/notifications/test', $guard(static fn () => $notifications->test()));

$router->get('/api/admin/media', $guard(static fn () => $media->index()));
$router->post('/api/admin/media', $guard(static fn () => $media->upload()));
$router->delete('/api/admin/media/{name}', $guard(static fn (array $p) => $media->delete($p)));

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$router->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    is_string($path) ? $path : '/'
);
