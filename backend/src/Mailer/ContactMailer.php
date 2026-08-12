<?php

declare(strict_types=1);

namespace App\Mailer;

/**
 * Aviso por correo de cada mensaje del formulario.
 *
 * Existe porque el formulario sólo dejaba el mensaje en un archivo: quien
 * escribía un martes se quedaba sin respuesta hasta que alguien entrase al
 * panel. Para un sitio cuyo objetivo es captar clientes, eso es perder el
 * prospecto.
 *
 * El correo se compone a mano, sin librerías, porque el hosting no trae
 * Composer y `mail()` es lo único disponible. Va en multiparte: la versión
 * HTML para quien pueda verla y la de texto para quien no.
 */
final class ContactMailer
{
    /** Azul de PPG, el mismo que usa el sitio. */
    private const MARCA = '#0078A9';
    private const TINTA = '#10222E';
    private const SUAVE = '#3B4A54';
    private const BORDE = '#DCE4EC';

    /** @param array<string, mixed> $config */
    public function __construct(
        private readonly array $config,
        private readonly string $siteUrl,
    ) {
    }

    /**
     * @param array<string, string> $mensaje
     * @return array{enviado: bool, motivo: string}
     */
    public function enviar(array $mensaje): array
    {
        if (($this->config['enabled'] ?? false) !== true) {
            return ['enviado' => false, 'motivo' => 'Los avisos por correo están desactivados.'];
        }

        $destinos = array_values(array_filter(
            (array) ($this->config['recipients'] ?? []),
            static fn ($d) => filter_var((string) $d, FILTER_VALIDATE_EMAIL) !== false
        ));

        if ($destinos === []) {
            return ['enviado' => false, 'motivo' => 'No hay ningún destinatario configurado.'];
        }

        if (!function_exists('mail')) {
            return ['enviado' => false, 'motivo' => 'El servidor no permite enviar correo.'];
        }

        $asunto = trim((string) ($this->config['subjectPrefix'] ?? 'Nuevo mensaje del sitio'));
        $asunto .= ' — ' . ($mensaje['topic'] ?? 'Contacto');

        $ok = $this->entregar(
            implode(', ', $destinos),
            $asunto,
            $this->cuerpoHtml($mensaje),
            $this->cuerpoTexto($mensaje),
            // Responder al correo abre la respuesta directamente hacia quien
            // escribió, sin tener que copiar la dirección a mano.
            (string) ($mensaje['email'] ?? ''),
            (string) ($mensaje['name'] ?? ''),
        );

        if ($ok && ($this->config['copyToSender'] ?? false) === true) {
            $this->entregar(
                (string) $mensaje['email'],
                'Hemos recibido tu mensaje — ' . $this->nombreRemitente(),
                $this->cuerpoHtml($mensaje, true),
                $this->cuerpoTexto($mensaje, true),
                '',
                '',
            );
        }

        return $ok
            ? ['enviado' => true, 'motivo' => '']
            : ['enviado' => false, 'motivo' => 'El servidor rechazó el envío.'];
    }

    /** Envía un correo de prueba para comprobar la configuración desde el panel. */
    public function enviarPrueba(string $destino): array
    {
        return $this->enviar([
            'name' => 'Prueba desde el panel',
            'email' => $destino,
            'company' => '—',
            'topic' => 'Comprobación de la configuración',
            'message' => 'Si estás leyendo esto, los avisos del formulario de contacto '
                . 'están correctamente configurados y los mensajes del sitio llegarán a '
                . 'esta bandeja.',
        ]);
    }

    private function nombreRemitente(): string
    {
        return (string) ($this->config['fromName'] ?? 'Coating Systems MX');
    }

    private function entregar(
        string $para,
        string $asunto,
        string $html,
        string $texto,
        string $responderA,
        string $nombreResponder,
    ): bool {
        $frontera = 'csmx-' . bin2hex(random_bytes(12));

        $de = (string) ($this->config['fromEmail'] ?? '');
        if (filter_var($de, FILTER_VALIDATE_EMAIL) === false) {
            // Sin un remitente del propio dominio, muchos servidores rechazan
            // el correo o lo mandan a spam.
            $host = parse_url($this->siteUrl, PHP_URL_HOST) ?: 'localhost';
            $de = 'no-responder@' . $host;
        }

        $cabeceras = [
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $frontera . '"',
            'From: ' . $this->codificar($this->nombreRemitente()) . ' <' . $de . '>',
            'X-Mailer: Coating Systems MX',
        ];

        if (filter_var($responderA, FILTER_VALIDATE_EMAIL) !== false) {
            $cabeceras[] = 'Reply-To: '
                . ($nombreResponder !== '' ? $this->codificar($nombreResponder) . ' ' : '')
                . '<' . $responderA . '>';
        }

        $cuerpo = "--$frontera\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $texto . "\r\n\r\n"
            . "--$frontera\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $html . "\r\n\r\n"
            . "--$frontera--\r\n";

        return @mail(
            $para,
            $this->codificar($asunto),
            $cuerpo,
            implode("\r\n", $cabeceras),
            '-f' . $de
        );
    }

    /** Los acentos en asunto y nombres necesitan codificarse o llegan rotos. */
    private function codificar(string $texto): string
    {
        if (preg_match('/[\x80-\xFF]/', $texto) !== 1) {
            return $texto;
        }

        return '=?UTF-8?B?' . base64_encode($texto) . '?=';
    }

    /** @param array<string, string> $m */
    private function cuerpoTexto(array $m, bool $paraQuienEscribe = false): string
    {
        $lineas = $paraQuienEscribe
            ? ['Hemos recibido tu mensaje y te responderemos en un plazo de dos días hábiles.', '']
            : ['Nuevo mensaje desde el formulario de contacto del sitio.', ''];

        $lineas[] = 'Nombre:  ' . ($m['name'] ?? '');
        $lineas[] = 'Correo:  ' . ($m['email'] ?? '');
        if (($m['company'] ?? '') !== '') {
            $lineas[] = 'Empresa: ' . $m['company'];
        }
        $lineas[] = 'Tema:    ' . ($m['topic'] ?? '');
        $lineas[] = '';
        $lineas[] = 'Mensaje:';
        $lineas[] = (string) ($m['message'] ?? '');
        $lineas[] = '';
        $lineas[] = str_repeat('-', 48);
        $lineas[] = $this->nombreRemitente() . ' · ' . $this->siteUrl;

        return implode("\r\n", $lineas);
    }

    /**
     * HTML para correo: tablas y estilos en línea.
     *
     * No es HTML moderno a propósito. Outlook usa el motor de Word y descarta
     * flexbox, grid y casi cualquier hoja de estilos; las tablas anidadas con
     * `style=""` es lo único que se ve igual en todas partes. El ancho máximo
     * de 600px y las celdas apiladas son lo que lo hace legible en el móvil.
     */
    private function cuerpoHtml(array $m, bool $paraQuienEscribe = false): string
    {
        /**
         * PNG y no SVG: Gmail y Outlook descartan los SVG, y el correo se
         * quedaría sin logotipo. Va aplanado sobre el azul de la banda —no con
         * transparencia— porque es lo único que se ve igual en todos los
         * clientes, incluidos los que dibujan el correo con el motor de Word.
         * Se sirve al doble de la medida a la que se enseña, para las pantallas
         * de densidad alta.
         */
        $logo = $this->siteUrl . '/assets/marcas/ppg-email.png';
        $marca = self::MARCA;
        $tinta = self::TINTA;
        $suave = self::SUAVE;
        $borde = self::BORDE;
        $nombreEmpresa = $this->e($this->nombreRemitente());

        $titulo = $paraQuienEscribe
            ? 'Hemos recibido tu mensaje'
            : 'Nuevo mensaje desde el sitio';
        $entradilla = $paraQuienEscribe
            ? 'Gracias por escribirnos. Te responderemos en un plazo de dos días hábiles.'
            : 'Alguien ha completado el formulario de contacto. Puedes responder directamente '
                . 'a este correo y tu respuesta le llegará.';

        $filas = $this->fila('Nombre', (string) ($m['name'] ?? ''));
        $filas .= $this->fila('Correo', (string) ($m['email'] ?? ''), true);
        if (($m['company'] ?? '') !== '') {
            $filas .= $this->fila('Empresa', (string) $m['company']);
        }
        $filas .= $this->fila('Tema', (string) ($m['topic'] ?? ''));

        $mensaje = nl2br($this->e((string) ($m['message'] ?? '')));

        return <<<HTML
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{$titulo}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
<tr><td align="center" style="padding:24px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
         style="width:100%;max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;">

    <tr>
      <td style="background:{$marca};padding:26px 28px;">
        <!--
          PPG delante y el distribuidor como matiz, igual que en el sitio: la
          marca del sitio es PPG y Coating Systems aparece como quien la
          representa, no en su lugar. Antes el correo abría con el logotipo del
          distribuidor y decía lo contrario que la web.

          El logotipo va sin fondo blanco propio: el archivo ya viene aplanado
          sobre este mismo azul, así que se funde con la banda en lugar de
          quedar recuadrado.
        -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:16px;" valign="middle">
              <img src="{$logo}" width="62" height="48" alt="PPG"
                   style="display:block;border:0;">
            </td>
            <td style="font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;" valign="middle">
              <div style="font-size:12px;line-height:1.4;letter-spacing:0.09em;text-transform:uppercase;color:#BFE0EE;">Distribuidor autorizado</div>
              <div style="font-size:17px;font-weight:bold;line-height:1.35;">{$nombreEmpresa}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:{$tinta};">{$titulo}</h1>
        <p style="margin:0;font-size:14px;line-height:1.6;color:{$suave};">{$entradilla}</p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="font-family:Arial,Helvetica,sans-serif;">
          {$filas}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 28px 4px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:{$suave};padding-bottom:8px;">Mensaje</div>
        <!-- Filete de marca a la izquierda: distingue lo que escribió la
             persona del texto que genera el sitio, que es lo que se lee
             primero cuando llega un aviso. -->
        <div style="font-size:15px;line-height:1.65;color:{$tinta};background:#F5F8FB;border-left:3px solid {$marca};border-radius:0 6px 6px 0;padding:16px 18px;">{$mensaje}</div>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 28px 28px;font-family:Arial,Helvetica,sans-serif;">
        <div style="border-top:1px solid {$borde};padding-top:16px;font-size:12px;line-height:1.7;color:{$suave};">
          <strong style="color:{$tinta};">{$nombreEmpresa}</strong> · Distribuidor autorizado PPG<br>
          Pintura en polvo en Aguascalientes<br>
          <a href="{$this->siteUrl}" style="color:{$marca};text-decoration:none;">{$this->siteUrl}</a>
        </div>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>
HTML;
    }

    private function fila(string $etiqueta, string $valor, bool $esCorreo = false): string
    {
        $e = $this->e($etiqueta);
        $v = $this->e($valor);
        $suave = self::SUAVE;
        $tinta = self::TINTA;
        $marca = self::MARCA;
        $borde = self::BORDE;

        $contenido = $esCorreo
            ? '<a href="mailto:' . $v . '" style="color:' . $marca . ';text-decoration:none;">' . $v . '</a>'
            : $v;

        return '<tr>'
            . '<td style="padding:9px 0;border-bottom:1px solid ' . $borde . ';font-size:13px;color:' . $suave . ';width:110px;vertical-align:top;">' . $e . '</td>'
            . '<td style="padding:9px 0;border-bottom:1px solid ' . $borde . ';font-size:15px;color:' . $tinta . ';font-weight:bold;">' . $contenido . '</td>'
            . '</tr>';
    }

    private function e(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
