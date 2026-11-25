// Progresso (S17), calendário (S18), conquistas (S19) e atividade externa (S26).
import * as store from '../store.js';
import { estado } from '../estado.js';
import { rachaAtual, melhorRacha, totalSegundos, diasDoPlanoFeitos, segundosPorDia, ultimosDias, recordes, CONQUISTAS, projecaoDoPlano } from '../stats.js';
import { montarTreino, tipoDoDia, TOTAL_DIAS } from '../plano.js';
import { chaveDia, dataDaChave, dataCurta, dataPorExtenso, nomeMes, DIAS_CURTOS } from '../datas.js';
import { esc, minutosNumero, plural } from '../util.js';
import { topo, abas, icone, figHtml, montarFiguras, confirmar, aviso, ir } from './comum.js';

const ICONE_CONQ = { estrela: 'estrela', raio: 'raio', medalha: 'medalha', trofeu: 'trofeu', fogo: 'fogo', relogio: 'relogio', sol: 'sol', lua: 'lua' };

function calendarioHtml(p, sessoes) {
  const hojeK = chaveDia();
  if (!estado.mesCal) {
    const d = new Date();
    estado.mesCal = { ano: d.getFullYear(), mes: d.getMonth() };
  }
  const { ano, mes } = estado.mesCal;
  const porDia = segundosPorDia(sessoes);
  const completos = new Set(sessoes.filter((s) => s.completo).map((s) => s.data));
  const kitDoDia = new Map();
  for (const s of sessoes) if (s.completo && s.kit) kitDoDia.set(s.data, s.kit);
  const proj = projecaoDoPlano(sessoes, p.plano?.ciclo || 1, hojeK);
  const primeiro = new Date(ano, mes, 1);
  const dias = new Date(ano, mes + 1, 0).getDate();
  const cab = DIAS_CURTOS.map((d) => `<span class="sem" aria-hidden="true">${d}</span>`).join('');
  let celulas = '';
  for (let k = 0; k < primeiro.getDay(); k++) celulas += '<span class="cal-dia fora" aria-hidden="true"></span>';
  for (let d = 1; d <= dias; d++) {
    const chave = chaveDia(new Date(ano, mes, d));
    const seg = porDia.get(chave) || 0;
    const classes = ['cal-dia'];
    let estadoTxt = '';
    if (completos.has(chave) || seg >= 60) {
      classes.push(completos.has(chave) ? 'feito' : 'parcial');
      estadoTxt = `treinou ${minutosNumero(seg)} min`;
    } else if (proj.has(chave)) {
      const tipo = tipoDoDia(proj.get(chave), p.nivel);
      classes.push(tipo === 'recuperacao' ? 'descanso' : tipo === 'desafio' ? 'desafio' : 'planejado', 'futuro');
      estadoTxt = `planejado: dia ${proj.get(chave)} do plano`;
    } else if (chave > hojeK) {
      classes.push('futuro');
    }
    if (chave === hojeK) classes.push('hoje');
    const kit = classes.includes('feito') && kitDoDia.get(chave) ? ` data-kit="${kitDoDia.get(chave)}"` : '';
    celulas += `<button type="button" class="${classes.join(' ')}"${kit} data-dia="${chave}" aria-label="${esc(dataPorExtenso(chave))}${estadoTxt ? `, ${estadoTxt}` : ''}">${d}</button>`;
  }
  return `<section class="cartao calendario" id="calendario">
    <header><button type="button" class="btn-icone" id="mes-ant" aria-label="Mês anterior">${icone('voltar')}</button>
      <h3 aria-live="polite">${nomeMes(mes).replace(/^./, (c) => c.toUpperCase())} de ${ano}</h3>
      <button type="button" class="btn-icone" id="mes-prox" aria-label="Próximo mês">${icone('seta')}</button></header>
    <div class="cal-grade">${cab}${celulas}</div>
    <div class="legenda legenda-cal" style="margin-top:12px"><span><i class="t"></i>Treinou</span><span><i class="pl"></i>Plano</span><span><i class="lv"></i>Leve</span><span><i class="dz"></i>Desafio</span></div>
  </section>`;
}

function barrasHtml(sessoes, metaMin) {
  const dias = ultimosDias(sessoes, 7);
  const maxMin = Math.max(metaMin * 1.25, ...dias.map((d) => d.seg / 60), 1);
  const barras = dias.map(({ chave, seg }) => {
    const min = seg / 60;
    const h = Math.max(4, (min / maxMin) * 110);
    const d = dataDaChave(chave);
    return `<div class="b"><span>${Math.round(min) || ''}</span><i class="${min === 0 ? 'zero' : min >= metaMin ? 'ok' : ''}" style="height:${h}px"></i><span>${DIAS_CURTOS[d.getDay()]}</span></div>`;
  }).join('');
  const topoMeta = 150 - 20 - (metaMin / maxMin) * 110;
  return `<div class="barras" role="img" aria-label="Minutos dos últimos 7 dias: ${dias.map((d) => Math.round(d.seg / 60)).join(', ')}">
    <div class="meta-linha" style="top:${topoMeta.toFixed(0)}px"><span>meta ${metaMin} min</span></div>${barras}</div>`;
}

export function progresso(raiz, rolarPara) {
  const p = store.perfilAtivo();
  const sessoes = store.sessoesDe(p.id);
  const feitos = diasDoPlanoFeitos(sessoes, p.plano?.ciclo || 1).size;
  const racha = rachaAtual(sessoes);
  const melhor = melhorRacha(sessoes);
  const total = totalSegundos(sessoes);
  const conquistas = store.conquistasDe(p.id);
  const ultimas = CONQUISTAS.filter((c) => conquistas.has(c.chave)).slice(-3);
  const hist = [...sessoes].reverse().slice(0, 12).map((s) => {
    const cls = s.tipo === 'externo' ? 'externo' : s.completo ? '' : 'parcial';
    const ic = s.tipo === 'externo' ? 'coracao' : s.completo ? 'check' : 'relogio';
    const kit = s.completo && s.kit && s.tipo !== 'externo' ? ` data-kit="${s.kit}"` : '';
    return `<li><span class="marca ${cls}"${kit}>${icone(ic)}</span><span class="cresce"><b>${esc(s.titulo || 'Treino')}</b><br><span class="muted pequeno">${esc(dataCurta(s.data))}, ${minutosNumero(s.segundos)} min${s.completo || s.tipo === 'externo' ? '' : ' (parcial)'}</span></span>
      <button type="button" class="btn-icone" data-apagar="${s.id}" aria-label="Apagar este registro">${icone('lixeira')}</button></li>`;
  }).join('');
  const vazio = !sessoes.length;
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Progresso' })}
    ${vazio ? `<div class="vazio cartao">${figHtml('marcha', { anim: true })}<h2>Seu primeiro treino vai aparecer aqui</h2><p style="margin-top:8px">Dias, minutos, racha e recordes começam a contar no primeiro treino.</p><a class="btn btn-primario" href="#/hoje" style="margin-top:16px">Ir para o treino de hoje</a></div>` : ''}
    <div class="grade-num">
      <div class="num-card">${icone('calendario')}<b>${feitos}/${TOTAL_DIAS}</b><span>dias do desafio</span></div>
      <div class="num-card">${icone('fogo')}<b>${racha}</b><span>dias seguidos (melhor: ${melhor})</span></div>
      <div class="num-card">${icone('relogio')}<b>${minutosNumero(total)}</b><span>minutos no total</span></div>
      <div class="num-card">${icone('halter')}<b>${sessoes.filter((s) => s.tipo !== 'externo').length}</b><span>treinos feitos</span></div>
    </div>
    <div class="secao-titulo"><h2>Calendário</h2></div>
    ${calendarioHtml(p, sessoes)}
    <div class="secao-titulo"><h2>Últimos 7 dias</h2><span class="mini muted">minutos por dia</span></div>
    <section class="cartao">${barrasHtml(sessoes, p.minutos)}</section>
    <div class="secao-titulo"><h2>Recordes e conquistas</h2><a class="mini" href="#/conquistas">Ver todas</a></div>
    <a class="cartao linha" href="#/conquistas">
      <span class="cresce"><b>${conquistas.size} de ${CONQUISTAS.length} conquistas</b><br><span class="muted pequeno">${ultimas.length ? `Últimas: ${ultimas.map((c) => esc(c.nome)).join(', ')}` : 'Treine para desbloquear a primeira.'}</span></span>${icone('medalha')}
    </a>
    <div class="secao-titulo"><h2>Histórico</h2><a class="btn btn-fantasma" href="#/atividade">${icone('mais')}Registrar atividade</a></div>
    ${hist ? `<ul class="historico">${hist}</ul>` : '<p class="muted pequeno">Nada por aqui ainda.</p>'}
  </main>${abas('progresso')}`;
  montarFiguras(raiz);
  if (rolarPara === 'calendario') raiz.querySelector('#calendario').scrollIntoView({ block: 'start' });

  const mudarMes = (delta) => {
    let { ano, mes } = estado.mesCal;
    mes += delta;
    if (mes < 0) { mes = 11; ano--; }
    if (mes > 11) { mes = 0; ano++; }
    estado.mesCal = { ano, mes };
    const cal = raiz.querySelector('#calendario');
    cal.outerHTML = calendarioHtml(p, sessoes);
    ligarCalendario();
  };
  function ligarCalendario() {
    raiz.querySelector('#mes-ant').addEventListener('click', () => mudarMes(-1));
    raiz.querySelector('#mes-prox').addEventListener('click', () => mudarMes(1));
    raiz.querySelectorAll('[data-dia]').forEach((b) => b.addEventListener('click', () => detalheDia(p, sessoes, b.dataset.dia)));
  }
  ligarCalendario();
  raiz.querySelectorAll('[data-apagar]').forEach((b) => b.addEventListener('click', async () => {
    const ok = await confirmar({ titulo: 'Apagar este registro?', texto: 'Os minutos dele saem do seu total. Isso não pode ser desfeito.', botoes: [{ rotulo: 'Apagar', valor: true, estilo: 'btn-perigo' }, { rotulo: 'Cancelar', valor: false }] });
    if (!ok) return;
    await store.apagarSessao(p.id, b.dataset.apagar);
    aviso('Registro apagado.');
    progresso(raiz);
  }));
}

async function detalheDia(p, sessoes, chave) {
  const doDia = sessoes.filter((s) => s.data === chave);
  const proj = projecaoDoPlano(sessoes, p.plano?.ciclo || 1);
  const diaPlano = proj.get(chave);
  const hojeK = chaveDia();
  let texto = '';
  if (doDia.length) {
    texto = doDia.map((s) => `• ${esc(s.titulo || 'Treino')}: ${minutosNumero(s.segundos)} min${s.completo || s.tipo === 'externo' ? '' : ' (parcial)'}`).join('<br>');
  } else if (diaPlano) {
    const t = montarTreino(diaPlano, p);
    texto = `Planejado: <b>Dia ${diaPlano}</b>, ${esc(t.titulo)} (${minutosNumero(t.segundos)} min).`;
  } else {
    texto = chave < hojeK ? 'Nenhum treino neste dia.' : 'Nada planejado ainda.';
  }
  const botoes = [];
  if (diaPlano && chave <= hojeK) botoes.push({ rotulo: 'Fazer agora', valor: 'fazer', estilo: 'btn-primario' });
  else if (diaPlano) botoes.push({ rotulo: 'Ver treino', valor: 'fazer', estilo: 'btn-secundario' });
  botoes.push({ rotulo: 'Fechar', valor: null });
  const r = await confirmar({ titulo: dataPorExtenso(chave).replace(/^./, (c) => c.toUpperCase()), texto, botoes });
  if (r === 'fazer') ir(`#/treino/${diaPlano}`);
}

export function conquistasTela(raiz) {
  const p = store.perfilAtivo();
  const sessoes = store.sessoesDe(p.id);
  const r = recordes(sessoes);
  const tem = store.conquistasDe(p.id);
  const rec = [
    ['relogio', 'Treino mais longo', r.maiorSessao.seg ? `${minutosNumero(r.maiorSessao.seg)} min` : '—', r.maiorSessao.data],
    ['raio', 'Dia com mais minutos', r.maiorDia.seg ? `${minutosNumero(r.maiorDia.seg)} min` : '—', r.maiorDia.data],
    ['fogo', 'Maior racha', r.melhorRacha ? plural(r.melhorRacha, 'dia', 'dias') : '—', null],
  ].map(([ic, nome, valor, data]) => `<div class="cartao recorde"><div class="disco">${icone(ic)}</div><div class="cresce"><span class="muted pequeno">${nome}</span><br><b style="font-size:20px">${esc(valor)}</b>${data ? ` <span class="mini muted">em ${esc(dataCurta(data))}</span>` : ''}</div></div>`).join('');
  const med = CONQUISTAS.map((c) => {
    const ok = tem.has(c.chave);
    return `<div class="medalha ${ok ? '' : 'bloqueada'}"><div class="disco">${icone(ok ? ICONE_CONQ[c.icone] || 'medalha' : 'cadeado')}</div><b>${esc(c.nome)}</b><small>${ok ? `em ${esc(dataCurta(tem.get(c.chave)))}` : esc(c.desc)}</small></div>`;
  }).join('');
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Recordes e conquistas', voltar: '#/progresso' })}
    <div class="pilha-p">${rec}</div>
    <div class="secao-titulo"><h2>Conquistas</h2><span class="mini muted">${tem.size} de ${CONQUISTAS.length}</span></div>
    <div class="grade-med">${med}</div>
  </main>${abas('progresso')}`;
}

const TIPOS_ATIV = ['Caminhada', 'Corrida', 'Bicicleta', 'Dança', 'Futebol', 'Natação', 'Musculação', 'Outra atividade'];

export function atividade(raiz) {
  const p = store.perfilAtivo();
  const hojeK = chaveDia();
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Registrar atividade', voltar: '#/progresso' })}
    <p class="muted">Fez alguma atividade fora do app? Registre aqui: os minutos contam para a meta e para a racha.</p>
    <form id="form-ativ" class="pilha" style="margin-top:16px" novalidate>
      <div class="campo"><label for="tipo">Atividade</label><select class="entrada" id="tipo">${TIPOS_ATIV.map((t) => `<option>${t}</option>`).join('')}</select></div>
      <div class="campo"><label for="min">Minutos</label><input class="entrada" id="min" type="number" inputmode="numeric" min="1" max="300" value="30"></div>
      <div class="campo"><label for="data">Data</label><input class="entrada" id="data" type="date" max="${hojeK}" value="${hojeK}"></div>
      <p class="erro-campo" id="erro" hidden></p>
      <button class="btn btn-primario btn-grande" type="submit">Salvar</button>
    </form>
  </main>${abas('progresso')}`;
  raiz.querySelector('#form-ativ').addEventListener('submit', async (e) => {
    e.preventDefault();
    const min = Math.round(Number(raiz.querySelector('#min').value));
    const data = raiz.querySelector('#data').value;
    const erro = raiz.querySelector('#erro');
    if (!(min >= 1 && min <= 300)) {
      erro.textContent = 'Informe entre 1 e 300 minutos.';
      erro.hidden = false;
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data > hojeK) {
      erro.textContent = 'Escolha uma data até hoje.';
      erro.hidden = false;
      return;
    }
    const tipo = raiz.querySelector('#tipo').value;
    const { novidades } = await store.registrarSessao(p, { tipo: 'externo', titulo: tipo, segundos: min * 60, data, inicio: `${data}T12:00:00`, completo: false });
    aviso(novidades.metaSuperada ? `Parabéns! Passou da meta do dia com ${tipo.toLowerCase()}.` : `${tipo} registrada: ${min} min.`);
    ir('#/progresso');
  });
}

