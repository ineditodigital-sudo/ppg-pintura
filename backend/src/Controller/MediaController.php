<?php

declare(strict_types=1);

namespace App\Controller;

use App\Response;

/**
 * Biblioteca de medios.
 *
 * La subida se valida por el contenido real del archivo (finfo + getimagesize),
 * nunca por la extensión que envía el cliente. El nombre final lo genera el
 * servidor, así que el cliente no controla la ruta en ningún momento.
 *
 * SVG queda deliberadamente fuera: se serviría desde el mismo origen y puede
 * llevar <script> embebido. Los SVG de marca ya están desplegados.
 */
final class MediaController
{
    private const MAX_BYTES = 5242880; // 5 MB

    /** MIME real → extensión que usaremos. */
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /** Directorios de `assets/` que se muestran en la biblioteca. */
    private const LIBRARY_DIRS = ['uploads', 'csmx', 'csmx/mercados'];

    public function __construct(private readonly string $assetsDir)
    {
    }

    /** Lista todo lo disponible: subidas del panel y recursos ya desplegados. */
    public function index(): void
    {
        $items = [];

        foreach (self::LIBRARY_DIRS as $dir) {
            $path = $this->assetsDir . '/' . $dir;

            if (!is_dir($path)) {
                continue;
            }

            $files = glob($path . '/*.{jpg,jpeg,png,webp,gif,svg}', GLOB_BRACE) ?: [];

            foreach ($files as $file) {
                $items[] = [
                    'name' => basename($file),
                    'src' => '/assets/' . $dir . '/' . basename($file),
                    'folder' => $dir,
                    'size' => filesize($file) ?: 0,
                    'editable' => $dir === 'uploads',
                ];
            }
        }

        // Lo subido desde el panel primero, y dentro de cada grupo por nombre.
        usort($items, static function (array $a, array $b): int {
            if ($a['editable'] !== $b['editable']) {
                return $a['editable'] ? -1 : 1;
            }

            return strcmp($a['name'], $b['name']);
        });

        Response::json($items);
    }

    public function upload(): void
    {
        $file = $_FILES['file'] ?? null;

        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error($this->uploadErrorMessage($file['error'] ?? UPLOAD_ERR_NO_FILE), 422);
            return;
        }

        $tmp = (string) ($file['tmp_name'] ?? '');

        // Garantiza que el archivo llegó por HTTP y no es una ruta inyectada.
        if (!is_uploaded_file($tmp)) {
            Response::error('Subida no válida.', 422);
            return;
        }

        $size = (int) ($file['size'] ?? 0);

        if ($size <= 0 || $size > self::MAX_BYTES) {
            Response::error('El archivo debe pesar entre 1 byte y 5 MB.', 422);
            return;
        }

        // 1) MIME real según el contenido, no según lo que diga el cliente.
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp);

        if (!is_string($mime) || !isset(self::ALLOWED[$mime])) {
            Response::error('Formato no permitido. Se aceptan JPG, PNG, WEBP y GIF.', 422);
            return;
        }

        // 2) Debe ser una imagen decodificable de verdad.
        $info = @getimagesize($tmp);

        if ($info === false || (int) $info[0] <= 0 || (int) $info[1] <= 0) {
            Response::error('El archivo no es una imagen válida.', 422);
            return;
        }

        $extension = self::ALLOWED[$mime];
        $uploadDir = $this->assetsDir . '/uploads';

        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
            Response::error('No se pudo preparar el directorio de subidas.', 500);
            return;
        }

        // 3) El nombre lo decide el servidor: base saneada + sufijo aleatorio.
        $base = pathinfo((string) ($file['name'] ?? 'imagen'), PATHINFO_FILENAME);
        $base = strtolower((string) preg_replace('/[^A-Za-z0-9]+/', '-', $base));
        $base = trim($base, '-');

        if ($base === '') {
            $base = 'imagen';
        }

        $name = substr($base, 0, 60) . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
        $target = $uploadDir . '/' . $name;

        if (!move_uploaded_file($tmp, $target)) {
            Response::error('No se pudo guardar el archivo.', 500);
            return;
        }

        @chmod($target, 0644);

        Response::json([
            'ok' => true,
            'name' => $name,
            'src' => '/assets/uploads/' . $name,
            'folder' => 'uploads',
            'size' => filesize($target) ?: 0,
            'width' => (int) $info[0],
            'height' => (int) $info[1],
            'editable' => true,
        ], 201);
    }

    /** Sólo se pueden borrar los archivos subidos desde el panel. */
    public function delete(array $params): void
    {
        $name = $params['name'] ?? '';

        if (preg_match('/^[a-z0-9][a-z0-9._-]{0,120}$/i', $name) !== 1 || str_contains($name, '..')) {
            Response::error('Nombre de archivo no válido.', 422);
            return;
        }

        $file = $this->assetsDir . '/uploads/' . $name;

        // Confirma que la ruta resuelta sigue dentro de uploads/.
        $real = realpath($file);
        $root = realpath($this->assetsDir . '/uploads');

        if ($real === false || $root === false || !str_starts_with($real, $root . DIRECTORY_SEPARATOR)) {
            Response::notFound('Archivo no encontrado.');
            return;
        }

        if (!unlink($real)) {
            Response::error('No se pudo eliminar el archivo.', 500);
            return;
        }

        Response::json(['ok' => true, 'message' => 'Imagen eliminada.']);
    }

    private function uploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'El archivo supera el tamaño permitido.',
            UPLOAD_ERR_PARTIAL => 'La subida se interrumpió. Inténtalo de nuevo.',
            UPLOAD_ERR_NO_FILE => 'No se recibió ningún archivo.',
            UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => 'El servidor no pudo escribir el archivo.',
            default => 'No se pudo procesar la subida.',
        };
    }
}
