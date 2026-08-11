<?php
// Ejercita MySqlContentRepository contra SQLite en memoria.
// No sustituye a una prueba contra MySQL, pero valida lo que importa aquí:
// que las consultas son correctas, que el historial se poda a diez y que
// leer/escribir devuelve exactamente lo que entró.
declare(strict_types=1);

$base = dirname(__DIR__);
require $base . '/src/Repository/ContentStore.php';
require $base . '/src/Repository/MySqlContentRepository.php';

use App\Repository\MySqlContentRepository;

$db = new PDO('sqlite::memory:', null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$db->exec('CREATE TABLE contenido (clave TEXT PRIMARY KEY, documento TEXT NOT NULL, actualizado TEXT NOT NULL)');
$db->exec('CREATE TABLE contenido_historial (id INTEGER PRIMARY KEY AUTOINCREMENT, clave TEXT NOT NULL, documento TEXT NOT NULL, guardado TEXT NOT NULL)');
$db->exec('CREATE TABLE mensajes (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, email TEXT, empresa TEXT, asunto TEXT, mensaje TEXT, recibido TEXT, ip TEXT)');

// SQLite no trae NOW(); se registra para que el mismo SQL funcione aquí.
$db->sqliteCreateFunction('NOW', fn () => date('Y-m-d H:i:s'), 0);

$repo = new MySqlContentRepository($db);
$fallos = 0;
$ok = function (string $t, bool $c) use (&$fallos) {
    echo ($c ? '  OK   ' : '  FALLA') . " {$t}\n";
    if (!$c) $fallos++;
};

// 1. Ida y vuelta con el catálogo real
$colors = json_decode(file_get_contents($base . '/data/colors.json'), true);
$repo->saveColors($colors);
$leido = $repo->colors();
$ok('carta de color: ida y vuelta idéntica', json_encode($leido) === json_encode($colors));
$ok('83 referencias', count($leido['colors']) === 83);

// 2. Acentos y eñes
$repo->saveSite(['name' => 'PPG', 'tagline' => 'Aguascalientes · ñ á é í ó ú «»']);
$ok('UTF-8 intacto', $repo->site()['tagline'] === 'Aguascalientes · ñ á é í ó ú «»');

// 3. featured-products se desenvuelve como en el contrato de la API
$repo->saveFeaturedProducts([['slug' => 'a'], ['slug' => 'b']]);
$fp = $repo->featuredProducts();
$ok('destacados: devuelve lista desenvuelta', is_array($fp) && count($fp) === 2 && $fp[0]['slug'] === 'a');

// 4. Páginas y slugs
$repo->savePage('home', ['slug' => 'home', 'blocks' => []]);
$repo->savePage('contacto', ['slug' => 'contacto', 'blocks' => []]);
$ok('pageSlugs los lista', $repo->pageSlugs() === ['contacto', 'home']);
$ok('página se lee', $repo->page('home')['slug'] === 'home');

// 5. Slug inseguro rechazado
$ok('slug con ../ rechazado', $repo->page('../../etc/passwd') === null);
$ok('savePage con slug inseguro rechazado', $repo->savePage('Mal Slug', []) === false);

// 6. Historial: se poda a diez
for ($i = 0; $i < 15; $i++) {
    $repo->saveSite(['name' => 'PPG', 'tagline' => "v{$i}"]);
}
$n = (int) $db->query("SELECT COUNT(*) FROM contenido_historial WHERE clave='site'")->fetchColumn();
$ok("historial podado a 10 (hay {$n})", $n === 10);
$ok('el documento vigente es el último', $repo->site()['tagline'] === 'v14');

// 7. Borrado de página deja historial
$repo->deletePage('contacto');
$ok('página borrada', $repo->page('contacto') === null);
$h = (int) $db->query("SELECT COUNT(*) FROM contenido_historial WHERE clave='pages/contacto'")->fetchColumn();
$ok('el borrado dejó copia en el historial', $h === 1);

// 8. Mensajes
$repo->storeContactMessage(['name' => 'Ana', 'email' => 'a@b.mx', 'topic' => 'Cotización', 'message' => 'Hola']);
$msgs = $repo->listContactMessages();
$ok('mensaje guardado y leído', count($msgs) === 1 && $msgs[0]['name'] === 'Ana');
$ok('mensaje borrado', $repo->deleteContactMessage($msgs[0]['id']) === true);
$ok('bandeja vacía', $repo->listContactMessages() === []);

echo "\n" . ($fallos === 0 ? "TODO CORRECTO\n" : "{$fallos} FALLO(S)\n");
exit($fallos === 0 ? 0 : 1);
