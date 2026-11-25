// Progresso, recordes e conquistas (lógica pura).
import { somarDias, chaveDia } from './datas.js';
import { TOTAL_DIAS } from './plano.js';

export const MIN_SEG_DIA_ATIVO = 60;

export function segundosPorDia(sessoes) {
  const m = new Map();
  for (const s of sessoes) m.set(s.data, (m.get(s.data) || 0) + (s.segundos || 0));
  return m;
}

export function diasAtivos(sessoes) {
  const porDia = segundosPorDia(sessoes);
  const ativos = new Set();
  for (const s of sessoes) if (s.completo || (porDia.get(s.data) || 0) >= MIN_SEG_DIA_ATIVO) ativos.add(s.data);
  return ativos;
}

export function rachaAtual(sessoes, hoje = chaveDia()) {
  const ativos = diasAtivos(sessoes);
  let dia = ativos.has(hoje) ? hoje : somarDias(hoje, -1);
  let n = 0;
  while (ativos.has(dia)) {
    n++;
    dia = somarDias(dia, -1);
  }
  return n;
}

export function melhorRacha(sessoes) {
  const dias = [...diasAtivos(sessoes)].sort();
  let melhor = 0;
  let atual = 0;
  let anterior = null;
  for (const d of dias) {
    atual = anterior && somarDias(anterior, 1) === d ? atual + 1 : 1;
    melhor = Math.max(melhor, atual);
    anterior = d;
  }
  return melhor;
}

export function totalSegundos(sessoes) {
  return sessoes.reduce((s, x) => s + (x.segundos || 0), 0);
}

export function diasDoPlanoFeitos(sessoes, ciclo = 1) {
  const feitos = new Set();
  for (const s of sessoes) if (s.tipo === 'plano' && s.completo && (s.ciclo || 1) === ciclo && s.dia) feitos.add(s.dia);
  return feitos;
}

export function proximoDiaDoPlano(feitos) {
  for (let d = 1; d <= TOTAL_DIAS; d++) if (!feitos.has(d)) return d;
  return TOTAL_DIAS + 1;
}

export function recordes(sessoes) {
  let maiorSessao = { seg: 0, data: null };
  for (const s of sessoes) if ((s.segundos || 0) > maiorSessao.seg) maiorSessao = { seg: s.segundos, data: s.data };
  let maiorDia = { seg: 0, data: null };
  for (const [data, seg] of segundosPorDia(sessoes)) if (seg > maiorDia.seg) maiorDia = { seg, data };
  return { maiorSessao, maiorDia, melhorRacha: melhorRacha(sessoes) };
}

export const CONQUISTAS = [
  { chave: 'primeiro', nome: 'Primeiro treino', desc: 'Você começou. O mais difícil já foi.', icone: 'estrela' },
  { chave: 'meta', nome: 'Passou da meta', desc: 'Treinou mais que o tempo do dia.', icone: 'raio' },
  { chave: 'dias_3', nome: '3 dias do desafio', desc: 'Três dias do plano concluídos.', icone: 'medalha' },
  { chave: 'dias_7', nome: 'Semana 1 completa', desc: 'Sete dias do plano concluídos.', icone: 'medalha' },
  { chave: 'dias_14', nome: 'Metade do caminho', desc: 'Quatorze dias do plano concluídos.', icone: 'medalha' },
  { chave: 'dias_21', nome: 'Hábito formado', desc: 'Vinte e um dias do plano concluídos.', icone: 'medalha' },
  { chave: 'dias_30', nome: 'Desafio completo!', desc: 'Os 30 dias do plano concluídos.', icone: 'trofeu' },
  { chave: 'racha_3', nome: 'Racha de 3 dias', desc: 'Três dias seguidos de treino.', icone: 'fogo' },
  { chave: 'racha_7', nome: 'Uma semana sem parar', desc: 'Sete dias seguidos.', icone: 'fogo' },
  { chave: 'racha_14', nome: 'Duas semanas seguidas', desc: 'Quatorze dias seguidos.', icone: 'fogo' },
  { chave: 'racha_30', nome: 'Trinta dias seguidos', desc: 'Um mês inteiro sem falhar.', icone: 'fogo' },
  { chave: 'min_60', nome: '1 hora de treino', desc: 'Sessenta minutos somados.', icone: 'relogio' },
  { chave: 'min_300', nome: '5 horas de treino', desc: 'Trezentos minutos somados.', icone: 'relogio' },
  { chave: 'min_600', nome: '10 horas de treino', desc: 'Seiscentos minutos somados.', icone: 'relogio' },
  { chave: 'min_1200', nome: '20 horas de treino', desc: 'Mil e duzentos minutos somados.', icone: 'relogio' },
  { chave: 'cedo', nome: 'Madrugador', desc: 'Treinou antes das 7 da manhã.', icone: 'sol' },
  { chave: 'noite', nome: 'Treino noturno', desc: 'Treinou depois das 21h.', icone: 'lua' },
];

function horaLocal(iso) {
  return iso ? new Date(iso).getHours() : 12;
}

// Conjunto de conquistas que as sessões já garantem.
export function conquistasAlcancadas(sessoes, metaSeg, ciclo = 1) {
  const c = new Set();
  if (!sessoes.length) return c;
  c.add('primeiro');
  const porDia = segundosPorDia(sessoes);
  if ([...porDia.values()].some((s) => s > metaSeg)) c.add('meta');
  const feitos = diasDoPlanoFeitos(sessoes, ciclo).size;
  for (const n of [3, 7, 14, 21, 30]) if (feitos >= n) c.add(`dias_${n}`);
  const racha = melhorRacha(sessoes);
  for (const n of [3, 7, 14, 30]) if (racha >= n) c.add(`racha_${n}`);
  const min = totalSegundos(sessoes) / 60;
  for (const n of [60, 300, 600, 1200]) if (min >= n) c.add(`min_${n}`);
  if (sessoes.some((s) => s.tipo !== 'externo' && horaLocal(s.inicio) < 7)) c.add('cedo');
  if (sessoes.some((s) => s.tipo !== 'externo' && horaLocal(s.inicio) >= 21)) c.add('noite');
  return c;
}

// O que há de novo depois de registrar uma sessão: meta, recordes e conquistas.
export function novidades(antes, depois, { metaSeg, ciclo = 1, jaTem = new Set(), sessao = depois[depois.length - 1] } = {}) {
  const hoje = sessao.data;
  const antesHoje = segundosPorDia(antes).get(hoje) || 0;
  const depoisHoje = segundosPorDia(depois).get(hoje) || 0;
  const metaSuperada = antesHoje <= metaSeg && depoisHoje > metaSeg;
  const metaAtingida = antesHoje < metaSeg && depoisHoje >= metaSeg;
  const r0 = recordes(antes);
  const r1 = recordes(depois);
  const novosRecordes = [];
  if (antes.length) {
    if (r1.maiorSessao.seg > r0.maiorSessao.seg) novosRecordes.push({ chave: 'maiorSessao', valor: r1.maiorSessao.seg, anterior: r0.maiorSessao.seg });
    if (r1.maiorDia.seg > r0.maiorDia.seg && r1.maiorDia.data === hoje) novosRecordes.push({ chave: 'maiorDia', valor: r1.maiorDia.seg, anterior: r0.maiorDia.seg });
    if (r1.melhorRacha > r0.melhorRacha && r1.melhorRacha >= 2) novosRecordes.push({ chave: 'melhorRacha', valor: r1.melhorRacha, anterior: r0.melhorRacha });
  }
  const alcancadas = conquistasAlcancadas(depois, metaSeg, ciclo);
  const novasConquistas = CONQUISTAS.filter((c) => alcancadas.has(c.chave) && !jaTem.has(c.chave));
  return {
    hojeSeg: depoisHoje,
    metaSeg,
    metaAtingida,
    metaSuperada,
    excedenteSeg: Math.max(0, depoisHoje - metaSeg),
    novosRecordes,
    novasConquistas,
  };
}

// Últimos n dias (do mais antigo para hoje) com os segundos de cada um.
export function ultimosDias(sessoes, n = 7, hoje = chaveDia()) {
  const porDia = segundosPorDia(sessoes);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const chave = somarDias(hoje, -i);
    out.push({ chave, seg: porDia.get(chave) || 0 });
  }
  return out;
}

// Projeção dos próximos dias do plano no calendário: data -> número do dia.
export function projecaoDoPlano(sessoes, ciclo, hoje = chaveDia()) {
  const feitos = diasDoPlanoFeitos(sessoes, ciclo);
  const mapa = new Map();
  const hojeFeito = sessoes.some((s) => s.tipo === 'plano' && s.completo && (s.ciclo || 1) === ciclo && s.data === hoje);
  let data = hojeFeito ? somarDias(hoje, 1) : hoje;
  for (let d = 1; d <= TOTAL_DIAS; d++) {
    if (feitos.has(d)) continue;
    mapa.set(data, d);
    data = somarDias(data, 1);
  }
  return mapa;
}
