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

/** Otra base vacía con el mismo esquema, para probar el caso «aún no hay nada». */
$nuevaBase = function (): PDO {
    $db = new PDO('sqlite::memory:', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $db->exec('CREATE TABLE contenido (clave TEXT PRIMARY KEY, documento TEXT NOT NULL, actualizado TEXT NOT NULL)');
    $db->exec('CREATE TABLE contenido_historial (id INTEGER PRIMARY KEY AUTOINCREMENT, clave TEXT NOT NULL, documento TEXT NOT NULL, guardado TEXT NOT NULL)');
    $db->sqliteCreateFunction('NOW', fn () => date('Y-m-d H:i:s'), 0);

    return $db;
};

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

// 9. Plantillas: el documento que lleva al CMS los textos de las páginas
//    generadas. Es nuevo, así que se ejercita igual que el resto.
$plantillas = json_decode(file_get_contents($base . '/data/templates.json'), true);
$repo->saveTemplates($plantillas);
$ok('plantillas: ida y vuelta idéntica', json_encode($repo->templates()) === json_encode($plantillas));
$ok('sin plantillas guardadas devuelve null', (new MySqlContentRepository($nuevaBase()))->templates() === null);

$plantillas['lineas']['cierre']['title'] = 'Otro cierre';
$repo->saveTemplates($plantillas);
$ok('plantillas: se puede reescribir', $repo->templates()['lineas']['cierre']['title'] === 'Otro cierre');
$hp = (int) $db->query("SELECT COUNT(*) FROM contenido_historial WHERE clave='templates'")->fetchColumn();
$ok('plantillas: la versión anterior queda en el historial', $hp === 1);

// 10. Respaldo en archivos: un documento que la base aún no tiene se sirve de
//     `data/` hasta que alguien lo guarde. Sin esto, cada tipo de documento
//     nuevo salía vacío en producción hasta sembrarlo a mano.
$vacia = new MySqlContentRepository($nuevaBase(), $base . '/data');
$ok('respaldo: sirve plantillas desde el archivo', $vacia->templates()['lineas']['cierre']['title'] === '¿Tienes algún proyecto?');
$ok('respaldo: sirve la carta desde el archivo', count($vacia->colors()['colors']) === 83);
$ok('respaldo: sirve los mercados desde el archivo', count($vacia->markets()) === 6);
$ok('sin dataDir no hay respaldo', (new MySqlContentRepository($nuevaBase()))->templates() === null);

// Las páginas quedan fuera del respaldo a propósito: se pueden borrar desde el
// panel, y caer al archivo resucitaría la que el cliente acaba de eliminar.
$conRespaldo = new MySqlContentRepository($nuevaBase(), $base . '/data');
$ok('respaldo: las páginas NO se sirven del archivo', $conRespaldo->page('home') === null);

$conRespaldo->savePage('home', ['title' => 'Guardada', 'blocks' => []]);
$conRespaldo->deletePage('home');
$ok('una página borrada no resucita del archivo', $conRespaldo->page('home') === null);

// Y en cuanto se guarda, manda la base y no el archivo.
$vacia->saveTemplates(['lineas' => ['cierre' => ['title' => 'Desde la base']]]);
$ok('lo guardado pisa al respaldo', $vacia->templates()['lineas']['cierre']['title'] === 'Desde la base');

echo "\n" . ($fallos === 0 ? "TODO CORRECTO\n" : "{$fallos} FALLO(S)\n");
exit($fallos === 0 ? 0 : 1);
