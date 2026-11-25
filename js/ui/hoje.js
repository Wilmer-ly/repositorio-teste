// Tela Hoje (S09).
import * as store from '../store.js';
import { montarTreino, exerciciosDoTreino, TOTAL_DIAS } from '../plano.js';
import { rachaAtual, totalSegundos, diasDoPlanoFeitos, proximoDiaDoPlano, segundosPorDia, ultimosDias, diasAtivos } from '../stats.js';
import { chaveDia, dataPorExtenso, dataDaChave, DIAS_CURTOS, diasEntre } from '../datas.js';
import { dicaDoDia, CATEGORIAS } from '../dicas.js';
import { esc, saudacao, primeiroNome, minutosNumero, plural } from '../util.js';
import { topo, abas, icone, figHtml, montarFiguras, confirmar, aviso, ir } from './comum.js';
import { estado } from '../estado.js';
import { POR_ID } from '../exercicios.js';
import { kitDoTreino } from '../kits.js';

const TIPO_ROTULO = { treino: 'Treino', recuperacao: 'Recuperação ativa', desafio: 'Desafio final' };

export function rotuloTipo(tipo) {
  return TIPO_ROTULO[tipo] || 'Treino';
}

// Exercício que representa o treino na capa: o primeiro do circuito, de preferência um com ilustração.
export function primeiroDoCircuito(treino) {
  const ex = treino.passos.filter((p) => p.tipo === 'exercicio');
  const circ = ex.filter((p) => p.bloco === 'Circuito' || p.bloco === 'Mobilidade');
  const escolha = circ.find((p) => POR_ID[p.exId]?.arte) || circ[0] || ex.find((p) => POR_ID[p.exId]?.arte) || ex[0];
  return escolha?.exId;
}

export function hoje(raiz) {
  const p = store.perfilAtivo();
  const sessoes = store.sessoesDe(p.id);
  const ciclo = p.plano?.ciclo || 1;
  const hojeK = chaveDia();
  const feitos = diasDoPlanoFeitos(sessoes, ciclo);
  const proximo = proximoDiaDoPlano(feitos);
  const hojeSeg = segundosPorDia(sessoes).get(hojeK) || 0;
  const metaSeg = p.minutos * 60;
  const feitoHoje = sessoes.some((s) => s.tipo === 'plano' && s.completo && (s.ciclo || 1) === ciclo && s.data === hojeK);
  const racha = rachaAtual(sessoes, hojeK);
  const total = totalSegundos(sessoes);
  const completo = proximo > TOTAL_DIAS;

  let cartaoTreino = '';
  if (completo) {
    cartaoTreino = `<section class="treino-hoje" data-kit="desafio">
      <div class="medalha-fim">${icone('trofeu')}</div>
      <h2>Desafio completo!</h2>
      <p>Você fez os 30 dias. Que tal começar um novo desafio, mais forte?</p>
      <div class="acoes" style="margin-top:16px">
        <button class="btn btn-primario btn-grande" id="novo-desafio">Começar novo desafio</button>
        <a class="btn btn-secundario" href="#/livre">Treino livre</a>
      </div>
    </section>`;
  } else if (feitoHoje) {
    const ok = hojeSeg >= metaSeg;
    cartaoTreino = `<section class="treino-hoje" data-kit="descanso">
      <div class="cabeca">${icone('check')}<b>Feito por hoje</b></div>
      <h2>Treino de hoje feito!</h2>
      <p style="margin-top:4px">Você treinou <b>${minutosNumero(hojeSeg)} min</b> hoje${ok ? ' e passou da sua meta.' : '.'}</p>
      <div class="acoes" style="margin-top:16px">
        <a class="btn btn-primario" href="#/treino/${proximo}">Adiantar o Dia ${proximo}</a>
        <a class="btn btn-fantasma" href="#/livre">Fazer um treino livre</a>
      </div>
    </section>`;
  } else {
    const t = montarTreino(proximo, p);
    const n = exerciciosDoTreino(t).length;
    const voltas = t.passos.find((x) => x.voltas)?.voltas;
    cartaoTreino = `<section class="treino-hoje" data-kit="${kitDoTreino(t, p)}">
      <span class="camisa" aria-hidden="true">${proximo}</span>
      <div class="cabeca"><b>Dia ${proximo} de ${TOTAL_DIAS}</b><span class="selo">${esc(rotuloTipo(t.tipo))}</span></div>
      <div class="palco">${figHtml(primeiroDoCircuito(t), { anim: true, prop: 1.5, video: true })}</div>
      <h2>${esc(t.titulo)}</h2>
      <div class="dados">
        <span>${icone('relogio')}${minutosNumero(t.segundos)} min</span>
        <span>${icone('halter')}${plural(n, 'exercício', 'exercícios')}</span>
        ${voltas ? `<span>${icone('repetir')}${voltas} ${voltas === 1 ? 'volta' : 'voltas'}</span>` : ''}
      </div>
      <a class="btn btn-primario btn-grande" href="#/treino/${proximo}">${icone('play', 'cheio')}Começar treino</a>
    </section>`;
  }

  // Semana: últimos 7 dias.
  const ativos = diasAtivos(sessoes);
  const kitDoDia = new Map();
  for (const s of sessoes) if (s.kit) kitDoDia.set(s.data, s.kit);
  const semana = ultimosDias(sessoes, 7, hojeK).map(({ chave }) => {
    const d = dataDaChave(chave);
    const feito = ativos.has(chave);
    const ehHoje = chave === hojeK;
    const kit = feito && kitDoDia.get(chave) ? ` data-kit="${kitDoDia.get(chave)}"` : '';
    return `<div class="d"><span>${DIAS_CURTOS[d.getDay()]}</span><span class="bola ${feito ? 'feito' : ''} ${ehHoje ? 'hoje' : ''}"${kit} aria-label="${dataPorExtenso(chave)}: ${feito ? 'treinou' : 'sem treino'}">${feito ? icone('check') : d.getDate()}</span></div>`;
  }).join('');

  const idx = diasEntre('2026-01-01', hojeK) + (p.nome.length % 7);
  const dica = dicaDoDia(idx);
  const metaFrac = Math.min(100, Math.round((hojeSeg / metaSeg) * 100));
  const lembrete = !p.ajustes?.lembreteCriado
    ? `<a class="cartao liso linha" href="#/lembrete" style="margin-top:12px">${icone('sino')}<span class="cresce"><b>Lembrete diário</b><br><span class="muted pequeno">Receba um aviso na hora de treinar.</span></span>${icone('seta')}</a>`
    : '';

  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: '' })}
    <div class="saudacao"><h1>${esc(saudacao())}, ${esc(primeiroNome(p.nome))}!</h1><p>${esc(dataPorExtenso(hojeK))}</p></div>
    ${cartaoTreino}
    <section class="placar numeros" aria-label="Seus números">
      <div><b>${feitos.size}<small>/${TOTAL_DIAS}</small></b><span>dias feitos</span></div>
      <div>${icone('fogo')}<b>${racha}</b><span>${racha === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
      <div>${icone('relogio')}<b>${minutosNumero(total)}</b><span>minutos no total</span></div>
    </section>
    <section class="cartao pilha-p" style="margin-top:8px">
      <div class="linha entre"><h3>Meta de hoje</h3><span class="mini muted">${minutosNumero(hojeSeg)} de ${p.minutos} min</span></div>
      <div class="meta-barra ${metaFrac >= 100 ? 'ok' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="${p.minutos}" aria-valuenow="${minutosNumero(hojeSeg)}" aria-label="Minutos de hoje"><i style="width:${metaFrac}%"></i></div>
    </section>
    <div class="secao-titulo"><h2>Últimos 7 dias</h2><a class="mini" href="#/progresso">Ver progresso</a></div>
    <div class="semana">${semana}</div>
    <div class="secao-titulo"><h2>Dica do dia</h2><a class="mini" href="#/dicas">Todas</a></div>
    <a class="cartao dica-card pilha-p" href="#/dica/${esc(dica.id)}">
      <span class="mini cat">${esc(CATEGORIAS[dica.cat])}</span><h3>${esc(dica.titulo)}</h3><p class="muted pequeno">${esc(dica.texto)}</p>
    </a>
    ${lembrete}
  </main>${abas('hoje')}`;
  montarFiguras(raiz);

  raiz.querySelector('#novo-desafio')?.addEventListener('click', async () => {
    const r = await confirmar({ titulo: 'Começar um novo desafio?', texto: 'Seu histórico, recordes e conquistas continuam guardados. O plano volta para o Dia 1.', botoes: [{ rotulo: 'Começar de novo', valor: true, estilo: 'btn-primario' }, { rotulo: 'Agora não', valor: false }] });
    if (!r) return;
    await store.reiniciarDesafio(p.id);
    estado.trocas = {};
    aviso('Novo desafio começou. Bora!');
    ir('#/hoje');
  });
}
