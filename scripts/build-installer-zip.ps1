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
 SYNAPSE DRIVE - JOY SLOT CAR
 INSTALADOR USBasp + ATUALIZADOR DE FIRMWARE
================================================================

  >> LEIA ATE O FIM ANTES DE COMECAR. SAO 4 PASSOS SIMPLES. <<

Este pacote contem TUDO o que voce precisa para configurar o
gravador USBasp no Windows e atualizar o firmware do seu
equipamento Joy Slot Car.

================================================================
 ANTES DE COMECAR - VOCE VAI PRECISAR DE:
================================================================

  Para gravar o firmware, voce precisa de DOIS itens de hardware
  conectados ao computador:

  1. PROGRAMADOR USBasp
     Pequeno dispositivo USB que faz a comunicacao entre o
     computador e o equipamento.

  2. CABO ADAPTADOR de 10 PINOS para 6 PINOS
     Liga o USBasp (saida 10 pinos) ao equipamento Joy Slot Car
     (entrada 6 pinos). Geralmente vem junto com o USBasp num
     mesmo kit.

  Sem esses 2 itens, o instalador nao vai detectar nada
  e a gravacao nao vai funcionar.

  ----------------------------------------------------------------
   ONDE COMPRAR
  ----------------------------------------------------------------

  Os componentes sao facilmente encontrados em marketplaces
  online. Pesquise pelo termo:

      "dispositivo USBasp com cabo e adaptador
       de 10 pinos para 6 pinos"

  Marketplaces sugeridos:
    - Mercado Livre  (mercadolivre.com.br)
    - AliExpress     (aliexpress.com)
    - Shopee         (shopee.com.br)

================================================================
 PASSO 1 - EXTRAIR ESTE PACOTE
================================================================

Voce ja extraiu este ZIP, certo? Otimo. Se nao extraiu, faca:

  1. Volte para a pasta onde esta o "synapse-installer-windows.zip"
  2. Clique com o BOTAO DIREITO no arquivo
  3. Escolha "Extrair tudo..."
  4. Salve em um lugar facil (ex: Area de Trabalho)
  5. Abra a pasta extraida e leia este texto novamente.

  >> NAO rode os arquivos de dentro do ZIP. Sempre EXTRAIA antes. <<

================================================================
 PASSO 2 - INSTALAR O DRIVER (FAZ UMA VEZ SO)
================================================================

  Antes de qualquer coisa: conecte o gravador USBasp em uma
  porta USB. O LED dele vai acender.

  1. Procure nesta pasta o arquivo "Install-Via-Zadig.bat".
  2. Clique com o BOTAO DIREITO em "Install-Via-Zadig.bat".
  3. Escolha "Executar como administrador".
  4. Se aparecer o aviso azul "O Windows protegeu seu PC",
     clique em "Mais informacoes" -> "Executar assim mesmo".
  5. Se o Windows pedir confirmacao (UAC), clique em "Sim".
  6. O programa Zadig vai abrir automaticamente.

  >> Use o "Install-Via-Zadig.bat" porque ele resolve melhor
     problemas de assinatura digital do Windows 10/11.

  ============================================================
   O QUE O APP FAZ AUTOMATICAMENTE PRA VOCE:
  ============================================================

  >> Detecta o gravador USBasp conectado na USB.
  >> Abre o Zadig ja com o dispositivo USBasp selecionado.
  >> Configura o driver correto (libusb-win32).
  >> Voce nao precisa procurar nada na lista.

  ============================================================
   IMPORTANTE - CONFIRMACAO DE SEGURANCA:
  ============================================================

  >> Antes de aplicar o driver, o app vai pedir UMA
     CONFIRMACAO sua no terminal (janela preta).

  >> NESSE MOMENTO, OLHE A JANELA DO ZADIG e confirme
     que o dispositivo mostrado e exatamente:

         USBasp

  >> Se aparecer outro nome (mouse, teclado, receptor
     USB, webcam...), CANCELE digitando "N" + Enter
     e entre em contato com o suporte. Voce nao deve
     instalar o driver em outro dispositivo - eles podem
     parar de funcionar.

  >> Se estiver tudo certo, digite "S" + Enter para
     aplicar o driver.

  >> Aguarde a mensagem: "Driver Installation: SUCCESS"
  >> Feche o Zadig.

  ============================================================
   PLANO B - SE O ZADIG NAO MOSTRAR "USBasp":
  ============================================================

  Em casos raros (driver antigo, USB com mau contato), o app
  pode nao conseguir selecionar o USBasp automaticamente. Nesse
  caso, escolha manualmente:

  1. Digite "N" + Enter no terminal para cancelar (mas
     NAO feche a janela do Zadig).
  2. No menu do Zadig, clique em:
        Options -> List All Devices
  3. Procure "USBasp" na lista que aparecer e selecione.
  4. Confirme que o driver a direita esta em "libusb-win32"
     (use as setinhas <- e -> se precisar).
  5. Clique no botao verde "Reinstall Driver".
  6. Aguarde "Driver Installation: SUCCESS".

  ATENCAO: mesmo nesse modo manual, NUNCA selecione outro
  dispositivo que nao o USBasp. Se "USBasp" nao aparecer na
  lista, desconecte e reconecte o gravador, ou contate o
  suporte.

================================================================
 PASSO 3 - VERIFICAR SE DEU TUDO CERTO
================================================================

  1. De 2 cliques em "Verify.bat".
  2. Vai abrir uma janela preta (Prompt de Comando).
  3. Aguarde a mensagem aparecer.

  >> SE APARECER: "USBasp encontrado e funcionando"
     -> Otimo! Va para o passo 4.

  >> SE APARECER ERRO:
     1. Feche a janela.
     2. Clique com o botao DIREITO em "Repair.bat".
     3. Escolha "Executar como administrador".
     4. Repita o PASSO 2 deste tutorial.

================================================================
 PASSO 4 - BAIXAR E GRAVAR O FIRMWARE
================================================================

  Esta parte voce repete sempre que sair um firmware novo.

  1. Va no site oficial: https://drive.synapseia.com.br
  2. Role para baixo ate "Firmwares disponiveis".
  3. Clique em "Baixar" no firmware desejado.
  4. Salve o arquivo .hex/.bin NESTA MESMA PASTA do instalador.

  5. Conecte o gravador USBasp ao seu equipamento Joy Slot Car
     (usando o cabo apropriado).

  6. De 2 cliques em "Trozoba.exe".
  7. Selecione o arquivo de firmware que voce baixou.
  8. Aguarde a gravacao terminar.

  >> PRONTO! Seu equipamento esta com o firmware atualizado. <<

================================================================
 RESOLVENDO PROBLEMAS COMUNS
================================================================

  PROBLEMA: "Acesso negado" ao executar Install-Via-Zadig.bat
  SOLUCAO:  Clique com BOTAO DIREITO no .bat e escolha
            "Executar como administrador".

  PROBLEMA: "O Windows protegeu seu PC" (tela azul)
  SOLUCAO:  Clique em "Mais informacoes" -> "Executar
            assim mesmo". Os arquivos sao seguros.

  PROBLEMA: Instalei o driver no dispositivo errado!
  SOLUCAO:  Execute "Restore-WrongLibusbDriver.bat" como
            administrador. O programa detecta dispositivos
            que receberam o driver por engano e restaura
            o driver original.

  PROBLEMA: USBasp nao encontrado apos reiniciar o PC.
  SOLUCAO:  Conecte o gravador USB ANTES de rodar Verify.bat.
            Se persistir, rode Repair.bat como admin.

  PROBLEMA: Trozoba.exe trava ou nao detecta o USBasp.
  SOLUCAO:  1) Confirme que o LED do gravador esta aceso.
            2) Rode Verify.bat para confirmar instalacao.
            3) Se mesmo assim falhar, contate o suporte.

================================================================
 LISTA DOS ARQUIVOS DESTE PACOTE
================================================================

  Install-Via-Zadig.bat          -> Instala o driver USBasp (RECOMENDADO)
  Install.bat                    -> Metodo alternativo (sem GUI do Zadig)
  Verify.bat                     -> Verifica se driver esta OK
  Repair.bat                     -> Conserta instalacao quebrada
  Restore-WrongLibusbDriver.bat  -> Reverte driver em outro USB

  Trozoba.exe                    -> Atualizador de firmware
  Zadig.exe / zadig-2.4.exe      -> Instalador grafico de driver
  avrdude.exe + avrdude.conf     -> Linha de comando avancada

  drivers\                       -> Arquivos do driver libusb-win32
  Synapse.ico                    -> Icone do programa

================================================================
 SUPORTE
================================================================

  Para qualquer duvida, problema ou sugestao, entre em
  contato pelo email:

         joy.slotcar@gmail.com

  Site oficial: https://drive.synapseia.com.br

  Versao deste pacote: 1.0
  Compativel com: Windows 10 e Windows 11 (x64)

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
