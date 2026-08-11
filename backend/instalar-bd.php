<?php

declare(strict_types=1);

/**
 * Prepara MySQL: crea las tablas y carga el contenido actual.
 *
 * Se ejecuta desde la línea de comandos, no por HTTP:
 *
 *     php backend/instalar-bd.php
 *
 * Es idempotente. Las tablas se crean con `IF NOT EXISTS` y el contenido sólo
 * se inserta donde no había nada, así que volver a lanzarlo no puede pisar
 * ediciones hechas desde el panel.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$baseDir = __DIR__;

require $baseDir . '/src/Repository/Database.php';
// La interfaz antes que la clase: sin autocarga, requerir sólo el repositorio
// falla con «Interface ContentStore not found».
require $baseDir . '/src/Repository/ContentStore.php';
require $baseDir . '/src/Repository/MySqlContentRepository.php';

use App\Repository\Database;

$configFile = $baseDir . '/config/database.json';

if (!is_file($configFile)) {
    fwrite(STDERR, <<<TXT
    No existe backend/config/database.json.

    Cópialo de la plantilla y rellena las credenciales que hayas creado en
    cPanel → Bases de datos MySQL:

        cp backend/config/database.example.json backend/config/database.json

    TXT);
    exit(1);
}

$db = Database::conectar($configFile);

if ($db === null) {
    fwrite(STDERR, 'No se pudo conectar: ' . Database::motivo() . PHP_EOL);
    exit(1);
}

echo "Conectado.\n";

Database::migrar($db);
echo "Tablas listas: contenido, contenido_historial, mensajes.\n";

$resultado = Database::sembrar($db, $baseDir . '/data');

echo sprintf(
    "Contenido cargado: %d documento(s).\n",
    count($resultado['sembradas'])
);

foreach ($resultado['sembradas'] as $clave) {
    echo "  + {$clave}\n";
}

if ($resultado['omitidas'] !== []) {
    echo sprintf(
        "Ya existían y no se tocaron: %d.\n",
        count($resultado['omitidas'])
    );
}

// Los mensajes de contacto que hubiera en el archivo JSON Lines.
$jsonl = $baseDir . '/storage/contact-messages.jsonl';

if (is_file($jsonl)) {
    $existentes = (int) $db->query('SELECT COUNT(*) FROM mensajes')->fetchColumn();

    if ($existentes > 0) {
        echo "Mensajes: la tabla ya tenía {$existentes}, no se importa nada.\n";
    } else {
        $stmt = $db->prepare(
            'INSERT INTO mensajes (nombre, email, empresa, asunto, mensaje, recibido, ip)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $n = 0;

        foreach (file($jsonl, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $linea) {
            $m = json_decode($linea, true);

            if (!is_array($m)) {
                continue;
            }

            $stmt->execute([
                (string) ($m['name'] ?? ''),
                (string) ($m['email'] ?? ''),
                isset($m['company']) ? (string) $m['company'] : null,
                (string) ($m['topic'] ?? ''),
                (string) ($m['message'] ?? ''),
                date('Y-m-d H:i:s', strtotime((string) ($m['receivedAt'] ?? 'now'))),
                isset($m['ip']) ? (string) $m['ip'] : null,
            ]);
            $n++;
        }

        echo "Mensajes importados: {$n}.\n";
    }
}

echo "\nListo. El sitio usará MySQL en cuanto config/database.json esté en el servidor.\n";
echo "Compruébalo en /api/health: debe decir \"almacen\": \"mysql\".\n";
