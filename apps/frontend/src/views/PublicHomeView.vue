<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { Firmware } from '@synapse/shared';
import { publicApi } from '@/api/public';
import { extractErrorMessage } from '@/api/http';
import { formatBytes, formatDate, shortHash } from '@/lib/format';
import AppBadge from '@/components/AppBadge.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import EmptyState from '@/components/EmptyState.vue';

const firmwares = ref<Firmware[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const openFaq = ref<number | null>(null);
const copiedSearch = ref(false);

// Estado de cada box colapsável.
// Acessórios começa ABERTO (é pré-requisito; primeira coisa que o usuário vê).
// Os 3 passos da sequência começam fechados — usuário expande na ordem.
const expanded = reactive<Record<string, boolean>>({
  hardware: true,
  instalacao: false,
  gravacao: false,
  calibracao: false,
});

function toggle(key: keyof typeof expanded) {
  expanded[key] = !expanded[key];
}

const INSTALLER_URL = '/downloads/synapse-installer-windows.zip';
const INSTALLER_FILENAME = 'synapse-installer-windows.zip';

const SUPPORT_EMAIL = 'joy.slotcar@gmail.com';

const HARDWARE_SEARCH_TERM = 'dispositivo USBasp com cabo e adaptador de 10 pinos para 6 pinos';

const marketplaces = [
  {
    name: 'Mercado Livre',
    url: `https://lista.mercadolivre.com.br/${encodeURIComponent(HARDWARE_SEARCH_TERM)}`,
    color: 'bg-yellow-400 text-slate-900 hover:bg-yellow-500',
  },
  {
    name: 'AliExpress',
    url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(
      'usbasp programmer 10 pin 6 pin adapter cable'
    )}`,
    color: 'bg-orange-500 text-white hover:bg-orange-600',
  },
  {
    name: 'Shopee',
    url: `https://shopee.com.br/search?keyword=${encodeURIComponent(HARDWARE_SEARCH_TERM)}`,
    color: 'bg-orange-600 text-white hover:bg-orange-700',
  },
];

const faq = [
  {
    q: 'Preciso instalar o driver toda vez que vou atualizar o firmware?',
    a: 'Não. O driver USBasp só precisa ser instalado UMA VEZ por computador. Depois disso, basta conectar o gravador e usar o Trozoba.exe para gravar firmwares novos.',
  },
  {
    q: 'Preciso recalibrar o gatilho a cada atualização de firmware?',
    a: 'SIM. A calibração é obrigatória sempre que o firmware do Synapse Lite for atualizado. Sem recalibrar, as posições de repouso e máximo do gatilho podem ser interpretadas de forma incorreta. O processo leva alguns segundos — veja o passo 3 desta página.',
  },
  {
    q: 'Preciso escolher manualmente o USBasp na lista do Zadig?',
    a: 'Não. O instalador detecta o USBasp automaticamente e já abre o Zadig com o dispositivo correto selecionado. O que você precisa fazer é confirmar visualmente: olhe a janela do Zadig e confirme que o dispositivo ali é exatamente "USBasp" — depois digite S + Enter na janela preta do terminal pra aplicar. Se o dispositivo na janela do Zadig for outro (mouse, teclado, etc.), digite N + Enter pra cancelar e contate o suporte.',
  },
  {
    q: 'Quando rodo o Install-Via-Zadig.bat, aparece "Acesso negado" ou "Permission denied".',
    a: 'O instalador precisa rodar como administrador. Clique com o BOTÃO DIREITO em Install-Via-Zadig.bat e escolha "Executar como administrador". Se aparecer um aviso azul do Windows ("O Windows protegeu seu PC"), clique em "Mais informações" → "Executar assim mesmo".',
  },
  {
    q: 'Instalei o driver no dispositivo errado por engano. Como reverto?',
    a: 'Dentro da pasta do instalador, execute como administrador o arquivo Restore-WrongLibusbDriver.bat. Ele detecta dispositivos USB que receberam o driver libusb por engano e restaura o driver original do Windows.',
  },
  {
    q: 'Os LEDs não apagam ao final da calibração. O que faço?',
    a: 'Significa que a calibração falhou. Repita todo o procedimento desde o início, garantindo: (1) o gatilho totalmente em repouso ao confirmar INÍCIO; (2) o gatilho totalmente pressionado ao confirmar FIM; (3) o botão Setup só pressionado quando o LED indicado estiver aceso.',
  },
  {
    q: 'O Trozoba.exe trava ou não detecta o USBasp.',
    a: 'Verifique três coisas: (1) o gravador USBasp está fisicamente conectado em uma porta USB; (2) o LED do gravador está aceso; (3) você rodou o Verify.bat e ele confirmou "USBasp encontrado". Se ainda assim não funcionar, rode o Repair.bat como administrador.',
  },
  {
    q: 'Posso usar este programa em qualquer Windows?',
    a: 'Sim, em qualquer Windows 10 ou 11 de 64 bits. Não testamos em versões mais antigas (Windows 7/8) — o driver pode não funcionar nelas.',
  },
];

onMounted(async () => {
  try {
    firmwares.value = await publicApi.listActiveFirmwares();
  } catch (err) {
    error.value = extractErrorMessage(err, 'Não foi possível carregar a lista de firmwares.');
  } finally {
    loading.value = false;
  }
});

function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i;
}

async function copySearchTerm() {
  try {
    await navigator.clipboard.writeText(HARDWARE_SEARCH_TERM);
    copiedSearch.value = true;
    setTimeout(() => {
      copiedSearch.value = false;
    }, 2000);
  } catch {
    copiedSearch.value = false;
  }
}
</script>

<template>
  <!-- ======================================================== -->
  <!-- HERO MINIMALISTA -->
  <!-- ======================================================== -->
  <section class="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-white">
    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700" />
    <div class="mx-auto max-w-4xl px-6 py-12 text-center sm:py-16">
      <span class="badge badge-brand">Joy Slot Car</span>
      <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Atualização do firmware do
        <span class="text-brand-600">Synapse Lite</span>
      </h1>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- BOX 0: ACESSÓRIOS NECESSÁRIOS (pré-requisito, expandido) -->
  <!-- ======================================================== -->
  <section id="hardware" class="bg-slate-50 py-10">
    <div class="mx-auto max-w-4xl px-6">
      <article
        :class="[
          'overflow-hidden rounded-xl bg-white shadow-card transition-all',
          'border-2',
          expanded.hardware
            ? 'border-brand-600 ring-4 ring-brand-100'
            : 'border-brand-300 hover:border-brand-500',
        ]"
      >
        <button
          type="button"
          class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-brand-50/50"
          :aria-expanded="expanded.hardware"
          @click="toggle('hardware')"
        >
          <span class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-slate-700 text-base font-bold text-white">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-2a4 4 0 0 1 4-4h2M9 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10-7v-1a3 3 0 0 0-3-3h-1m4 4l-3-3m3 3l-3 3" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-base font-semibold text-slate-900">
              Acessórios necessários
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              USBasp + cabo 10 pinos + adaptador 10→6 pinos. Pré-requisito antes de iniciar.
            </p>
          </div>
          <span class="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 sm:inline-flex">
            Pré-requisito
          </span>
          <svg
            class="h-5 w-5 flex-none text-slate-400 transition-transform"
            :class="{ 'rotate-180': expanded.hardware }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-show="expanded.hardware" class="border-t-2 border-brand-100 px-5 py-6">
          <figure class="mx-auto max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img
              src="/images/usbasp-hardware-kit.png"
              alt="Kit USBasp com cabo de 10 pinos e adaptador de 6 pinos conectado ao Synapse Lite"
              class="h-auto w-full"
              loading="lazy"
            />
            <figcaption class="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500">
              <strong class="font-semibold text-slate-700">Figura 1.</strong>
              USBasp + cabo de 10 pinos + adaptador 10→6 pinos conectado à porta
              do Synapse Lite.
            </figcaption>
          </figure>

          <div class="mt-6 grid gap-5 lg:grid-cols-5">
            <div class="lg:col-span-3">
              <h4 class="text-sm font-semibold text-slate-900">O que você precisa ter</h4>
              <ul class="mt-3 space-y-3 text-sm text-slate-700">
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    1
                  </span>
                  <div>
                    <p class="font-semibold">Programador USBasp + cabo de 10 pinos</p>
                    <p class="mt-0.5 text-xs text-slate-600">
                      Placa azul com USB de um lado e cabo flat de 10 pinos do outro.
                      Faz a comunicação entre o computador e o equipamento.
                    </p>
                  </div>
                </li>
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    2
                  </span>
                  <div>
                    <p class="font-semibold">Adaptador de 10 pinos para 6 pinos</p>
                    <p class="mt-0.5 text-xs text-slate-600">
                      Pequena placa azul com 2 conectores. Liga o cabo de 10 pinos
                      à porta de 6 pinos do <strong>Synapse Lite</strong>.
                    </p>
                  </div>
                </li>
              </ul>

              <div class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                ⚠ <strong>Ordem de conexão:</strong>
                USB do computador → USBasp → cabo 10p → adaptador 10→6p →
                porta de 6 pinos do equipamento.
              </div>
            </div>

            <div class="lg:col-span-2">
              <h4 class="text-sm font-semibold text-slate-900">Onde comprar</h4>

              <div class="mt-3 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 p-3">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Termo de busca
                </p>
                <p class="mt-1 text-xs font-semibold leading-snug text-brand-900">
                  "{{ HARDWARE_SEARCH_TERM }}"
                </p>
                <button
                  type="button"
                  class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-brand-300 transition hover:bg-brand-100"
                  @click="copySearchTerm"
                >
                  <svg
                    v-if="!copiedSearch"
                    class="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                  </svg>
                  <svg
                    v-else
                    class="h-3 w-3 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ copiedSearch ? 'Copiado!' : 'Copiar termo' }}
                </button>
              </div>

              <p class="mt-4 text-xs font-semibold text-slate-700">Buscar diretamente em:</p>
              <div class="mt-2 grid grid-cols-1 gap-2">
                <a
                  v-for="m in marketplaces"
                  :key="m.name"
                  :href="m.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="['inline-flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs font-medium transition', m.color]"
                >
                  <span>{{ m.name }}</span>
                  <svg class="h-3.5 w-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- SEQUÊNCIA DE INSTALAÇÃO (boxes 1, 2, 3) -->
  <!-- ======================================================== -->
  <section id="instalacao" class="bg-white py-12">
    <div class="mx-auto max-w-4xl px-6">
      <div class="text-center">
        <span class="badge badge-brand">Sequência</span>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Siga os 3 passos na ordem
        </h2>
      </div>

      <div class="mt-8 space-y-3">
        <!-- ============== BOX 1: INSTALAÇÃO DO DRIVER ============== -->
        <article
          :class="[
            'overflow-hidden rounded-xl bg-white shadow-card transition-all',
            'border-2',
            expanded.instalacao
              ? 'border-brand-600 ring-4 ring-brand-100'
              : 'border-brand-300 hover:border-brand-500',
          ]"
        >
          <button
            type="button"
            class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-brand-50/50"
            :aria-expanded="expanded.instalacao"
            @click="toggle('instalacao')"
          >
            <span class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
              1
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-base font-semibold text-slate-900">
                Instalar o driver USBasp
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Baixar o instalador, extrair, conectar o gravador e rodar
                <code class="rounded bg-slate-100 px-1 py-0.5 text-[11px]">Install-Via-Zadig.bat</code>.
              </p>
            </div>
            <svg
              class="h-5 w-5 flex-none text-slate-400 transition-transform"
              :class="{ 'rotate-180': expanded.instalacao }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-show="expanded.instalacao" class="border-t-2 border-brand-100 px-5 py-6">
            <!-- 1.1 Baixar e extrair -->
            <div class="mb-6">
              <h4 class="text-sm font-semibold text-slate-900">
                <span class="mr-1 text-brand-600">1.1</span> Baixar e extrair o instalador
              </h4>
              <p class="mt-2 text-xs text-slate-600">
                Clique no botão abaixo para baixar o ZIP de ~12 MB com todas
                as ferramentas:
              </p>
              <a
                :href="INSTALLER_URL"
                :download="INSTALLER_FILENAME"
                class="btn btn-primary mt-3 px-4 py-2 text-sm"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                </svg>
                Baixar instalador (Windows)
              </a>
              <div class="mt-4 rounded-md bg-slate-50 p-4 text-xs text-slate-600 ring-1 ring-slate-200">
                <p class="font-semibold text-slate-700">Como extrair:</p>
                <ol class="mt-2 list-decimal space-y-1 pl-5">
                  <li>Botão direito no arquivo ZIP baixado.</li>
                  <li>Escolha <strong>"Extrair tudo..."</strong>.</li>
                  <li>Selecione uma pasta fácil (ex: a Área de Trabalho).</li>
                  <li>Clique em <strong>"Extrair"</strong> e abra a pasta extraída.</li>
                </ol>
                <p class="mt-3 text-amber-700">
                  💡 Sempre <strong>extraia</strong> antes de rodar.
                  NÃO execute os arquivos diretamente de dentro do ZIP.
                </p>
              </div>
            </div>

            <!-- 1.2 Conectar e instalar driver -->
            <div class="mb-6">
              <h4 class="text-sm font-semibold text-slate-900">
                <span class="mr-1 text-brand-600">1.2</span> Conectar o USBasp e rodar o instalador
              </h4>
              <p class="mt-2 text-xs text-slate-600">
                Conecte o gravador USBasp em uma porta USB do computador
                (o LED dele vai acender). Depois, na pasta extraída:
              </p>
              <div class="mt-3 rounded-md bg-slate-50 p-4 text-xs text-slate-600 ring-1 ring-slate-200">
                <ol class="list-decimal space-y-1 pl-5">
                  <li>Botão direito em <code class="rounded bg-white px-1 py-0.5">Install-Via-Zadig.bat</code>.</li>
                  <li>Escolha <strong>"Executar como administrador"</strong>.</li>
                  <li>Se aparecer <em>"O Windows protegeu seu PC"</em>, clique em <strong>"Mais informações"</strong> → <strong>"Executar assim mesmo"</strong>.</li>
                  <li>Se o Windows pedir confirmação (UAC), clique em <strong>"Sim"</strong>.</li>
                  <li>O <strong>Zadig</strong> vai abrir automaticamente.</li>
                </ol>
              </div>

              <div class="mt-3 rounded-md border-l-4 border-emerald-400 bg-emerald-50 p-3">
                <p class="text-xs font-semibold text-emerald-900">
                  O app faz automaticamente:
                </p>
                <ul class="mt-1.5 space-y-0.5 pl-4 text-xs text-emerald-800">
                  <li>✓ Detecta o gravador USBasp.</li>
                  <li>✓ Seleciona o dispositivo certo no Zadig.</li>
                  <li>✓ Define o driver correto (libusb-win32).</li>
                </ul>
              </div>

              <div class="mt-2 rounded-md border-l-4 border-amber-400 bg-amber-50 p-3">
                <p class="text-xs font-semibold text-amber-900">
                  ⚠ Antes de aplicar — confirme no terminal:
                </p>
                <ul class="mt-1.5 space-y-0.5 pl-4 text-xs text-amber-800">
                  <li>• Olhe a janela do Zadig: deve mostrar <strong>"USBasp"</strong>.</li>
                  <li>• Se for outro dispositivo, digite <strong>N</strong> + Enter (cancela).</li>
                  <li>• Se for o USBasp, digite <strong>S</strong> + Enter para aplicar.</li>
                  <li>• Aguarde <strong>"Driver Installation: SUCCESS"</strong>.</li>
                </ul>
              </div>

              <details class="mt-2 rounded-md bg-slate-100 p-3">
                <summary class="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                  Plano B — se "USBasp" não aparecer no Zadig
                </summary>
                <ol class="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-600">
                  <li>Cancele com <strong>N</strong> + Enter (não feche o Zadig).</li>
                  <li>No Zadig: <strong>Options</strong> → <strong>List All Devices</strong>.</li>
                  <li>Procure <strong>USBasp</strong> na lista e selecione.</li>
                  <li>Confirme o driver à direita: <strong>libusb-win32</strong>.</li>
                  <li>Clique em <strong>Reinstall Driver</strong>.</li>
                </ol>
              </details>
            </div>

            <!-- 1.3 Verificar -->
            <div>
              <h4 class="text-sm font-semibold text-slate-900">
                <span class="mr-1 text-brand-600">1.3</span> Verificar se está tudo OK
              </h4>
              <p class="mt-2 text-xs text-slate-600">
                Antes de gravar firmware, confirme que o driver foi reconhecido.
                Dê <strong>2 cliques</strong> em <code class="rounded bg-slate-100 px-1 py-0.5 text-[11px]">Verify.bat</code>
                e aguarde a mensagem.
              </p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <div class="rounded-md bg-emerald-50 p-3 text-xs ring-1 ring-emerald-200">
                  <p class="font-semibold text-emerald-900">✓ Se aparecer:</p>
                  <p class="mt-1 font-mono text-[11px] text-emerald-800">"USBasp encontrado e funcionando"</p>
                  <p class="mt-1 text-emerald-700">→ Vá pro passo 2.</p>
                </div>
                <div class="rounded-md bg-red-50 p-3 text-xs ring-1 ring-red-200">
                  <p class="font-semibold text-red-900">✗ Se aparecer erro:</p>
                  <p class="mt-1 text-red-800">
                    Execute <code class="rounded bg-white px-1 py-0.5">Repair.bat</code> como admin e refaça o passo 1.2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- Seta sequencial -->
        <div class="flex flex-col items-center text-brand-500">
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span class="text-[11px] font-semibold uppercase tracking-wider">Próximo passo</span>
        </div>

        <!-- ============== BOX 2: GRAVAR FIRMWARE ============== -->
        <article
          :class="[
            'overflow-hidden rounded-xl bg-white shadow-card transition-all',
            'border-2',
            expanded.gravacao
              ? 'border-brand-600 ring-4 ring-brand-100'
              : 'border-brand-300 hover:border-brand-500',
          ]"
        >
          <button
            type="button"
            class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-brand-50/50"
            :aria-expanded="expanded.gravacao"
            @click="toggle('gravacao')"
          >
            <span class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
              2
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-base font-semibold text-slate-900">
                Gravar o firmware
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Baixar o firmware desejado, conectar o equipamento e usar o
                <code class="rounded bg-slate-100 px-1 py-0.5 text-[11px]">Trozoba.exe</code>.
              </p>
            </div>
            <svg
              class="h-5 w-5 flex-none text-slate-400 transition-transform"
              :class="{ 'rotate-180': expanded.gravacao }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-show="expanded.gravacao" class="border-t-2 border-brand-100 px-5 py-6">
            <p class="text-sm text-slate-600">
              Esta etapa pode ser repetida sempre que sair um firmware novo.
            </p>
            <div class="mt-4 rounded-md bg-slate-50 p-4 text-xs text-slate-600 ring-1 ring-slate-200">
              <ol class="list-decimal space-y-2 pl-5">
                <li>
                  Role para baixo até a seção
                  <a href="#firmwares" class="font-semibold text-brand-600 hover:underline">"Firmwares disponíveis"</a>
                  e clique em <strong>"Baixar"</strong> no firmware desejado.
                </li>
                <li>
                  <strong>Importante:</strong> salve o arquivo
                  <code class="rounded bg-white px-1 py-0.5">.hex</code> ou
                  <code class="rounded bg-white px-1 py-0.5">.bin</code>
                  <strong>na MESMA pasta</strong> onde você extraiu o instalador.
                </li>
                <li>Conecte o gravador USBasp ao Synapse Lite (ver Figura 1).</li>
                <li>Dê <strong>2 cliques</strong> em <code class="rounded bg-white px-1 py-0.5">Trozoba.exe</code>.</li>
                <li>Selecione o arquivo de firmware e siga as instruções na tela.</li>
              </ol>
            </div>
            <div class="mt-4 rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-xs text-amber-900">
              ⚠ <strong>Importante:</strong> após gravar o firmware, é
              <strong>obrigatório</strong> recalibrar o gatilho — siga o passo 3 abaixo.
              Sem recalibrar, as posições de repouso e máximo podem ser interpretadas
              de forma incorreta.
            </div>
          </div>
        </article>

        <!-- Seta sequencial -->
        <div class="flex flex-col items-center text-brand-500">
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span class="text-[11px] font-semibold uppercase tracking-wider">Próximo passo</span>
        </div>

        <!-- ============== BOX 3: CALIBRAÇÃO ============== -->
        <article
          id="passo-calibracao"
          :class="[
            'overflow-hidden rounded-xl bg-white shadow-card transition-all',
            'border-2',
            expanded.calibracao
              ? 'border-brand-600 ring-4 ring-brand-100'
              : 'border-brand-300 hover:border-brand-500',
          ]"
        >
          <button
            type="button"
            class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-brand-50/50"
            :aria-expanded="expanded.calibracao"
            @click="toggle('calibracao')"
          >
            <span class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
              3
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-base font-semibold text-slate-900">
                Calibração do gatilho
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Procedimento <strong>obrigatório</strong> após cada atualização
                de firmware. Garante leitura correta de repouso e acionamento máximo.
              </p>
            </div>
            <span class="hidden rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-200 sm:inline-flex">
              Obrigatório
            </span>
            <svg
              class="h-5 w-5 flex-none text-slate-400 transition-transform"
              :class="{ 'rotate-180': expanded.calibracao }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-show="expanded.calibracao" class="border-t-2 border-brand-100 px-5 py-6">
            <!-- Introdução -->
            <div>
              <h4 class="text-sm font-semibold text-slate-900">Introdução</h4>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                Este guia detalha o procedimento completo de calibração do gatilho
                do controlador <strong>Synapse Lite</strong>. A calibração é uma
                etapa crítica que deve ser executada <strong>sempre que o firmware
                do dispositivo for atualizado</strong>, garantindo que o sistema
                reconheça com precisão as posições de repouso e de acionamento
                máximo do gatilho.
              </p>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                A execução correta deste procedimento assegura desempenho ideal
                do dispositivo, eliminando possíveis desvios de leitura que podem
                surgir após uma atualização. O processo é guiado visualmente pelos
                LEDs do painel e leva apenas alguns segundos quando realizado
                corretamente.
              </p>
            </div>

            <!-- Quando calibrar (info azul) -->
            <div class="mt-4 flex items-start gap-3 rounded-md border-l-4 border-brand-500 bg-brand-50 p-4">
              <svg class="mt-0.5 h-5 w-5 flex-none text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
              <div class="text-sm text-brand-900">
                <p class="font-semibold">Quando calibrar?</p>
                <p class="mt-0.5 text-brand-800">
                  Sempre que o firmware for atualizado, o gatilho deve ser
                  recalibrado. Ignorar este procedimento pode causar leituras
                  incorretas de aceleração.
                </p>
              </div>
            </div>

            <!-- 1. Iniciando o Modo de Calibração -->
            <div class="mt-6">
              <h4 class="text-sm font-semibold text-slate-900">
                <span class="mr-1 text-brand-600">1.</span> Iniciando o Modo de Calibração
              </h4>
              <p class="mt-2 text-xs text-slate-600">
                Siga os passos abaixo na sequência exata para ativar o modo
                de calibração do Synapse Lite:
              </p>
              <ol class="mt-3 space-y-2">
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
                  <p class="text-xs text-slate-700">
                    Pressione o <strong>Mode button</strong> uma vez para
                    acionar a seleção de curvas.
                  </p>
                </li>
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
                  <p class="text-xs text-slate-700">
                    O LED correspondente à curva selecionada acenderá,
                    confirmando a seleção.
                  </p>
                </li>
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
                  <p class="text-xs text-slate-700">
                    Localize o botão <strong>Setup</strong> no <strong>Lado B (Side B)</strong>
                    do controlador.
                  </p>
                </li>
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">4</span>
                  <p class="text-xs text-slate-700">
                    Mantenha pressionado o botão <strong>Setup</strong> por
                    aproximadamente <strong>3 segundos</strong>.
                  </p>
                </li>
                <li class="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">5</span>
                  <p class="text-xs text-slate-700">
                    Observe os LEDs do <strong>Lado A (Side A)</strong>: eles
                    começarão a piscar, indicando que o modo de calibração foi
                    ativado com sucesso.
                  </p>
                </li>
              </ol>
            </div>

            <!-- 2. Confirmação das Posições -->
            <div class="mt-6">
              <h4 class="text-sm font-semibold text-slate-900">
                <span class="mr-1 text-brand-600">2.</span> Confirmação das Posições: Início e Final
              </h4>
              <p class="mt-2 text-xs text-slate-600">
                Após ativar o modo de calibração, o sistema aguarda a
                confirmação de dois pontos de referência: a posição inicial
                (repouso) e a posição máxima de acionamento do gatilho.
                Siga rigorosamente a sequência abaixo:
              </p>

              <!-- 2.1 INÍCIO -->
              <div class="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <p class="text-xs font-semibold text-slate-900">
                  <span class="mr-1 text-brand-600">2.1</span>
                  Confirmação da Posição Inicial (INÍCIO)
                </p>
                <ol class="mt-3 space-y-2">
                  <li class="flex items-start gap-3 rounded-md bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">1</span>
                    <p class="text-xs text-emerald-900">
                      Quando <strong>apenas o LED 1</strong> permanecer aceso
                      (todos os demais apagados), o sistema está pronto para
                      registrar a posição inicial.
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">2</span>
                    <p class="text-xs text-emerald-900">
                      Mantenha o gatilho na posição de <strong>repouso</strong>
                      (sem nenhuma pressão aplicada).
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">3</span>
                    <p class="text-xs text-emerald-900">
                      Pressione o botão <strong>Setup</strong> para confirmar
                      a posição <strong>INÍCIO</strong>.
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">4</span>
                    <p class="text-xs text-emerald-900">
                      Após a confirmação, <strong>todos os LEDs acenderão</strong>
                      novamente, sinalizando que a posição inicial foi
                      registrada com sucesso.
                    </p>
                  </li>
                </ol>
              </div>

              <!-- 2.2 FIM -->
              <div class="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                <p class="text-xs font-semibold text-slate-900">
                  <span class="mr-1 text-brand-600">2.2</span>
                  Confirmação da Posição Final (FIM)
                </p>
                <ol class="mt-3 space-y-2">
                  <li class="flex items-start gap-3 rounded-md bg-amber-50 p-2.5 ring-1 ring-amber-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">1</span>
                    <p class="text-xs text-amber-900">
                      Após todos os LEDs acenderem, aguarde até que
                      <strong>apenas o LED 4</strong> permaneça aceso. Este é o
                      sinal para registrar a posição máxima.
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-amber-50 p-2.5 ring-1 ring-amber-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">2</span>
                    <p class="text-xs text-amber-900">
                      Mova o gatilho até a posição de <strong>acionamento máximo</strong>
                      (pressione completamente o gatilho).
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-amber-50 p-2.5 ring-1 ring-amber-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">3</span>
                    <p class="text-xs text-amber-900">
                      Pressione o botão <strong>Setup</strong> para confirmar
                      a posição <strong>FINAL</strong>.
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-amber-50 p-2.5 ring-1 ring-amber-100">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">4</span>
                    <p class="text-xs text-amber-900">
                      Todos os LEDs acenderão simultaneamente por alguns
                      segundos e depois <strong>se apagarão completamente</strong>.
                    </p>
                  </li>
                  <li class="flex items-start gap-3 rounded-md bg-emerald-100 p-2.5 ring-1 ring-emerald-300">
                    <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">5</span>
                    <p class="text-xs font-semibold text-emerald-900">
                      🎉 Calibração concluída com sucesso! O Synapse Lite agora
                      reconhece corretamente a faixa completa de movimento do gatilho.
                    </p>
                  </li>
                </ol>
              </div>
            </div>

            <!-- 3. Falha na Calibração -->
            <div class="mt-6">
              <h4 class="text-sm font-semibold text-slate-900">
                <span class="mr-1 text-brand-600">3.</span> Falha na Calibração
              </h4>

              <div class="mt-3 flex items-start gap-3 rounded-md border-l-4 border-red-500 bg-red-50 p-4">
                <svg class="mt-0.5 h-5 w-5 flex-none text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
                <div class="text-sm text-red-900">
                  <p class="font-semibold">⚠ ATENÇÃO</p>
                  <p class="mt-0.5 text-red-800">
                    Se, ao final do procedimento, os LEDs <strong>permanecerem acesos</strong>
                    (sem se apagarem), a calibração <strong>não foi concluída
                    corretamente</strong>.
                  </p>
                </div>
              </div>

              <div class="mt-3 rounded-md bg-slate-50 p-4 text-xs text-slate-700 ring-1 ring-slate-200">
                <p class="font-semibold text-slate-900">
                  Repita todo o procedimento desde a Seção 1, certificando-se de:
                </p>
                <ul class="mt-2 space-y-1.5 pl-2">
                  <li class="flex items-start gap-2">
                    <span class="mt-1 h-1 w-1 flex-none rounded-full bg-slate-500" />
                    <span>Manter o gatilho <strong>completamente em repouso</strong> ao confirmar a posição INÍCIO.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1 h-1 w-1 flex-none rounded-full bg-slate-500" />
                    <span><strong>Pressionar completamente</strong> o gatilho ao confirmar a posição FINAL.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-1 h-1 w-1 flex-none rounded-full bg-slate-500" />
                    <span>Pressionar o botão <strong>Setup</strong> no momento exato em que o LED indicado estiver aceso.</span>
                  </li>
                </ul>
              </div>

              <p class="mt-4 text-center text-xs text-slate-500">
                Se mesmo após repetir várias vezes a calibração não funcionar,
                entre em contato:
                <a :href="`mailto:${SUPPORT_EMAIL}`" class="font-semibold text-brand-600 hover:underline">
                  {{ SUPPORT_EMAIL }}
                </a>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- LISTA DE FIRMWARES -->
  <!-- ======================================================== -->
  <section id="firmwares" class="border-t border-slate-200 bg-slate-50">
    <div class="mx-auto max-w-6xl px-6 py-14">
      <div class="text-center">
        <span class="badge badge-brand">Downloads</span>
        <h2 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Firmwares disponíveis
        </h2>
        <p class="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
          Versões oficiais publicadas pela equipe Joy Slot Car.
          Salve sempre na mesma pasta onde você extraiu o instalador.
        </p>
      </div>

      <div class="mt-10">
        <div v-if="loading" class="flex justify-center py-10">
          <LoadingSpinner size="md" label="Carregando firmwares..." />
        </div>

        <div
          v-else-if="error"
          class="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </div>

        <EmptyState
          v-else-if="firmwares.length === 0"
          title="Nenhum firmware publicado ainda"
          description="Volte mais tarde — novas versões serão listadas aqui assim que forem publicadas."
        />

        <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="fw in firmwares"
            :key="fw.id"
            class="card flex flex-col p-5 transition hover:shadow-lg"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate text-base font-semibold text-slate-900">{{ fw.name }}</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  Versão <span class="font-mono font-medium text-slate-700">{{ fw.version }}</span>
                </p>
              </div>
              <AppBadge tone="green">ativo</AppBadge>
            </div>

            <p
              v-if="fw.description"
              class="mt-3 line-clamp-3 text-xs text-slate-600"
            >
              {{ fw.description }}
            </p>

            <dl class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <dt class="text-[10px] uppercase tracking-wider">Tamanho</dt>
                <dd class="font-medium text-slate-700">{{ formatBytes(fw.fileSize) }}</dd>
              </div>
              <div>
                <dt class="text-[10px] uppercase tracking-wider">Publicado</dt>
                <dd class="font-medium text-slate-700">{{ formatDate(fw.createdAt) }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-[10px] uppercase tracking-wider">SHA-256</dt>
                <dd class="font-mono text-[11px] text-slate-600" :title="fw.fileSha256">
                  {{ shortHash(fw.fileSha256, 16) }}
                </dd>
              </div>
            </dl>

            <div class="mt-5">
              <a
                :href="publicApi.firmwareDownloadUrl(fw.id)"
                :download="fw.fileName"
                class="btn btn-primary w-full"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                </svg>
                Baixar {{ fw.fileName }}
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- FAQ -->
  <!-- ======================================================== -->
  <section id="duvidas" class="bg-white">
    <div class="mx-auto max-w-3xl px-6 py-14">
      <div class="text-center">
        <span class="badge badge-brand">Perguntas frequentes</span>
        <h2 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Dúvidas comuns
        </h2>
        <p class="mt-3 text-sm text-slate-500 sm:text-base">
          Não achou sua resposta?
          <a :href="`mailto:${SUPPORT_EMAIL}`" class="font-medium text-brand-600 hover:underline">
            Fale com a gente
          </a>.
        </p>
      </div>

      <div class="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        <div v-for="(item, i) in faq" :key="i">
          <button
            type="button"
            class="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
            :aria-expanded="openFaq === i"
            @click="toggleFaq(i)"
          >
            <span class="flex-1 text-sm font-medium text-slate-900">{{ item.q }}</span>
            <svg
              class="h-5 w-5 flex-none text-slate-400 transition-transform"
              :class="{ 'rotate-180': openFaq === i }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-show="openFaq === i"
            class="px-5 pb-5 text-sm leading-relaxed text-slate-600"
          >
            {{ item.a }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- CTA FINAL -->
  <!-- ======================================================== -->
  <section class="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
    <div class="mx-auto max-w-4xl px-6 py-14 text-center">
      <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
        Pronto para começar?
      </h2>
      <p class="mt-4 text-base text-brand-100">
        Baixe o instalador agora e siga os passos.
      </p>
      <a
        :href="INSTALLER_URL"
        :download="INSTALLER_FILENAME"
        class="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
        Baixar instalador (Windows)
      </a>
      <p class="mt-4 text-xs text-brand-200">
        Compatível com Windows 10 e 11 (x64) — ~12 MB
      </p>
    </div>
  </section>
</template>
