// Figura animada própria do Bora: um boneco articulado desenhado em SVG.
// Cada exercício descreve poses (ângulos absolutos de cada segmento) e o motor
// interpola entre elas. Ângulos: 0 = para baixo, 90 = para a direita (frente),
// 180 = para cima, -90 = para a esquerda (trás).

const SVGNS = 'http://www.w3.org/2000/svg';
export const CHAO = 178; // linha do chão no viewBox 0 0 200 200

const L = { tl: 24, tu: 24, nk: 6, hr: 10, ua: 25, fa: 23, th: 32, sh: 32, ft: 9 };
const R = { tronco: 7, mao: 4.5, junta: 4.5, pe: 4, cabeca: 10 };

const PADRAO = {
  t: 180, t2: null, h: 0,
  aL1: 0, aL2: 0, aR1: 0, aR2: 0,
  lL1: 0, lL2: 0, lR1: 0, lR2: 0,
  fL: 90, fR: 90, sw: 0, hw: 0, lift: 0, dx: 0,
};

function dir(a) {
  const r = (a * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}
function mais(p, d, len) {
  return [p[0] + d[0] * len, p[1] + d[1] * len];
}

export function normalizarPose(p) {
  const q = { ...PADRAO, ...p };
  if (q.t2 == null) q.t2 = q.t;
  return q;
}

// Calcula todos os pontos do boneco, já posicionados no chão e na âncora.
export function esqueleto(poseBruta, ex = {}) {
  const p = normalizarPose(poseBruta);
  const quadril = [0, 0];
  const meio = mais(quadril, dir(p.t), L.tl);
  const topo = mais(meio, dir(p.t2), L.tu);
  const cabeca = mais(topo, dir(p.t2 + p.h), L.nk + L.hr);
  const perpU = dir(p.t2 + 90);
  const perpL = dir(p.t + 90);
  const ombro = mais(topo, dir(p.t2), -3);
  const ombroL = mais(ombro, perpU, p.sw);
  const ombroR = mais(ombro, perpU, -p.sw);
  const quadL = mais(quadril, perpL, p.hw);
  const quadR = mais(quadril, perpL, -p.hw);
  const cotL = mais(ombroL, dir(p.aL1), L.ua);
  const maoL = mais(cotL, dir(p.aL2), L.fa);
  const cotR = mais(ombroR, dir(p.aR1), L.ua);
  const maoR = mais(cotR, dir(p.aR2), L.fa);
  const joeL = mais(quadL, dir(p.lL1), L.th);
  const torL = mais(joeL, dir(p.lL2), L.sh);
  const joeR = mais(quadR, dir(p.lR1), L.th);
  const torR = mais(joeR, dir(p.lR2), L.sh);
  const escalaPe = 1 - Math.min(1, Math.max(0, p.sw / 10));
  const peL = mais(torL, dir(p.fL), L.ft * escalaPe);
  const peR = mais(torR, dir(p.fR), L.ft * escalaPe);

  const pts = { quadril, meio, topo, cabeca, ombroL, ombroR, quadL, quadR, cotL, maoL, cotR, maoR, joeL, torL, joeR, torR, peL, peR };

  // Encosta o ponto mais baixo no chão (considerando a espessura dos traços).
  const raios = [
    [quadril, R.tronco], [meio, R.tronco], [topo, R.tronco], [cabeca, R.cabeca],
    [cotL, R.junta], [maoL, R.mao], [cotR, R.junta], [maoR, R.mao],
    [joeL, R.junta], [torL, R.pe], [joeR, R.junta], [torR, R.pe], [peL, R.pe], [peR, R.pe],
  ];
  let baixo = -Infinity;
  for (const [pt, r] of raios) baixo = Math.max(baixo, pt[1] + r);
  const oy = CHAO - baixo - p.lift;

  let ax;
  switch (ex.ancora) {
    case 'pes': ax = (torL[0] + torR[0]) / 2; break;
    case 'maos': ax = (maoL[0] + maoR[0]) / 2; break;
    case 'joelhos': ax = (joeL[0] + joeR[0]) / 2; break;
    default: ax = 0;
  }
  const ox = 100 + (ex.x0 || 0) + p.dx - ax;
  for (const k of Object.keys(pts)) pts[k] = [pts[k][0] + ox, pts[k][1] + oy];
  return pts;
}

function suave(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function misturar(a, b, f) {
  const pa = normalizarPose(a);
  const pb = normalizarPose(b);
  const out = {};
  for (const k of Object.keys(PADRAO)) out[k] = pa[k] + (pb[k] - pa[k]) * f;
  return out;
}

// Pose no instante x (0..1 do ciclo).
export function poseNoTempo(ex, x) {
  const poses = ex.poses;
  if (poses.length === 1) return normalizarPose(poses[0]);
  let seq;
  if (ex.seq === 'vai-volta') {
    seq = poses.map((_, i) => i);
    for (let i = poses.length - 2; i >= 1; i--) seq.push(i);
  } else {
    seq = poses.map((_, i) => i);
  }
  const n = seq.length;
  const pos = (((x % 1) + 1) % 1) * n;
  const i = Math.floor(pos);
  const f = suave(pos - i);
  return misturar(poses[seq[i]], poses[seq[(i + 1) % n]], f);
}

function el(nome, attrs = {}, pai) {
  const e = document.createElementNS(SVGNS, nome);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (pai) pai.appendChild(e);
  return e;
}

function desenharAcessorios(svg, ex) {
  const g = el('g', { class: 'fig-props' }, svg);
  el('line', { x1: 8, y1: CHAO + 0.5, x2: 192, y2: CHAO + 0.5, class: 'fig-chao' }, g);
  if (ex.chao) el('rect', { x: 18, y: CHAO - 3, width: 164, height: 7, rx: 3.5, class: 'fig-tapete' }, g);
  if (ex.parede) {
    const { x, lado } = ex.parede;
    el('rect', { x: lado === 'dir' ? x : x - 9, y: 24, width: 9, height: CHAO - 24, rx: 2, class: 'fig-parede' }, g);
  }
  if (ex.cadeira) {
    const { x } = ex.cadeira; // x = borda da frente do assento
    const assento = CHAO - L.sh - 1;
    const tras = x - 32;
    el('rect', { x: tras, y: assento, width: 34, height: 6, rx: 3, class: 'fig-cadeira' }, g);
    el('rect', { x: tras, y: assento - 46, width: 6, height: 48, rx: 3, class: 'fig-cadeira' }, g);
    el('rect', { x: tras + 2, y: assento + 4, width: 4, height: CHAO - assento - 4, class: 'fig-cadeira' }, g);
    el('rect', { x: x - 5, y: assento + 4, width: 4, height: CHAO - assento - 4, class: 'fig-cadeira' }, g);
  }
}

function fmt(n) {
  return Math.round(n * 10) / 10;
}
function linha(...pts) {
  return pts.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ');
}

// Caixa que enquadra todas as poses (e acessórios) para aproveitar o espaço.
const cacheCaixa = new Map();
export function caixaDoExercicio(ex, proporcao = 1) {
  const chaveCache = `${ex.id}:${proporcao}`;
  if (cacheCaixa.has(chaveCache)) return cacheCaixa.get(chaveCache);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity;
  const amostras = [];
  for (let i = 0; i < 24; i++) amostras.push(poseNoTempo(ex, i / 24));
  for (const pose of amostras) {
    const p = esqueleto(pose, ex);
    for (const [k, pt] of Object.entries(p)) {
      const r = k === 'cabeca' ? R.cabeca + 2 : 8;
      x0 = Math.min(x0, pt[0] - r);
      x1 = Math.max(x1, pt[0] + r);
      y0 = Math.min(y0, pt[1] - r);
    }
  }
  if (ex.parede) {
    const { x, lado } = ex.parede;
    x0 = Math.min(x0, lado === 'dir' ? x : x - 9);
    x1 = Math.max(x1, lado === 'dir' ? x + 9 : x);
    y0 = Math.min(y0, 60);
  }
  if (ex.cadeira) {
    x0 = Math.min(x0, ex.cadeira.x - 34);
    x1 = Math.max(x1, ex.cadeira.x + 2);
    y0 = Math.min(y0, CHAO - L.sh - 50);
  }
  const fundo = CHAO + 9;
  const topo = y0 - 6;
  let alt = fundo - topo;
  let larg = x1 - x0 + 16;
  // Tamanho mínimo para não ampliar demais exercícios em pé.
  alt = Math.max(alt, 96);
  larg = Math.max(larg, 96);
  if (larg / alt > proporcao) alt = larg / proporcao;
  else larg = alt * proporcao;
  const cx = (x0 + x1) / 2;
  const caixa = [fmt(cx - larg / 2), fmt(fundo - alt), fmt(larg), fmt(alt)];
  cacheCaixa.set(chaveCache, caixa);
  return caixa;
}

export function criarFigura(ex, opcoes = {}) {
  const { rotulo = '', classe = '', proporcao = 1 } = opcoes;
  const svg = el('svg', {
    viewBox: caixaDoExercicio(ex, proporcao).join(' '),
    preserveAspectRatio: 'xMidYMax meet',
    class: `figura ${classe}`.trim(),
    role: 'img',
    'aria-label': rotulo || `Demonstração: ${ex.nome}`,
    focusable: 'false',
  });
  desenharAcessorios(svg, ex);
  const frente = ex.vista === 'frente';
  const foco = new Set(ex.foco || []);
  const cor = (parte, lado) => {
    const hl = foco.has(parte);
    if (frente || lado === 'R') return hl ? 'fig-hl' : 'fig-perto';
    return hl ? 'fig-hl-longe' : 'fig-longe';
  };
  const g = el('g', { class: 'fig-corpo' }, svg);
  const bracoL = el('polyline', { class: `fig-membro ${cor('bracos', 'L')}` }, g);
  const maoL = el('circle', { r: R.mao, class: `fig-mao ${cor('bracos', 'L')}` }, g);
  const pernaL = el('polyline', { class: `fig-membro fig-perna ${cor('pernas', 'L')}` }, g);
  const tronco = el('polyline', { class: `fig-tronco ${foco.has('tronco') ? 'fig-hl' : 'fig-perto'}` }, g);
  const cabeca = el('circle', { r: R.cabeca, class: 'fig-cabeca' }, g);
  const pernaR = el('polyline', { class: `fig-membro fig-perna ${cor('pernas', 'R')}` }, g);
  const bracoR = el('polyline', { class: `fig-membro ${cor('bracos', 'R')}` }, g);
  const maoR = el('circle', { r: R.mao, class: `fig-mao ${cor('bracos', 'R')}` }, g);

  function desenhar(pose) {
    const p = esqueleto(pose, ex);
    bracoL.setAttribute('points', linha(p.ombroL, p.cotL, p.maoL));
    maoL.setAttribute('cx', fmt(p.maoL[0]));
    maoL.setAttribute('cy', fmt(p.maoL[1]));
    pernaL.setAttribute('points', linha(p.quadL, p.joeL, p.torL, p.peL));
    tronco.setAttribute('points', linha(p.quadril, p.meio, p.topo));
    cabeca.setAttribute('cx', fmt(p.cabeca[0]));
    cabeca.setAttribute('cy', fmt(p.cabeca[1]));
    pernaR.setAttribute('points', linha(p.quadR, p.joeR, p.torR, p.peR));
    bracoR.setAttribute('points', linha(p.ombroR, p.cotR, p.maoR));
    maoR.setAttribute('cx', fmt(p.maoR[0]));
    maoR.setAttribute('cy', fmt(p.maoR[1]));
  }

  const chave = ex.chave ?? Math.min(1, ex.poses.length - 1);
  desenhar(ex.poses[chave]);

  let raf = 0;
  let inicio = 0;
  let pausadoEm = 0;
  let velocidade = 1;
  const ciclo = (ex.tempo || 2) * 1000;
  const reduzir = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function quadro(agora) {
    const x = ((agora - inicio) * velocidade) / ciclo;
    desenhar(poseNoTempo(ex, x));
    raf = requestAnimationFrame(quadro);
  }

  return {
    el: svg,
    tocar() {
      if (reduzir || raf || ex.poses.length < 2) return;
      const agora = performance.now();
      inicio = pausadoEm ? agora - pausadoEm : agora;
      pausadoEm = 0;
      raf = requestAnimationFrame(quadro);
    },
    pausar() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
      pausadoEm = performance.now() - inicio;
    },
    velocidade(v) {
      velocidade = v;
    },
    destruir() {
      cancelAnimationFrame(raf);
      raf = 0;
      svg.remove();
    },
  };
}
