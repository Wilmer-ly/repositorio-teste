// Biblioteca (S14), detalhe do exercício com vídeo próprio (S15) e treino livre (S16).
import * as store from '../store.js';
import { EXERCICIOS, POR_ID, AREAS } from '../exercicios.js';
import { montarTreinoLivre, AREAS_LIVRE, NIVEIS, permitido } from '../plano.js';
import { estado } from '../estado.js';
import { esc } from '../util.js';
import { topo, abas, icone, figHtml, montarFiguras, nivelHtml, aviso, confirmar, ir, limparFiguras } from './comum.js';
import { kitDoExercicio } from '../kits.js';

const FILTROS = [['todos', 'Todos'], ['aquecimento', 'Aquecimento'], ['cardio', 'Cardio'], ['pernas', 'Pernas e glúteos'], ['abdomen', 'Abdômen'], ['bracos', 'Braços e peito'], ['costas', 'Costas e postura'], ['alongamento', 'Alongamento']];
const MAX_VIDEO = 150 * 1024 * 1024;

function normalizar(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function biblioteca(raiz) {
  const chips = FILTROS.map(([id, nome]) => `<button type="button" class="chip" data-filtro="${id}" aria-pressed="${estado.filtroArea === id}">${id === 'todos' ? '' : `<span class="ponto" data-kit="${id}" aria-hidden="true"></span>`}${nome}</button>`).join('');
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Treinos' })}
    <a class="cartao destaque linha" href="#/livre">
      <div class="cresce"><h2>Treino livre</h2><p class="muted pequeno">Escolha a área e o tempo. A gente monta para você.</p></div>
      <span class="btn btn-primario">${icone('play', 'cheio')}Montar</span>
    </a>
    <div class="secao-titulo"><h2>Exercícios</h2><span class="mini muted" id="contagem"></span></div>
    <div class="busca"><label class="sr-only" for="busca">Buscar exercício</label>${icone('busca')}<input class="entrada" id="busca" type="search" placeholder="Buscar exercício" value="${esc(estado.busca)}" autocomplete="off"></div>
    <div class="chips" role="group" aria-label="Filtrar por área" style="margin-top:8px">${chips}</div>
    <div class="grade-ex" id="grade" style="margin-top:8px"></div>
  </main>${abas('exercicios')}`;
  const grade = raiz.querySelector('#grade');
  const p = store.perfilAtivo();
  function desenhar() {
    limparFiguras();
    const termo = normalizar(estado.busca.trim());
    const lista = EXERCICIOS.filter((e) => (estado.filtroArea === 'todos' || e.areas.includes(estado.filtroArea)) && (!termo || normalizar(e.nome).includes(termo) || normalizar(e.musculos).includes(termo)));
    raiz.querySelector('#contagem').textContent = `${lista.length} ${lista.length === 1 ? 'exercício' : 'exercícios'}`;
    if (!lista.length) {
      grade.innerHTML = `<div class="vazio" style="grid-column:1/-1">${figHtml('respiracao')}<p>Nenhum exercício encontrado.</p><button type="button" class="btn btn-secundario" id="limpar" style="margin-top:12px">Limpar busca</button></div>`;
      grade.querySelector('#limpar').addEventListener('click', () => {
        estado.busca = '';
        estado.filtroArea = 'todos';
        biblioteca(raiz);
      });
    } else {
      grade.innerHTML = lista.map((e) => {
        const tags = [];
        if (store.temVideo(e.id)) tags.push(`<span class="selo acento">${icone('video')}Seu vídeo</span>`);
        if (e.impacto === 'baixo') tags.push('<span class="selo">Sem impacto</span>');
        if (p && !permitido(e, p, 4)) tags.push('<span class="selo">Não está no seu plano</span>');
        return `<a class="card-ex" data-kit="${kitDoExercicio(e)}" href="#/exercicio/${e.id}"><div class="fig">${figHtml(e.id, { prop: 1.2, anim: true })}</div>
          <div class="info"><b>${esc(e.nome)}</b><div class="linha" style="gap:6px">${nivelHtml(e.nivel)}<span class="mini">${esc(NIVEIS[e.nivel])}</span></div>
          ${tags.length ? `<div class="selos" style="margin-top:2px">${tags.join('')}</div>` : ''}</div></a>`;
      }).join('');
    }
    montarFiguras(grade);
  }
  desenhar();
  raiz.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
    estado.filtroArea = b.dataset.filtro;
    raiz.querySelectorAll('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    desenhar();
  }));
  raiz.querySelector('#busca').addEventListener('input', (e) => {
    estado.busca = e.target.value;
    desenhar();
  });
}

export function exercicio(raiz, id) {
  const ex = POR_ID[id];
  if (!ex) return ir('#/exercicios');
  const temVideo = store.temVideo(id);
  const areas = ex.areas.map((a) => `<span class="selo">${esc(AREAS[a])}</span>`).join('');
  const variacoes = [
    ex.facil ? `<a class="cartao liso linha" href="#/exercicio/${ex.facil}"><span class="cresce"><span class="mini muted">Mais fácil</span><br><b>${esc(POR_ID[ex.facil].nome)}</b></span>${icone('seta')}</a>` : '',
    ex.dificil ? `<a class="cartao liso linha" href="#/exercicio/${ex.dificil}"><span class="cresce"><span class="mini muted">Mais difícil</span><br><b>${esc(POR_ID[ex.dificil].nome)}</b></span>${icone('seta')}</a>` : '',
  ].join('');
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Exercício', voltar: '#/exercicios' })}
    <div class="midia" id="midia" data-kit="${kitDoExercicio(ex)}">${figHtml(id, { anim: true, prop: 1.3, video: true })}</div>
    ${temVideo ? '<div class="linha" style="margin-top:8px"><button type="button" class="chip" id="ver-animacao" aria-pressed="false">Ver animação</button></div>' : ''}
    <div class="pilha" style="margin-top:16px">
      <div><h1>${esc(ex.nome)}</h1><p class="muted">${esc(ex.musculos)}</p></div>
      <div class="selos">${areas}<span class="selo">${nivelHtml(ex.nivel, false)} ${esc(NIVEIS[ex.nivel])}</span>${ex.impacto === 'baixo' ? '<span class="selo">Sem impacto</span>' : '<span class="selo">Com salto</span>'}${ex.unilateral ? '<span class="selo">Um lado de cada vez</span>' : ''}${ex.idoso ? '<span class="selo">Bom para 65+</span>' : ''}</div>
      <section><h2 style="margin-bottom:12px">Como fazer</h2><ol class="passos">${ex.passos.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
      <div class="nota">${icone('lampada')}<p><b>Dica:</b> ${esc(ex.dica)}</p></div>
      <div class="nota cuidado">${icone('alerta')}<p><b>Cuidado:</b> ${esc(ex.cuidado)}</p></div>
      ${variacoes ? `<section class="pilha-p"><h2>Variações</h2>${variacoes}</section>` : ''}
      <section class="cartao pilha-p">
        <div class="linha">${icone('video')}<h2 class="cresce">Seu vídeo</h2></div>
        <p class="muted pequeno">${temVideo ? 'Este exercício usa o seu vídeo no treino. Ele fica guardado só neste celular.' : 'Grave você mesmo ou escolha um vídeo da galeria. Ele aparece no lugar da animação durante o treino e fica guardado só neste celular.'}</p>
        <label class="btn btn-secundario btn-largo" for="arquivo-video">${icone('subir')}${temVideo ? 'Trocar vídeo' : 'Adicionar meu vídeo'}</label>
        <input type="file" id="arquivo-video" accept="video/*" class="sr-only">
        ${temVideo ? `<button type="button" class="btn btn-perigo btn-largo" id="remover-video">${icone('lixeira')}Remover vídeo</button>` : ''}
      </section>
    </div>
  </main>${abas('exercicios')}`;
  montarFiguras(raiz);
  raiz.querySelector('#ver-animacao')?.addEventListener('click', (e) => {
    const b = e.currentTarget;
    const animacao = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(animacao));
    b.textContent = animacao ? 'Ver meu vídeo' : 'Ver animação';
    limparFiguras();
    const midia = raiz.querySelector('#midia');
    midia.innerHTML = figHtml(id, { anim: true, prop: 1.3, video: !animacao });
    montarFiguras(midia);
  });
  raiz.querySelector('#arquivo-video').addEventListener('change', async (e) => {
    const arq = e.target.files?.[0];
    if (!arq) return;
    if (!/^video\//.test(arq.type || '') && !/\.(mp4|webm|mov|3gp|mkv)$/i.test(arq.name || '')) {
      aviso('Escolha um arquivo de vídeo.');
      return;
    }
    if (arq.size > MAX_VIDEO) {
      aviso('Vídeo muito grande (máximo 150 MB). Grave um trecho mais curto.');
      return;
    }
    try {
      await store.salvarVideo(id, arq);
      aviso('Vídeo salvo neste celular.');
      limparFiguras();
      exercicio(raiz, id);
    } catch (err) {
      console.error(err);
      aviso('Não foi possível guardar o vídeo. Veja se há espaço no celular.');
    }
  });
  raiz.querySelector('#remover-video')?.addEventListener('click', async () => {
    const ok = await confirmar({ titulo: 'Remover seu vídeo?', texto: 'A animação volta a aparecer neste exercício.', botoes: [{ rotulo: 'Remover', valor: true, estilo: 'btn-perigo' }, { rotulo: 'Cancelar', valor: false }] });
    if (!ok) return;
    await store.removerVideo(id);
    aviso('Vídeo removido.');
    limparFiguras();
    exercicio(raiz, id);
  });
}

const FIG_LIVRE = { corpo_todo: 'burpee', abdomen: 'prancha', pernas: 'agachamento', bracos: 'flexao', costas: 'superman', cardio: 'joelho_alto', alongamento: 'crianca' };

export function livre(raiz) {
  const p = store.perfilAtivo();
  const areas = AREAS_LIVRE.map((a) => `<button type="button" class="opcao" role="radio" aria-checked="${estado.livre.area === a}" data-area="${a}">
      <span class="fig-op" data-kit="${a}">${figHtml(FIG_LIVRE[a])}</span><span class="cresce"><b>${esc(AREAS[a])}</b></span><span class="marca">${icone('check')}</span></button>`).join('');
  const mins = [5, 10, 15, 20, 30].map((m) => `<button type="button" class="opcao" role="radio" aria-checked="${estado.livre.minutos === m}" data-min="${m}"><b>${m}</b><small>min</small></button>`).join('');
  raiz.innerHTML = `<main class="tela sem-abas com-rodape">
    ${topo({ titulo: 'Treino livre', voltar: '#/exercicios' })}
    <p class="muted">Para treinar fora do plano: escolha a área e o tempo.</p>
    <h2 style="margin-top:20px" id="t-area">Área</h2>
    <div class="opcoes" role="radiogroup" aria-labelledby="t-area" style="margin-top:12px">${areas}</div>
    <h2 style="margin-top:24px" id="t-min">Tempo</h2>
    <div class="grade-opcoes" role="radiogroup" aria-labelledby="t-min" style="margin-top:12px">${mins}</div>
  </main>
  <div class="rodape-fixo"><div><button class="btn btn-primario btn-grande" id="montar">Montar treino</button></div></div>`;
  montarFiguras(raiz);
  raiz.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => {
    estado.livre.area = b.dataset.area;
    raiz.querySelectorAll('[data-area]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  }));
  raiz.querySelectorAll('[data-min]').forEach((b) => b.addEventListener('click', () => {
    estado.livre.minutos = Number(b.dataset.min);
    raiz.querySelectorAll('[data-min]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  }));
  raiz.querySelector('#montar').addEventListener('click', () => {
    estado.treinoLivre = montarTreinoLivre({ ...estado.livre, perfil: p, semente: Date.now() });
    ir('#/treino/livre');
  });
}
