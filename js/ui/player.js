// Reprodutor guiado (S12): contagem, animação ou vídeo próprio, voz, descanso e registro automático.
import * as store from '../store.js';
import { POR_ID } from '../exercicios.js';
import { criarVisual, preCarregar } from '../visual.js';
import { kitDoExercicio, kitDoTreino } from '../kits.js';
import { estado, VELOCIDADE } from '../estado.js';
import { esc, relogio } from '../util.js';
import { icone, videoEl, confirmar, ir, anunciar } from './comum.js';

const FASES = { Aquecimento: 'Aquecimento', Circuito: 'Circuito', 'Volta à calma': 'Volta à calma', Mobilidade: 'Mobilidade' };

function expandir(treino) {
  const passos = [];
  const primeiro = treino.passos.find((x) => x.tipo === 'exercicio');
  passos.push({ tipo: 'preparar', seg: 8, exId: primeiro.exId, bloco: primeiro.bloco });
  treino.passos.forEach((x, i) => {
    const ant = treino.passos[i - 1];
    if (x.tipo === 'exercicio' && ant && ant.tipo === 'exercicio') {
      passos.push({ tipo: 'transicao', seg: ant.bloco !== x.bloco ? 10 : 5, exId: x.exId, bloco: x.bloco, novoBloco: ant.bloco !== x.bloco });
    }
    passos.push(x);
  });
  return passos;
}

export function player(raiz) {
  const p = store.perfilAtivo();
  const t = estado.treino;
  if (!t || !p) return ir('#/hoje');
  const aj = { ...store.AJUSTES_PADRAO, ...p.ajustes };
  const passos = expandir(t);
  const idxExercicios = passos.map((x, i) => (x.tipo === 'exercicio' ? i : -1)).filter((i) => i >= 0);
  const inicioIso = new Date().toISOString();

  let i = 0;
  let restante = 0;
  let decorrido = 0;
  let pausado = false;
  let ultimo = performance.now();
  let trocouLado = false;
  let ultimoSegundo = null;
  let figura = null;
  let intervalo = 0;
  let trava = null;
  let encerrado = false;
  let audio = null;

  raiz.innerHTML = `<div class="player" data-kit="corpo_todo" role="region" aria-label="Treino em andamento">
    <div class="barra-topo">
      <button class="btn-icone" id="sair" aria-label="Sair do treino">${icone('fechar')}</button>
      <span class="rotulo" id="rotulo"></span>
      <button class="btn-icone" id="voz" aria-pressed="${aj.voz}" aria-label="Voz do treinador">${icone('voz')}</button>
    </div>
    <div class="trilha" aria-hidden="true">${idxExercicios.map(() => '<i></i>').join('')}</div>
    <div class="palco" id="palco"></div>
    <div class="info">
      <div class="fase" id="fase"></div>
      <div class="nome-ex" id="nome" aria-live="polite"></div>
      <div id="lado"></div>
      <div class="tempo" id="tempo" role="timer" aria-label="Tempo restante">00:00</div>
      <div class="proximo" id="proximo"></div>
    </div>
    <div class="extra" id="extra"></div>
    <div class="controles">
      <button class="btn-icone" id="ant" aria-label="Exercício anterior">${icone('anterior')}</button>
      <button class="btn-icone principal" id="pp" aria-label="Pausar">${icone('pausa')}</button>
      <button class="btn-icone" id="prox" aria-label="Pular para o próximo">${icone('proximo')}</button>
    </div>
  </div>`;
  const $ = (s) => raiz.querySelector(s);
  const el = { player: $('.player'), palco: $('#palco'), fase: $('#fase'), nome: $('#nome'), lado: $('#lado'), tempo: $('#tempo'), proximo: $('#proximo'), extra: $('#extra'), rotulo: $('#rotulo'), pp: $('#pp'), trilha: [...raiz.querySelectorAll('.trilha i')] };

  // ---------- som, voz, vibração, tela ----------
  function falar(texto) {
    if (!aj.voz || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      const vozes = speechSynthesis.getVoices();
      const v = vozes.find((x) => /^pt[-_]br/i.test(x.lang)) || vozes.find((x) => /^pt/i.test(x.lang));
      if (v) u.voice = v;
      u.rate = 1.02;
      speechSynthesis.speak(u);
    } catch {
      /* sem voz */
    }
  }
  function bip(freq = 880, dur = 0.12) {
    if (!aj.sons) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = freq;
      o.connect(g);
      g.connect(audio.destination);
      const t0 = audio.currentTime;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch {
      /* sem áudio */
    }
  }
  function vibrar(ms = 200) {
    if (aj.vibrar && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        /* nada */
      }
    }
  }
  async function travarTela() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') trava = await navigator.wakeLock.request('screen');
    } catch {
      trava = null;
    }
  }
  function soltarTela() {
    try {
      trava?.release();
    } catch {
      /* nada */
    }
    trava = null;
  }

  // ---------- desenho ----------
  async function mostrarMidia(exId) {
    figura?.destruir();
    figura = null;
    el.palco.innerHTML = '';
    const ex = POR_ID[exId];
    if (store.temVideo(exId)) {
      const blob = await store.videoDe(exId);
      if (blob && passos[i]?.exId === exId) {
        el.palco.appendChild(videoEl(blob, ex.nome));
        return;
      }
    }
    figura = criarVisual(ex, { proporcao: 1.25 });
    el.palco.appendChild(figura.el);
    if (!pausado) figura.tocar();
  }

  function proximoExercicio(desde) {
    for (let j = desde + 1; j < passos.length; j++) if (passos[j].tipo === 'exercicio') return passos[j];
    return null;
  }

  function entrar(n) {
    i = n;
    const passo = passos[i];
    restante = passo.seg * 1000;
    trocouLado = false;
    ultimoSegundo = null;
    const ex = POR_ID[passo.exId];
    el.player.classList.toggle('descanso', passo.tipo === 'descanso');
    el.player.classList.toggle('preparar', passo.tipo === 'preparar' || passo.tipo === 'transicao');
    // A tela veste a cor do exercício; no descanso, a cor calma.
    el.player.dataset.kit = passo.tipo === 'descanso' ? 'descanso' : kitDoExercicio(ex);
    const feitos = idxExercicios.filter((k) => k < i).length;
    el.trilha.forEach((b, k) => {
      b.className = k < feitos ? 'feito' : k === feitos && passo.tipo === 'exercicio' ? 'agora' : '';
    });
    const prox = proximoExercicio(i);
    if (prox) preCarregar(POR_ID[prox.exId]);
    el.lado.innerHTML = '';
    el.extra.innerHTML = '';
    if (passo.tipo === 'preparar') {
      el.fase.textContent = 'Prepare-se';
      el.nome.textContent = ex.nome;
      el.proximo.innerHTML = `${esc(t.titulo)}`;
      mostrarMidia(passo.exId);
      falar(`Prepare-se. Primeiro exercício: ${ex.nome}.`);
    } else if (passo.tipo === 'transicao') {
      el.fase.textContent = passo.novoBloco ? `Agora: ${FASES[passo.bloco] || passo.bloco}` : 'Prepare-se';
      el.nome.textContent = ex.nome;
      el.proximo.textContent = 'Começa em instantes';
      mostrarMidia(passo.exId);
      falar(passo.novoBloco ? `${FASES[passo.bloco] || passo.bloco}. Próximo: ${ex.nome}.` : `Próximo: ${ex.nome}.`);
    } else if (passo.tipo === 'descanso') {
      el.fase.textContent = 'Descanse';
      el.nome.textContent = prox ? `Depois: ${POR_ID[prox.exId].nome}` : 'Respire';
      el.proximo.textContent = 'Beba água, respire fundo';
      el.extra.innerHTML = '<button type="button" class="chip" id="mais15">+15 s</button><button type="button" class="chip" id="pular">Pular descanso</button>';
      el.extra.querySelector('#mais15').addEventListener('click', () => {
        restante += 15000;
        atualizarTempo();
      });
      el.extra.querySelector('#pular').addEventListener('click', avancar);
      if (prox) mostrarMidia(prox.exId);
      falar(prox ? `Descanse. Depois: ${POR_ID[prox.exId].nome}.` : 'Descanse.');
      vibrar(120);
    } else {
      const volta = passo.voltas > 1 ? `, volta ${passo.volta} de ${passo.voltas}` : '';
      el.fase.textContent = `${FASES[passo.bloco] || passo.bloco}${volta}`;
      el.nome.textContent = ex.nome;
      el.proximo.innerHTML = prox ? `Depois: <b>${esc(POR_ID[prox.exId].nome)}</b>` : '<b>Último exercício!</b>';
      if (ex.unilateral) el.lado.innerHTML = '<span class="lado">Primeiro lado</span>';
      mostrarMidia(passo.exId);
      falar(`${ex.nome}. ${passo.seg} segundos${ex.unilateral ? ', troque de lado na metade' : ''}.`);
      vibrar(220);
      bip(660, 0.18);
    }
    const blocoNome = FASES[passo.bloco] || passo.bloco || '';
    el.rotulo.textContent = `${blocoNome ? `${blocoNome}: ` : ''}${feitos + (passo.tipo === 'exercicio' ? 1 : 0)}/${idxExercicios.length}`;
    atualizarTempo();
  }

  function atualizarTempo() {
    el.tempo.textContent = relogio(restante / 1000);
  }

  function tick() {
    if (pausado || encerrado) return;
    const agora = performance.now();
    const dt = (agora - ultimo) * VELOCIDADE;
    ultimo = agora;
    restante -= dt;
    decorrido += dt;
    const passo = passos[i];
    const ex = POR_ID[passo.exId];
    if (passo.tipo === 'exercicio' && ex?.unilateral && !trocouLado && restante <= (passo.seg * 1000) / 2) {
      trocouLado = true;
      el.lado.innerHTML = '<span class="lado trocar">Troque de lado!</span>';
      falar('Troque de lado.');
      vibrar(300);
    }
    const s = Math.ceil(restante / 1000);
    if (s !== ultimoSegundo) {
      ultimoSegundo = s;
      if (s <= 3 && s > 0 && passo.tipo !== 'transicao') bip(s === 1 ? 990 : 880);
    }
    if (restante <= 0) {
      // O que passou do fim deste passo já conta para o próximo (o tempo total fica exato).
      const sobra = -restante;
      avancar();
      if (!encerrado) {
        restante -= sobra;
        atualizarTempo();
      }
    } else {
      atualizarTempo();
    }
  }

  function avancar() {
    if (encerrado) return;
    if (i + 1 >= passos.length) return concluir();
    entrar(i + 1);
  }

  function voltar() {
    const atual = passos[i];
    const gasto = atual.seg * 1000 - restante;
    let alvo = i;
    if (atual.tipo !== 'exercicio' || gasto < 3000) {
      for (let j = i - 1; j >= 0; j--) if (passos[j].tipo === 'exercicio') { alvo = j; break; }
    }
    if (atual.tipo !== 'exercicio' && alvo === i) alvo = Math.max(0, i - 1);
    entrar(alvo);
  }

  function pausar(sim) {
    pausado = sim;
    ultimo = performance.now();
    el.pp.innerHTML = icone(sim ? 'play' : 'pausa', sim ? 'cheio' : '');
    el.pp.setAttribute('aria-label', sim ? 'Continuar' : 'Pausar');
    el.player.classList.toggle('pausado', sim);
    if (sim) {
      figura?.pausar();
      el.palco.querySelector('video')?.pause();
      window.speechSynthesis?.cancel?.();
      el.fase.dataset.antes = el.fase.textContent;
      el.fase.textContent = 'Pausado';
    } else {
      figura?.tocar();
      el.palco.querySelector('video')?.play?.().catch(() => {});
      if (el.fase.dataset.antes) el.fase.textContent = el.fase.dataset.antes;
    }
  }

  async function salvar(completo) {
    const segundos = Math.round(decorrido / 1000);
    const resultado = await store.registrarSessao(p, {
      tipo: t.tipo === 'livre' ? 'livre' : 'plano',
      dia: t.dia,
      titulo: t.dia ? `Dia ${t.dia}: ${t.titulo}` : `Treino livre: ${t.titulo}`,
      kit: kitDoTreino(t, p),
      segundos,
      planejado: t.segundos,
      completo,
      exercicios: idxExercicios.filter((k) => k < i || completo).length,
      inicio: inicioIso,
    });
    estado.resultado = { ...resultado, treino: t, perfilId: p.id };
  }

  async function concluir() {
    if (encerrado) return;
    encerrado = true;
    clearInterval(intervalo);
    figura?.pausar();
    soltarTela();
    el.tempo.textContent = '00:00';
    falar(`Treino concluído. Parabéns, ${p.nome.split(' ')[0]}!`);
    vibrar(400);
    await salvar(true);
    estado.treino = null;
    ir('#/concluido');
  }

  async function sair() {
    const estavaPausado = pausado;
    pausar(true);
    const min = Math.round(decorrido / 60000);
    const botoes = decorrido >= 60000
      ? [{ rotulo: `Salvar ${min} min e sair`, valor: 'salvar', estilo: 'btn-primario' }, { rotulo: 'Sair sem salvar', valor: 'descartar', estilo: 'btn-perigo' }, { rotulo: 'Continuar treinando', valor: 'continuar' }]
      : [{ rotulo: 'Continuar treinando', valor: 'continuar', estilo: 'btn-primario' }, { rotulo: 'Sair', valor: 'descartar', estilo: 'btn-perigo' }];
    const r = await confirmar({ titulo: 'Sair do treino?', texto: decorrido >= 60000 ? 'O que você já fez conta para seus minutos e sua racha.' : 'Você ainda não completou um minuto.', botoes });
    if (r === 'salvar') {
      encerrado = true;
      clearInterval(intervalo);
      soltarTela();
      await salvar(false);
      estado.treino = null;
      ir('#/concluido');
    } else if (r === 'descartar') {
      encerrado = true;
      clearInterval(intervalo);
      soltarTela();
      estado.treino = null;
      ir(t.dia ? '#/hoje' : '#/exercicios');
    } else if (!estavaPausado) {
      pausar(false);
    }
  }

  function visibilidade() {
    if (document.visibilityState === 'hidden') {
      if (!pausado && !encerrado) pausar(true);
    } else if (!encerrado) {
      travarTela();
    }
  }

  $('#pp').addEventListener('click', () => pausar(!pausado));
  $('#prox').addEventListener('click', avancar);
  $('#ant').addEventListener('click', voltar);
  $('#sair').addEventListener('click', sair);
  $('#voz').addEventListener('click', (e) => {
    aj.voz = !aj.voz;
    e.currentTarget.setAttribute('aria-pressed', String(aj.voz));
    if (!aj.voz) window.speechSynthesis?.cancel?.();
    store.atualizarAjustes(p.id, { voz: aj.voz });
    anunciar(aj.voz ? 'Voz ligada' : 'Voz desligada');
  });
  const teclas = (e) => {
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      pausar(!pausado);
    }
  };
  document.addEventListener('visibilitychange', visibilidade);
  document.addEventListener('keydown', teclas);
  try {
    window.speechSynthesis?.getVoices?.();
  } catch {
    /* nada */
  }

  travarTela();
  entrar(0);
  intervalo = setInterval(tick, 200);

  return () => {
    encerrado = true;
    clearInterval(intervalo);
    figura?.destruir();
    soltarTela();
    try {
      window.speechSynthesis?.cancel?.();
    } catch {
      /* nada */
    }
    try {
      audio?.close();
    } catch {
      /* nada */
    }
    document.removeEventListener('visibilitychange', visibilidade);
    document.removeEventListener('keydown', teclas);
  };
}
