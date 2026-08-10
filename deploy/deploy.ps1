<#
.SYNOPSIS
  Compila el frontend, ensambla el paquete de producción y lo sube por FTP.

.DESCRIPTION
  Estructura resultante en el document root del subdominio:

    index.html · assets/      SPA compilada (incluye el chunk del panel)
    .htaccess                 Fallback SPA, enrutado /api, caché y seguridad
    api/index.php             Front controller de la API
    api/src/                  Clases PHP          (bloqueado por .htaccess)
    api/data/                 Contenido JSON      (bloqueado por .htaccess)
    api/config/               Credenciales        (bloqueado por .htaccess)
    api/storage/              Mensajes y sesiones (bloqueado por .htaccess)

  ESTADO VIVO. Desde que el CMS está en marcha, el servidor es la fuente de
  verdad de `data/`, `config/` y `storage/`. Un despliegue normal sólo
  sobrescribe CÓDIGO; nunca pisa lo que se editó desde el panel:

    (por defecto)   sube código y assets. No toca data/, config/ ni storage/.
    -SeedContent    sube data/ SÓLO si el archivo aún no existe en el servidor.
    -SeedAuth       sube config/users.json SÓLO si aún no existe.
    -PushContent    fuerza la subida de data/, sobrescribiendo lo editado.
                    Pide confirmación: es destructivo.

  Las credenciales FTP se leen de variables de entorno; no se escriben en disco.
  Sólo se toca el directorio indicado en -RemoteRoot.

  ENVÍO INCREMENTAL. Tras cada despliegue se guarda en `deploy/.manifiesto.json`
  el hash de lo que quedó en el servidor, y el siguiente sólo sube lo que ha
  cambiado. Un despliegue típico pasa de 68 archivos a un puñado: las imágenes,
  las fuentes y el PHP no cambian, y los bundles llevan hash en el nombre.

    -Full           ignora el manifiesto y sube el paquete entero. Es la salida
                    cuando el servidor y el manifiesto se desincronizan —otra
                    máquina, un borrado a mano—, y no cuesta nada usarlo.
    -LimpiarAssets  borra del servidor los bundles con hash que ya no usa
                    ningún despliegue. Es destructivo: pídelo a propósito y
                    combínalo con -WhatIfOnly para ver antes la lista.

.EXAMPLE
  $env:FTP_HOST='...'; $env:FTP_USER='...'; $env:FTP_PASS='...'
  .\deploy\deploy.ps1                        # despliegue normal (incremental)
  .\deploy\deploy.ps1 -Full                  # vuelve a subirlo todo
  .\deploy\deploy.ps1 -SeedContent -SeedAuth # primera vez
#>
[CmdletBinding()]
param(
  # El sitio vive ahora en el subdominio ppg.pinturaenpolvo-mx.com, y un
  # subdominio de cPanel sí cuelga de su propia carpeta. El dominio principal
  # usaba `/public_html` a secas: equivocar esta ruta deja todas las rutas menos
  # `/` en 404 sin que el despliegue dé ningún error. Ya pasó una vez.
  [string]$RemoteRoot = '/public_html/ppg.pinturaenpolvo-mx.com',
  [switch]$SkipBuild,
  [switch]$WhatIfOnly,
  [switch]$SeedContent,
  [switch]$SeedAuth,
  [switch]$PushContent,
  # Sube todo, sin consultar el manifiesto del despliegue anterior.
  [switch]$Full,
  # Borra del servidor los bundles antiguos que ya nadie referencia.
  [switch]$LimpiarAssets,
  # Omite la confirmación de -PushContent, para ejecuciones no interactivas.
  [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent

foreach ($v in 'FTP_HOST', 'FTP_USER', 'FTP_PASS') {
  if (-not (Get-Item "Env:$v" -ErrorAction SilentlyContinue)) {
    throw "Falta la variable de entorno $v"
  }
}
$ftpHost = $env:FTP_HOST
$cred = "$($env:FTP_USER):$($env:FTP_PASS)"

if ($PushContent -and -not $Yes) {
  Write-Host '!! -PushContent sobrescribirá el contenido editado desde el CMS.' -ForegroundColor Yellow
  if ((Read-Host '   Escribe SI para continuar') -ne 'SI') { Write-Host 'Cancelado.'; return }
}

# --- Utilidades -------------------------------------------------------------

function Test-RemoteFile([string]$remotePath) {
  # `-I` pide SIZE/MDTM del archivo concreto y devuelve 78 si no existe.
  #
  # NO usar `--list-only`: sobre una ruta inexistente el servidor lista el
  # directorio padre y curl sale con 0, así que TODO parecería existir y las
  # siembras se omitirían en silencio.
  curl.exe -s -I --connect-timeout 25 --max-time 60 `
    "ftp://$ftpHost$remotePath" --user $cred 2>&1 | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Send-File([string]$localPath, [string]$remotePath) {
  curl.exe -s -S --ftp-create-dirs --connect-timeout 30 --max-time 180 `
    -T $localPath "ftp://$ftpHost$remotePath" --user $cred 2>&1 | Out-Null
  return ($LASTEXITCODE -eq 0)
}

<#
.SYNOPSIS
  Sube un grupo de archivos reutilizando una sola conexión FTP.

.DESCRIPTION
  Una invocación de curl por archivo abre una conexión FTP por archivo. Con el
  paquete completo son ~70 conexiones seguidas contra el mismo host y este
  hosting las corta a mitad del envío: `curl (28) Could not connect`, con el
  despliegue a medias. Repitiendo `-T local URL` en una sola llamada, curl
  encadena todas las transferencias sobre la misma conexión.

  Recibe objetos con las propiedades `Local` y `Remote`.
#>
function Send-Batch([object[]]$items) {
  $argumentos = @('-s', '-S', '--ftp-create-dirs', '--connect-timeout', '30', '--max-time', '600', '--user', $cred)

  foreach ($i in $items) {
    $argumentos += @('-T', $i.Local, "ftp://$ftpHost$($i.Remote)")
  }

  curl.exe @argumentos 2>&1 | Out-Null
  return ($LASTEXITCODE -eq 0)
}

# Un corte de conexión no siempre significa credenciales o rutas mal: el
# servidor puede estar limitando el ritmo. Se espera y se reintenta antes de
# darlo por fallido.
function Send-BatchConReintento([object[]]$items, [int]$intentos = 3) {
  for ($n = 1; $n -le $intentos; $n++) {
    if (Send-Batch $items) { return $true }

    if ($n -lt $intentos) {
      $pausa = 15 * $n
      Write-Host ("    conexión cortada (curl {0}); reintento {1}/{2} en {3}s" -f $LASTEXITCODE, $n, ($intentos - 1), $pausa) -ForegroundColor DarkYellow
      Start-Sleep -Seconds $pausa
    }
  }

  return $false
}

# --- Manifiesto -------------------------------------------------------------
#
# Registro de lo que quedó en el servidor la última vez: ruta relativa → hash.
# Comparar contra él evita volver a subir lo idéntico, que en este paquete son
# tres cuartas partes del peso. No se consulta al servidor por cada archivo a
# propósito: eso serían ~70 conexiones sólo para preguntar.
#
# El manifiesto describe UN destino. Si se despliega a otro `-RemoteRoot`, no
# vale y se ignora entero.

$manifiestoPath = Join-Path $PSScriptRoot '.manifiesto.json'

function Read-Manifiesto {
  if ($Full -or -not (Test-Path $manifiestoPath)) { return @{} }

  try {
    $datos = Get-Content $manifiestoPath -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    Write-Host '    manifiesto ilegible: se sube todo' -ForegroundColor DarkYellow
    return @{}
  }

  if ($datos.remoteRoot -ne $RemoteRoot) {
    Write-Host '    el manifiesto es de otro destino: se sube todo' -ForegroundColor DarkYellow
    return @{}
  }

  $tabla = @{}
  foreach ($entrada in $datos.archivos.PSObject.Properties) {
    $tabla[$entrada.Name] = $entrada.Value
  }

  return $tabla
}

function Write-Manifiesto([hashtable]$tabla) {
  $orden = [ordered]@{}
  foreach ($clave in ($tabla.Keys | Sort-Object)) { $orden[$clave] = $tabla[$clave] }

  [pscustomobject]@{
    remoteRoot = $RemoteRoot
    fecha      = (Get-Date).ToString('o')
    archivos   = $orden
  } | ConvertTo-Json -Depth 4 | Set-Content $manifiestoPath -Encoding UTF8
}

function Get-Huella([string]$ruta) {
  return (Get-FileHash -Path $ruta -Algorithm SHA256).Hash
}

# --- Bundles huérfanos ------------------------------------------------------
#
# Los nombres de `assets/` llevan el hash del contenido, así que cada build
# publica archivos nuevos y los anteriores se quedan ahí para siempre. No
# estorban —nadie los pide—, pero se acumulan. Se borran sólo si se pide, y
# sólo los que encajan en el patrón de bundle con hash: jamás una imagen ni
# nada subido desde el panel.
function Remove-BundlesHuerfanos([string]$stagePath) {
  Write-Host '==> Buscando bundles antiguos en assets/' -ForegroundColor Cyan

  $patronBundle = '^(index|AdminApp)-[A-Za-z0-9_\-]{6,}\.(js|css)$'
  $vigentes = @(Get-ChildItem (Join-Path $stagePath 'assets') -File | Select-Object -ExpandProperty Name)

  $remotos = @(curl.exe -s --list-only --connect-timeout 25 --max-time 90 `
      "ftp://$ftpHost$RemoteRoot/assets/" --user $cred 2>$null)

  if ($LASTEXITCODE -ne 0) {
    Write-Host ("    no se pudo listar assets/ (curl {0}); se omite la limpieza" -f $LASTEXITCODE) -ForegroundColor DarkYellow
    return
  }

  $huerfanos = @($remotos | Where-Object { $_ -match $patronBundle -and $vigentes -notcontains $_ })

  if ($huerfanos.Count -eq 0) {
    Write-Host '    no hay bundles huérfanos' -ForegroundColor DarkGray
    return
  }

  if ($WhatIfOnly) {
    Write-Host ("    borraría {0}:" -f $huerfanos.Count) -ForegroundColor Yellow
    $huerfanos | ForEach-Object { "      assets/$_" }
    return
  }

  $comandos = @('-s', '-S', '--connect-timeout', '30', '--max-time', '300', '--user', $cred)
  foreach ($h in $huerfanos) { $comandos += @('-Q', "DELE assets/$h") }
  $comandos += "ftp://$ftpHost$RemoteRoot/"

  curl.exe @comandos 2>&1 | Out-Null

  if ($LASTEXITCODE -eq 0) {
    Write-Host ("    {0} bundles antiguos eliminados" -f $huerfanos.Count) -ForegroundColor Green
    $huerfanos | ForEach-Object { "      assets/$_" }
  } else {
    Write-Host ("    no se pudieron borrar (curl {0}); no afecta al despliegue" -f $LASTEXITCODE) -ForegroundColor DarkYellow
  }
}

# --- 1. Compilar ------------------------------------------------------------

if (-not $SkipBuild) {
  Write-Host '==> Compilando el frontend' -ForegroundColor Cyan
  Push-Location (Join-Path $repo 'frontend')
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build falló con código $LASTEXITCODE" }
  } finally { Pop-Location }
}

# --- 2. Ensamblar -----------------------------------------------------------

Write-Host '==> Ensamblando el paquete' -ForegroundColor Cyan
$stage = Join-Path ([System.IO.Path]::GetTempPath()) 'ppg-deploy'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

Copy-Item (Join-Path $repo 'frontend\dist\*') $stage -Recurse -Force
Copy-Item (Join-Path $repo 'deploy\htaccess-root') (Join-Path $stage '.htaccess') -Force

$api = Join-Path $stage 'api'
New-Item -ItemType Directory -Force -Path $api | Out-Null
Copy-Item (Join-Path $repo 'backend\public\index.php') $api -Force
Copy-Item (Join-Path $repo 'backend\src') $api -Recurse -Force

# Los .htaccess de bloqueo son código: se refrescan siempre.
foreach ($d in 'src', 'data', 'config', 'storage') {
  New-Item -ItemType Directory -Force -Path (Join-Path $api $d) | Out-Null
  Copy-Item (Join-Path $repo 'deploy\htaccess-deny') (Join-Path $api "$d\.htaccess") -Force
}

# El directorio de subidas necesita su .htaccess aunque esté vacío.
$uploads = Join-Path $stage 'assets\uploads'
New-Item -ItemType Directory -Force -Path $uploads | Out-Null
Copy-Item (Join-Path $repo 'deploy\htaccess-uploads') (Join-Path $uploads '.htaccess') -Force

# Contenido y credenciales: sólo se preparan si se pidió sembrar o empujar.
$seedFiles = @()

if ($SeedContent -or $PushContent) {
  Copy-Item (Join-Path $repo 'backend\data\*') (Join-Path $api 'data') -Recurse -Force -Exclude '.backups'
  $seedFiles += (Get-ChildItem (Join-Path $api 'data') -Recurse -File |
    Where-Object { $_.Name -ne '.htaccess' })
}

if ($SeedAuth) {
  $usersFile = Join-Path $repo 'backend\config\users.json'
  if (-not (Test-Path $usersFile)) { throw "No existe $usersFile. Genera las credenciales primero." }
  Copy-Item $usersFile (Join-Path $api 'config') -Force
  $seedFiles += Get-Item (Join-Path $api 'config\users.json')
}

$seedPaths = @($seedFiles | ForEach-Object { $_.FullName })
$all = Get-ChildItem $stage -Recurse -File
$code = $all | Where-Object { $seedPaths -notcontains $_.FullName }

$totalMb = [math]::Round((($all | Measure-Object Length -Sum).Sum) / 1MB, 2)
Write-Host ("    {0} archivos de código, {1} sembrados, {2} MB en total" -f $code.Count, $seedFiles.Count, $totalMb)

if ($WhatIfOnly) {
  Write-Host "==> WhatIf: paquete listo en $stage, no se sube nada" -ForegroundColor Yellow

  $previo = Read-Manifiesto

  $all | ForEach-Object {
    $rel = $_.FullName.Substring($stage.Length + 1)
    $clave = $rel.Replace('\', '/')

    $tag = if ($seedPaths -contains $_.FullName) { '[siembra]  ' }
    elseif ($previo[$clave] -eq (Get-Huella $_.FullName)) { '[sin cambio]' }
    else { '[sube]     ' }

    "    $tag $rel"
  }

  if ($LimpiarAssets) { Remove-BundlesHuerfanos $stage }

  return
}

# --- 3. Subir ---------------------------------------------------------------

# `index.html` se sube el último, y a propósito.
#
# Es el único archivo que nombra a los demás: apunta a `assets/index-<hash>.js`.
# Si sube primero, durante el resto de la transferencia el servidor entrega el
# HTML nuevo pidiendo un bundle que todavía no está → 404 → página en blanco
# para quien entre en ese momento. Subiéndolo al final, el HTML viejo sigue
# apuntando a los assets viejos —que siguen ahí, porque el hash del nombre
# cambia con el contenido— y el cambio es instantáneo.
$ultimo, $primero = @($all).Where({ $_.FullName -eq (Join-Path $stage 'index.html') }, 'Split')
$orden = @($primero) + @($ultimo)

Write-Host "==> Subiendo a ftp://$ftpHost$RemoteRoot" -ForegroundColor Cyan
$ok = 0; $skipped = 0; $sinCambios = 0; $fail = @()

$manifiesto = Read-Manifiesto
$nuevoManifiesto = @{}

# Cada archivo con su destino ya resuelto; los de siembra se apartan porque
# necesitan preguntar primero si ya existen en el servidor.
$cola = @()

foreach ($f in $orden) {
  $rel = $f.FullName.Substring($stage.Length + 1).Replace('\', '/')
  $remote = "$RemoteRoot/$rel"
  $isSeed = $seedPaths -contains $f.FullName
  $huella = Get-Huella $f.FullName

  # Un archivo de siembra no pisa lo que ya vive en el servidor.
  if ($isSeed -and -not $PushContent) {
    if (Test-RemoteFile $remote) {
      $skipped++
      Write-Host ("    OMITE {0} (ya existe en el servidor)" -f $rel) -ForegroundColor DarkGray
      continue
    }
  }

  # Idéntico a lo que se subió la última vez: no se vuelve a mandar.
  if (-not $isSeed -and $manifiesto[$rel] -eq $huella) {
    $sinCambios++
    $nuevoManifiesto[$rel] = $huella
    continue
  }

  $cola += [pscustomobject]@{ Local = $f.FullName; Remote = $remote; Rel = $rel; Huella = $huella }
}

if ($sinCambios -gt 0) {
  Write-Host ("    {0} archivos sin cambios desde el último despliegue" -f $sinCambios) -ForegroundColor DarkGray
}

if ($cola.Count -eq 0) {
  Write-Host '    nada que subir: el servidor ya tiene esta versión' -ForegroundColor Green
}

# `index.html` se queda fuera de los lotes: va solo y el último, por lo que se
# explica arriba.
$indexRel = 'index.html'
$paquetes = @($cola | Where-Object { $_.Rel -ne $indexRel })
$indice = @($cola | Where-Object { $_.Rel -eq $indexRel })

$tamanoLote = 12

for ($i = 0; $i -lt $paquetes.Count; $i += $tamanoLote) {
  $lote = @($paquetes[$i..([math]::Min($i + $tamanoLote - 1, $paquetes.Count - 1))])
  $desde = $i + 1
  $hasta = $i + $lote.Count

  Write-Host ("    lote {0}-{1} de {2}" -f $desde, $hasta, $paquetes.Count) -ForegroundColor DarkGray

  if (Send-BatchConReintento $lote) {
    $ok += $lote.Count
    $lote | ForEach-Object {
      Write-Host ("    OK    {0}" -f $_.Rel)
      $nuevoManifiesto[$_.Rel] = $_.Huella
    }
  } else {
    # El lote entero falló: se reintenta archivo a archivo para saber cuál.
    foreach ($f in $lote) {
      if (Send-File $f.Local $f.Remote) {
        $ok++
        $nuevoManifiesto[$f.Rel] = $f.Huella
        Write-Host ("    OK    {0}" -f $f.Rel)
      } else {
        $fail += $f.Rel
        Write-Host ("    FALLO {0} (curl {1})" -f $f.Rel, $LASTEXITCODE) -ForegroundColor Red
      }
    }
  }

  Start-Sleep -Seconds 2
}

foreach ($f in $indice) {
  if (Send-File $f.Local $f.Remote) {
    $ok++
    $nuevoManifiesto[$f.Rel] = $f.Huella
    Write-Host ("    OK    {0}" -f $f.Rel) -ForegroundColor Green
  } else {
    $fail += $f.Rel
    Write-Host ("    FALLO {0} (curl {1})" -f $f.Rel, $LASTEXITCODE) -ForegroundColor Red
  }
}

# Sólo se anota lo que de verdad llegó: si algo falló, el próximo despliegue
# vuelve a intentarlo en vez de darlo por puesto.
Write-Manifiesto $nuevoManifiesto

# --- 4. Bundles huérfanos ---------------------------------------------------
#
# Los nombres de `assets/` llevan el hash del contenido, así que cada build
# publica archivos nuevos y los viejos se quedan ahí para siempre. No estorban
# —nadie los pide—, pero se acumulan. Se borran sólo si se pide, y sólo los que
# encajan en el patrón de bundle con hash: nunca imágenes ni nada subido desde
# el panel.

if ($LimpiarAssets) { Remove-BundlesHuerfanos $stage }

Write-Host ""
Write-Host ("==> {0} subidos, {1} sin cambios, {2} omitidos, {3} fallidos" -f $ok, $sinCambios, $skipped, $fail.Count) -ForegroundColor Green

if (-not ($SeedContent -or $PushContent)) {
  Write-Host '    data/ no se tocó: el contenido del CMS queda intacto.' -ForegroundColor DarkGray
}

if ($fail.Count -gt 0) {
  Write-Host '==> Fallaron:' -ForegroundColor Red
  $fail | ForEach-Object { "    $_" }
  exit 1
}
