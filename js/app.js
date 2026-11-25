// Bora — início do app e rotas.
import * as store from './store.js';
import { persistir } from './db.js';
import { estado, limparRascunho } from './estado.js';
import { limparFiguras } from './ui/comum.js';
import { boasVindas, pergunta, planoPronto } from './ui/onboarding.js';
import { hoje } from './ui/hoje.js';
import { plano, detalheTreino } from './ui/plano.js';
import { player } from './ui/player.js';
import { concluido } from './ui/concluido.js';
import { biblioteca, exercicio, livre } from './ui/exercicios.js';
import { progresso, conquistasTela, atividade } from './ui/progresso.js';
import { dicas, dica } from './ui/dicas.js';
import { perfil, pessoas, backup, lembrete } from './ui/perfil.js';

const raiz = document.getElementById('app');
const ONBOARDING = new Set(['inicio', 'nova-pessoa', 'perguntas', 'plano-pronto']);
let limpar = null;

function rota() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [nome, ...resto] = h.split('/');
  return { nome: nome || '', param: resto.join('/') };
}

function ir(hash) {
  location.replace(hash);
}

function render() {
  if (typeof limpar === 'function') {
    try {
      limpar();
    } catch (e) {
      console.error(e);
    }
  }
  limpar = null;
  limparFiguras();
  document.querySelector('.fundo-modal')?.remove();
  const { nome, param } = rota();
  const temPerfil = !!store.perfilAtivo();
  if (!ONBOARDING.has(nome)) estado.novaPessoa = false;
  if (!temPerfil && !ONBOARDING.has(nome)) return ir('#/inicio');
  if (temPerfil && nome === 'inicio' && !estado.novaPessoa) return ir('#/hoje');
  window.scrollTo(0, 0);
  switch (nome) {
    case 'inicio': boasVindas(raiz); break;
    case 'nova-pessoa':
      if (!estado.novaPessoa) limparRascunho();
      estado.novaPessoa = true;
      boasVindas(raiz);
      break;
    case 'perguntas': pergunta(raiz, Math.min(6, Math.max(1, Number(param) || 1))); break;
    case 'plano-pronto': planoPronto(raiz); break;
    case 'hoje': hoje(raiz); break;
    case 'plano': plano(raiz); break;
    case 'treino': detalheTreino(raiz, param); break;
    case 'player': limpar = player(raiz); break;
    case 'concluido': concluido(raiz); break;
    case 'exercicios': biblioteca(raiz); break;
    case 'exercicio': exercicio(raiz, param); break;
    case 'livre': livre(raiz); break;
    case 'progresso': progresso(raiz); break;
    case 'calendario': progresso(raiz, 'calendario'); break;
    case 'conquistas': conquistasTela(raiz); break;
    case 'atividade': atividade(raiz); break;
    case 'dicas': dicas(raiz); break;
    case 'dica': dica(raiz, param); break;
    case 'perfil': perfil(raiz); break;
    case 'pessoas': pessoas(raiz); break;
    case 'backup': backup(raiz); break;
    case 'lembrete': lembrete(raiz); break;
    default: return ir(temPerfil ? '#/hoje' : '#/inicio');
  }
  // Leva o foco ao título da tela para leitores de tela, sem rolar.
  const titulo = raiz.querySelector('main h1[tabindex], main h1');
  if (titulo && !raiz.querySelector('[data-voltar]:focus') && nome !== 'perguntas') {
    if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1');
    titulo.focus({ preventScroll: true });
  }
  document.title = `Bora — ${titulo?.textContent?.trim() || 'treino em casa'}`;
}

async function iniciar() {
  try {
    await store.iniciar();
  } catch (e) {
    console.error('Falha ao abrir os dados', e);
  }
  persistir();
  window.addEventListener('hashchange', render);
  render();
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch {
    /* página em sandbox (prévia): sem modo offline */
  }
}

iniciar();
