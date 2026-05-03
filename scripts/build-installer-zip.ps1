<#
.SYNOPSIS
    Empacota a pasta original "Synapse Drive Installation" num .zip que sera
    servido pelo frontend (Netlify) como "Baixar instalador (Windows)".

.DESCRIPTION
    Le os arquivos da pasta de origem (parametro -Source ou padrao
    "C:\App - Dev\Synapse Drive Installation"), inclui um LEIA-ME-PRIMEIRO.txt
    com instrucoes de uso, e gera o zip em
    apps/frontend/public/downloads/synapse-installer-windows.zip.

    O Vite copia automaticamente o diretorio public/ pro dist/ no build,
    e o Netlify serve o arquivo em
    https://drive.synapseia.com.br/downloads/synapse-installer-windows.zip.

.EXAMPLE
    pwsh -File scripts/build-installer-zip.ps1
    pwsh -File scripts/build-installer-zip.ps1 -Source "D:\meu-pacote"
#>

param(
    [string]$Source = "C:\App - Dev\Synapse Drive Installation",
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Source)) {
    Write-Error "Pasta de origem nao encontrada: $Source"
    exit 1
}

$stage = Join-Path $RepoRoot ".tmp-installer-stage"
$downloadsDir = Join-Path $RepoRoot "apps\frontend\public\downloads"
$zipPath = Join-Path $downloadsDir "synapse-installer-windows.zip"

Write-Host "==> Limpando staging anterior..."
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

# Itens copiados pro pacote (whitelist - evita arrastar lixo de build local).
$itensCopiar = @(
    "avrdude.conf",
    "avrdude.exe",
    "Install-USBaspDriver.ps1",
    "Install-Via-Zadig.bat",
    "Install-Via-Zadig.ps1",
    "Install.bat",
    "README.md",
    "Repair-USBaspBinding.ps1",
    "Repair.bat",
    "Restore-WrongLibusbDriver.bat",
    "Restore-WrongLibusbDriver.ps1",
    "Synapse.ico",
    "Trozoba.exe",
    "Uninstall-USBaspDriver.ps1",
    "usbasp-preset.cfg",
    "Verify-USBaspDriver.ps1",
    "Verify.bat",
    "zadig-2.4.exe",
    "Zadig.exe",
    "zadig.ini",
    "drivers"
)

Write-Host "==> Copiando arquivos relevantes..."
foreach ($item in $itensCopiar) {
    $orig = Join-Path $Source $item
    if (Test-Path $orig) {
        Copy-Item -Path $orig -Destination $stage -Recurse -Force
        Write-Host "  + $item"
    } else {
        Write-Host "  ! $item (nao encontrado, pulando)" -ForegroundColor Yellow
    }
}

Write-Host "==> Gerando LEIA-ME-PRIMEIRO.txt..."
$readme = @"
================================================================
 SYNAPSE DRIVE - INSTALADOR USBasp + ATUALIZADOR DE FIRMWARE
================================================================

Este pacote contem todas as ferramentas necessarias para
configurar o gravador USBasp no Windows e atualizar o firmware
do equipamento Trozoba.

----------------------------------------------------------------
PASSO 1 - INSTALAR O DRIVER (UMA VEZ POR PC)
----------------------------------------------------------------

1. Conecte o gravador USBasp na porta USB.
2. Clique com o botao DIREITO em "Install.bat".
3. Escolha "Executar como administrador".
4. Aguarde a janela do Zadig abrir.
5. NA JANELA DO ZADIG, confirme que o dispositivo selecionado
   E o "USBasp" (NAO outro dispositivo USB!).
6. Confirme o driver "libusb-win32" e clique em Reinstall Driver.
7. Aguarde a mensagem "Driver instalado com sucesso".

ATENCAO: Se o Zadig listar varios dispositivos, escolha
EXATAMENTE o "USBasp". NUNCA escolha mouse, teclado ou
receptor USB de outros perifericos - voce pode quebrar
esses dispositivos.

----------------------------------------------------------------
PASSO 2 - VERIFICAR INSTALACAO
----------------------------------------------------------------

Clique 2 vezes em "Verify.bat". Deve aparecer:
   "USBasp encontrado e funcionando corretamente."

Se aparecer erro, execute "Repair.bat" (como admin) e tente
o passo 1 de novo.

----------------------------------------------------------------
PASSO 3 - GRAVAR O FIRMWARE
----------------------------------------------------------------

1. Acesse https://drive.synapseia.com.br
2. Baixe o arquivo .hex/.bin do firmware desejado.
3. Salve o arquivo na MESMA pasta deste pacote.
4. Execute "Trozoba.exe" e siga as instrucoes para selecionar
   o arquivo e gravar.

OU manualmente via avrdude (avancado):
   avrdude -C avrdude.conf -c usbasp -p atmega328p -U flash:w:firmware.hex

----------------------------------------------------------------
PROBLEMAS COMUNS
----------------------------------------------------------------

* Driver instalado em dispositivo errado -> rode
  Restore-WrongLibusbDriver.bat como admin.
* USBasp nao encontrado apos reboot -> conecte o gravador
  ANTES de rodar Verify.bat.
* Erro de assinatura digital no Windows 10/11 -> reinicie
  o PC se persistir.

----------------------------------------------------------------
SUPORTE
----------------------------------------------------------------

Email: suporte@synapseia.com.br
Site:  https://synapseia.com.br

Versao deste pacote: 1.0
Compativel com Windows 10/11 (x64).

================================================================
"@
$readmePath = Join-Path $stage "LEIA-ME-PRIMEIRO.txt"
Set-Content -Path $readmePath -Value $readme -Encoding UTF8

if (-not (Test-Path $downloadsDir)) {
    New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
}

Write-Host "==> Gerando ZIP..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Push-Location $stage
try {
    & tar.exe -a -cf $zipPath *
    if ($LASTEXITCODE -ne 0) {
        throw "tar falhou (exit $LASTEXITCODE)"
    }
} finally {
    Pop-Location
}

if (-not (Test-Path $zipPath)) {
    Write-Error "ZIP nao foi criado."
    exit 1
}

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "==> SUCESSO" -ForegroundColor Green
Write-Host ("  Arquivo : $zipPath")
Write-Host ("  Tamanho : $sizeMB MB")
Write-Host ""
Write-Host "Limpando staging..."
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Proximos passos:"
Write-Host "  1. cd apps/frontend && pnpm build"
Write-Host "  2. Faca drag-and-drop de apps/frontend/dist/ no Netlify"
Write-Host "  3. Teste em https://drive.synapseia.com.br/downloads/synapse-installer-windows.zip"
