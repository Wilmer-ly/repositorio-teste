// Plano de 30 dias (S10) e detalhe do treino (S11).
import * as store from '../store.js';
import { gerarPlano, montarTreino, OBJETIVOS, NIVEIS, TOTAL_DIAS, trocarVariacao, montarTreinoLivre, exerciciosDoTreino } from '../plano.js';
import { diasDoPlanoFeitos, proximoDiaDoPlano } from '../stats.js';
import { AREAS, POR_ID } from '../exercicios.js';
import { dataCurta } from '../datas.js';
import { esc, minutosNumero, plural } from '../util.js';
import { topo, abas, icone, figHtml, montarFiguras, ir, aviso, limparFiguras } from './comum.js';
import { estado } from '../estado.js';
import { rotuloTipo, primeiroDoCircuito } from './hoje.js';
import { kitDoTreino, kitDoExercicio } from '../kits.js';

const ICONE_TIPO = { treino: 'halter', recuperacao: 'folha', desafio: 'trofeu' };
const CURTO_TIPO = { treino: 'Treino', recuperacao: 'Leve', desafio: 'Desafio' };

export function plano(raiz) {
  const p = store.perfilAtivo();
  const ciclo = p.plano?.ciclo || 1;
  const sessoes = store.sessoesDe(p.id);
  const feitos = diasDoPlanoFeitos(sessoes, ciclo);
  const proximo = proximoDiaDoPlano(feitos);
  const dias = gerarPlano(p);
  const semanas = [
    ['Semana 1', 1, 7], ['Semana 2', 8, 14], ['Semana 3', 15, 21], ['Semana 4', 22, 28], ['Reta final', 29, 30],
  ];
  const blocos = semanas.map(([nome, de, ate]) => {
    const tiles = dias.slice(de - 1, ate).map((d) => {
      const feito = feitos.has(d.dia);
      const prox = d.dia === proximo;
      const classe = `dia ${d.tipo} ${feito ? 'feito' : ''} ${prox ? 'proximo' : ''}`;
      const legenda = feito ? 'Feito' : prox ? 'Próximo' : CURTO_TIPO[d.tipo];
      const ponto = d.tipo === 'treino' ? '<span class="ponto" aria-hidden="true"></span>' : '';
      return `<a class="${classe}" data-kit="${kitDoTreino(d, p)}" href="#/treino/${d.dia}" aria-label="Dia ${d.dia}: ${esc(d.titulo)}${feito ? ', feito' : prox ? ', próximo' : ''}">
        ${ponto}${icone(feito ? 'check' : ICONE_TIPO[d.tipo])}<b>${d.dia}</b><small>${legenda}</small></a>`;
    }).join('');
    return `<section><div class="secao-titulo"><h2>${nome}</h2><span class="mini muted">Dias ${de}–${ate}</span></div><div class="grade-dias">${tiles}</div></section>`;
  }).join('');
  const pct = Math.round((feitos.size / TOTAL_DIAS) * 100);
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Plano de 30 dias' })}
    <section class="cartao pilha-p">
      <div class="cabeca-plano">
        <span class="total" aria-hidden="true">${feitos.size}<small>/${TOTAL_DIAS}</small></span>
        <div class="pilha-p"><b>${feitos.size} de ${TOTAL_DIAS} dias feitos</b>
          <div class="meta-barra" role="progressbar" aria-valuemin="0" aria-valuemax="30" aria-valuenow="${feitos.size}" aria-label="Dias feitos"><i style="width:${pct}%"></i></div>
          <span class="mini muted">${pct}% do desafio</span></div>
      </div>
      <div class="selos" style="margin-top:12px"><span class="selo">${esc(OBJETIVOS[p.objetivo])}</span><span class="selo">${esc(AREAS[p.area])}</span><span class="selo">${p.minutos} min</span><span class="selo">${esc(NIVEIS[p.nivel])}</span></div>
      <a class="btn btn-fantasma" href="#/perfil" style="padding-left:0">${icone('ajustes')}Ajustar plano</a>
    </section>
    <div class="legenda" style="margin-top:16px" aria-hidden="true"><span><i></i>Treino</span><span><i class="r"></i>Dia leve</span><span><i class="f"></i>Feito</span><span><i class="p"></i>Próximo</span><span><i class="d"></i>Desafio</span></div>
    ${blocos}
  </main>${abas('plano')}`;
}

function agrupar(treino) {
  const blocos = [];
  for (const passo of treino.passos) {
    if (passo.tipo !== 'exercicio') continue;
    let b = blocos[blocos.length - 1];
    if (!b || b.nome !== passo.bloco) {
      b = { nome: passo.bloco, itens: [], segundos: 0, voltas: passo.voltas || 1 };
      blocos.push(b);
    }
    if (!b.itens.some((i) => i.exId === passo.exId)) b.itens.push({ exId: passo.exId, seg: passo.seg });
  }
  for (const b of blocos) b.segundos = treino.passos.filter((x) => x.bloco === b.nome).reduce((s, x) => s + x.seg, 0);
  return blocos;
}

export function treinoAtual(chave, p) {
  if (chave === 'livre') return estado.treinoLivre;
  const dia = Number(chave);
  if (!(dia >= 1 && dia <= TOTAL_DIAS)) return null;
  let t = montarTreino(dia, p);
  const trocas = estado.trocas[dia] || {};
  for (const [de, para] of Object.entries(trocas)) {
    t = { ...t, passos: t.passos.map((x) => (x.exId === de ? { ...x, exId: para } : x)) };
  }
  return t;
}

export function detalheTreino(raiz, chave) {
  const p = store.perfilAtivo();
  const t = treinoAtual(chave, p);
  if (!t) return ir(chave === 'livre' ? '#/livre' : '#/plano');
  const ciclo = p.plano?.ciclo || 1;
  const jaFeito = t.dia ? store.sessoesDe(p.id).filter((s) => s.tipo === 'plano' && s.completo && s.dia === t.dia && (s.ciclo || 1) === ciclo).pop() : null;
  const blocos = agrupar(t);
  const descanso = t.passos.find((x) => x.tipo === 'descanso')?.seg;
  const lista = blocos.map((b) => {
    const itens = b.itens.map(({ exId, seg }) => {
      const ex = POR_ID[exId];
      const variacoes = b.nome === 'Circuito'
        ? [ex.facil ? `<button type="button" class="chip-acao" data-trocar="${exId}" data-sentido="facil">Mais fácil</button>` : '',
          ex.dificil ? `<button type="button" class="chip-acao" data-trocar="${exId}" data-sentido="dificil">Mais difícil</button>` : ''].join('')
        : '';
      const extras = [ex.unilateral ? 'troque de lado na metade' : '', store.temVideo(exId) ? 'com o seu vídeo' : ''].filter(Boolean).join(', ');
      return `<li class="item-ex">
        <div class="mini-fig" data-kit="${kitDoExercicio(ex)}">${figHtml(exId)}</div>
        <div class="cresce"><a class="nome" href="#/exercicio/${exId}">${esc(ex.nome)}</a>
          <span class="tempo-ex">${seg} s${extras ? `, ${extras}` : ''}</span>
          ${variacoes ? `<div class="acoes">${variacoes}</div>` : ''}</div>
      </li>`;
    }).join('');
    const extra = b.nome === 'Circuito' ? `${plural(b.voltas, 'volta', 'voltas')}, ` : '';
    return `<section class="bloco"><header><h3>${esc(b.nome)}</h3><span class="mini muted">${extra}${minutosNumero(b.segundos)} min</span></header>
      <ul class="lista-ex">${itens}</ul>
      ${b.nome === 'Circuito' && descanso ? `<p class="descanso-info" style="margin-top:8px">${icone('relogio')}Descanso de ${descanso} s entre os exercícios</p>` : ''}</section>`;
  }).join('');
  const titulo = t.dia ? `Dia ${t.dia}` : 'Treino livre';
  raiz.innerHTML = `<main class="tela sem-abas com-rodape">
    ${topo({ titulo, voltar: t.dia ? '#/plano' : '#/livre' })}
    <div class="capa" data-kit="${kitDoTreino(t, p)}">${figHtml(primeiroDoCircuito(t), { anim: true, prop: 1.5, video: true })}</div>
    <div class="pilha-p" style="margin-top:16px">
      <div class="linha"><span class="selo acento">${esc(t.tipo === 'livre' ? 'Livre' : rotuloTipo(t.tipo))}</span>${t.semana && t.dia ? `<span class="mini muted">Semana ${t.semana}</span>` : ''}</div>
      <h1>${esc(t.titulo)}</h1>
      <div class="dados-treino"><span>${icone('relogio')}${minutosNumero(t.segundos)} min</span><span>${icone('halter')}${plural(exerciciosDoTreino(t).length, 'exercício', 'exercícios')}</span></div>
      ${jaFeito ? `<p class="selo ok">${icone('check')}Feito em ${esc(dataCurta(jaFeito.data))}. Pode repetir quando quiser.</p>` : ''}
      ${t.tipo === 'recuperacao' ? '<p class="pequeno muted">Dia leve de propósito: alongar e soltar o corpo ajuda na recuperação e conta para a sua racha.</p>' : ''}
      ${t.tipo === 'desafio' ? '<p class="pequeno muted">O mesmo circuito do Dia 1, com mais tempo e uma volta a mais. Compare como você evoluiu!</p>' : ''}
      ${t.tipo === 'livre' ? '<button type="button" class="btn btn-fantasma" id="sortear" style="padding-left:0">' + icone('sortear') + 'Sortear outros exercícios</button>' : ''}
    </div>
    ${lista}
  </main>
  <div class="rodape-fixo"><div><button class="btn btn-primario btn-grande" id="comecar">${icone('play', 'cheio')}Começar</button></div></div>`;
  montarFiguras(raiz);

  raiz.querySelectorAll('[data-trocar]').forEach((b) => b.addEventListener('click', () => {
    const { trocar: exId, sentido } = b.dataset;
    const novo = trocarVariacao(t, exId, sentido);
    const novoId = novo.passos.find((x, i) => t.passos[i].exId === exId)?.exId;
    if (t.dia) {
      const mapa = estado.trocas[t.dia] || {};
      // Se o exercício já era uma troca, atualiza a origem.
      const origem = Object.keys(mapa).find((k) => mapa[k] === exId) || exId;
      mapa[origem] = novoId;
      if (origem === novoId) delete mapa[origem];
      estado.trocas[t.dia] = mapa;
    } else {
      estado.treinoLivre = novo;
    }
    aviso(`Trocado por: ${POR_ID[novoId].nome}`);
    limparFiguras();
    detalheTreino(raiz, chave);
  }));
  raiz.querySelector('#sortear')?.addEventListener('click', () => {
    estado.treinoLivre = montarTreinoLivre({ ...estado.livre, perfil: p, semente: Date.now() });
    limparFiguras();
    detalheTreino(raiz, 'livre');
  });
  raiz.querySelector('#comecar').addEventListener('click', () => {
    estado.treino = t;
    ir('#/player');
  });
}
