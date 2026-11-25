// Componentes compartilhados da interface.
import { icone } from './icones.js';
import { criarVisual } from '../visual.js';
import { kitDoExercicio } from '../kits.js';
import { POR_ID } from '../exercicios.js';
import { esc, inicial } from '../util.js';
import * as store from '../store.js';

export { icone };

// ---------- figuras ----------
let figurasAtivas = [];
let urlsAtivas = [];
let observador = null;

// Anima só o que está na tela (economiza bateria nas listas compridas).
function observar(slot, fig) {
  if (typeof IntersectionObserver !== 'function') return fig.tocar();
  observador = observador || new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      const f = e.target._fig;
      if (!f) continue;
      if (e.isIntersecting) f.tocar();
      else f.pausar();
    }
  }, { rootMargin: '80px' });
  slot._fig = fig;
  observador.observe(slot);
}

// kit: pinta o fundo com a cor da parte do corpo (figurinha).
export function figHtml(exId, { anim = false, prop = 1, classe = '', video = false, kit = false } = {}) {
  const k = kit ? ` data-kit="${kitDoExercicio(POR_ID[exId])}"` : '';
  return `<div class="fig-slot ${classe}"${k} data-fig="${esc(exId)}" data-anim="${anim ? 1 : 0}" data-prop="${prop}" data-video="${video ? 1 : 0}"></div>`;
}

export async function montarFiguras(raiz) {
  for (const slot of raiz.querySelectorAll('[data-fig]')) {
    const ex = POR_ID[slot.dataset.fig];
    if (!ex || slot.dataset.montado) continue;
    slot.dataset.montado = '1';
    if (slot.dataset.video === '1' && store.temVideo(ex.id)) {
      const blob = await store.videoDe(ex.id);
      if (blob) {
        slot.appendChild(videoEl(blob, ex.nome));
        continue;
      }
    }
    const fig = criarVisual(ex, { proporcao: Number(slot.dataset.prop) || 1 });
    slot.appendChild(fig.el);
    if (slot.dataset.anim === '1') observar(slot, fig);
    figurasAtivas.push(fig);
  }
}

export function videoEl(blob, nome) {
  const url = URL.createObjectURL(blob);
  urlsAtivas.push(url);
  const v = document.createElement('video');
  v.src = url;
  v.muted = true;
  v.loop = true;
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('aria-label', `Seu vídeo: ${nome}`);
  v.play?.().catch(() => {});
  return v;
}

export function registrarFigura(fig) {
  figurasAtivas.push(fig);
  return fig;
}

export function limparFiguras() {
  observador?.disconnect();
  observador = null;
  for (const f of figurasAtivas) f.destruir();
  figurasAtivas = [];
  for (const u of urlsAtivas) URL.revokeObjectURL(u);
  urlsAtivas = [];
}

// ---------- estrutura ----------
export function topo({ titulo = '', voltar = null, avatar = true, extra = '' } = {}) {
  const p = store.perfilAtivo();
  const btnVoltar = voltar
    ? `<a class="btn-icone" href="${esc(voltar)}" data-voltar aria-label="Voltar">${icone('voltar')}</a>`
    : '<span class="espaco"></span>';
  const av = avatar && p
    ? `<a class="avatar" href="#/perfil" style="background:${esc(p.cor)}" aria-label="Perfil de ${esc(p.nome)}">${esc(inicial(p.nome))}</a>`
    : '';
  return `<header class="topo">${btnVoltar}<h1>${esc(titulo)}</h1>${extra}${av}</header>`;
}

const ABAS = [
  ['hoje', 'Hoje', 'casa'],
  ['plano', 'Plano', 'calendario'],
  ['exercicios', 'Treinos', 'halter'],
  ['progresso', 'Progresso', 'grafico'],
  ['dicas', 'Dicas', 'lampada'],
];

export function abas(ativa) {
  const itens = ABAS.map(([id, nome, ic]) => `<li><a href="#/${id}"${id === ativa ? ' aria-current="page"' : ''}>${icone(ic)}<span>${nome}</span></a></li>`).join('');
  return `<nav class="abas" aria-label="Menu principal"><ul>${itens}</ul></nav>`;
}

export function nivelHtml(n, rotulo = true) {
  const barras = [1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('');
  return `<span class="nivel" ${rotulo ? `aria-label="Nível ${n} de 3"` : 'aria-hidden="true"'}>${barras}</span>`;
}

export function anel(valor, max, meio, tamanho = 108, espessura = 10) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const frac = max > 0 ? Math.min(1, valor / max) : 0;
  return `<div class="anel" style="width:${tamanho}px;height:${tamanho}px" role="img" aria-label="${esc(`${valor} de ${max}`)}">
    <svg viewBox="0 0 ${tamanho} ${tamanho}"><circle class="fundo" cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}" fill="none" stroke-width="${espessura}"/>
    <circle class="valor" cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}" fill="none" stroke-width="${espessura}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - frac)).toFixed(1)}"/></svg>
    <div class="meio">${meio}</div></div>`;
}

// ---------- avisos ----------
let toastTimer = 0;
export function aviso(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3200);
}

export function anunciar(texto) {
  const el = document.getElementById('anuncio');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => (el.textContent = texto), 30);
}

// Diálogo próprio (sem window.confirm). Resolve com o valor do botão escolhido.
export function confirmar({ titulo, texto = '', botoes }) {
  return new Promise((ok) => {
    const anterior = document.activeElement;
    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';
    fundo.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <h2 id="modal-titulo" tabindex="-1">${esc(titulo)}</h2>${texto ? `<p class="muted">${texto}</p>` : ''}
      <div class="botoes">${botoes.map((b, i) => `<button type="button" class="btn btn-grande ${b.estilo || 'btn-secundario'}" data-i="${i}">${esc(b.rotulo)}</button>`).join('')}</div></div>`;
    const fechar = (valor) => {
      fundo.remove();
      document.removeEventListener('keydown', tecla);
      anterior?.focus?.();
      ok(valor);
    };
    const tecla = (e) => {
      if (e.key === 'Escape') fechar(null);
    };
    fundo.addEventListener('click', (e) => {
      if (e.target === fundo) return fechar(null);
      const b = e.target.closest('[data-i]');
      if (b) fechar(botoes[Number(b.dataset.i)].valor);
    });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(fundo);
    fundo.querySelector('#modal-titulo').focus();
  });
}

// ---------- confete ----------
export function confete(duracao = 2600) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confete';
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const ajustar = () => {
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
  };
  ajustar();
  const cores = ['#6a3bdb', '#e02d4b', '#ffc51f', '#1d6fe0', '#0a8f45', '#cc2a86', '#e8590c', '#6edcb9'];
  const pecas = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width,
    y: -Math.random() * c.height * 0.6,
    vx: (Math.random() - 0.5) * 3 * dpr,
    vy: (2 + Math.random() * 3.5) * dpr,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    w: (6 + Math.random() * 6) * dpr,
    h: (8 + Math.random() * 8) * dpr,
    cor: cores[Math.floor(Math.random() * cores.length)],
  }));
  const inicio = performance.now();
  function quadro(agora) {
    const t = agora - inicio;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.globalAlpha = t > duracao - 600 ? Math.max(0, (duracao - t) / 600) : 1;
    for (const p of pecas) {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < duracao) requestAnimationFrame(quadro);
    else c.remove();
  }
  requestAnimationFrame(quadro);
}

export function ir(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
