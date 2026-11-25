// Ilustração animada quadro a quadro.
// Imagens: Workout Guide, de Bryl Lim (bryllim.com), CC BY-SA 4.0, com base em Everkinetic (CC BY-SA 4.0).
// Mesma interface da figura própria (figura.js): { el, tocar, pausar, velocidade, destruir }.

const PASTA = 'img/ex/';
const FADE_MS = 90;

export function urlsDaArte(ex) {
  const { s, q } = ex.arte;
  return q.map((n) => new URL(`${PASTA}${s}/frame-${n}.svg`, document.baseURI).href);
}

// Baixa os quadros antes de aparecerem (ex.: o próximo exercício do treino).
export function preCarregar(ex) {
  if (!ex?.arte) return;
  for (const u of new Set(urlsDaArte(ex))) {
    const img = new Image();
    img.decoding = 'async';
    img.src = u;
  }
}

export function criarIlustracao(ex, { rotulo = '', classe = '' } = {}) {
  const el = document.createElement('div');
  el.className = `arte ${classe}`.trim();
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', rotulo || `Demonstração: ${ex.nome}`);
  const camadas = urlsDaArte(ex).map((url, i) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    if (i === 0) img.className = 'base';
    el.appendChild(img);
    return img;
  });
  const n = camadas.length;
  const ciclo = Math.max((ex.tempo || 2.4) * 1000, n * 320);
  const reduzir = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let anims = null;
  let vel = 1;

  function iniciar() {
    if (reduzir || typeof el.animate !== 'function') return;
    if (n === 1) {
      // Exercício parado (segurar a posição): só uma respiração lenta.
      anims = [el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 3600, iterations: Infinity, easing: 'ease-in-out' })];
    } else {
      // Cada quadro aparece na sua vez e se funde com o seguinte.
      const f = Math.min(FADE_MS / ciclo, 0.4 / n);
      const quadros = [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 1 / n - f },
        { opacity: 0, offset: 1 / n },
        { opacity: 0, offset: 1 - f },
        { opacity: 1, offset: 1 },
      ];
      anims = camadas.map((c, i) => c.animate(quadros, { duration: ciclo, iterations: Infinity, delay: -(((n - i) % n) / n) * ciclo }));
    }
    for (const a of anims) a.playbackRate = vel;
  }

  return {
    el,
    tocar() {
      if (!anims) iniciar();
      else for (const a of anims) a.play();
    },
    pausar() {
      if (anims) for (const a of anims) a.pause();
    },
    velocidade(v) {
      vel = v;
      if (anims) for (const a of anims) a.playbackRate = v;
    },
    destruir() {
      if (anims) for (const a of anims) a.cancel();
      anims = null;
      el.remove();
    },
  };
}
