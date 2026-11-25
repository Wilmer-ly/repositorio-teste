// Motor do plano de 30 dias e montagem de treinos (lógica pura, sem DOM).
import { EXERCICIOS, POR_ID, AREAS } from './exercicios.js';

export const NIVEIS = { 1: 'Iniciante', 2: 'Intermediário', 3: 'Avançado' };
export const OBJETIVOS = {
  perder_peso: 'Perder peso',
  definir: 'Definir uma parte do corpo',
  forca: 'Ganhar força',
  disposicao: 'Mais disposição e fôlego',
  mobilidade: 'Alongar e soltar o corpo',
};
export const AREAS_FOCO = ['corpo_todo', 'abdomen', 'pernas', 'bracos', 'costas'];
export const MINUTOS_OPCOES = [10, 15, 20, 30, 45];
export const TOTAL_DIAS = 30;

const SEMANAS = { 1: 'TRTRTTR', 2: 'TTRTTTR', 3: 'TTTRTTR' };
const TEMAS = {
  perder_peso: ['cardio', 'foco', 'corpo', 'cardio', 'foco'],
  definir: ['foco', 'corpo', 'foco', 'cardio', 'foco'],
  forca: ['foco', 'corpo', 'foco', 'core', 'corpo'],
  disposicao: ['cardio', 'corpo', 'cardio', 'core', 'corpo'],
  mobilidade: ['core', 'mobilidade', 'corpo', 'mobilidade', 'core'],
};
const TITULOS = {
  cardio: 'Cardio para suar',
  corpo: 'Corpo todo',
  core: 'Abdômen e postura',
  mobilidade: 'Mobilidade e força leve',
  recuperacao: 'Recuperação ativa',
  desafio: 'Desafio final',
};
// Tempos de trabalho e descanso por nível e semana (segundos).
const TEMPOS = {
  1: { trabalho: [30, 35, 40, 40], descanso: [30, 30, 25, 25] },
  2: { trabalho: [40, 45, 45, 50], descanso: [20, 20, 15, 15] },
  3: { trabalho: [45, 50, 50, 55], descanso: [15, 15, 15, 10] },
};

// ---------- aleatoriedade determinística ----------
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function embaralhar(lista, rnd) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- regras do perfil ----------
export function faixaIdade(idade) {
  if (idade >= 65) return 'senior';
  if (idade >= 50) return 'maduro';
  return 'adulto';
}

export function permitido(ex, perfil, semana = 1) {
  const faixa = faixaIdade(perfil.idade);
  if (faixa !== 'adulto' && ex.impacto === 'alto') return false;
  if (faixa === 'senior' && !ex.idoso) return false;
  const nivel = perfil.nivel || 1;
  const teto = Math.min(3, nivel + (semana >= 3 && ex.impacto === 'baixo' ? 1 : 0));
  return ex.nivel <= teto;
}

export function tempos(perfil, semana = 1) {
  const t = TEMPOS[perfil.nivel || 1];
  const i = Math.min(3, Math.max(0, semana - 1));
  let trabalho = t.trabalho[i];
  let descanso = t.descanso[i];
  const faixa = faixaIdade(perfil.idade);
  if (faixa === 'maduro') descanso += 10;
  if (faixa === 'senior') { descanso += 15; trabalho -= 5; }
  const ajuste = perfil.ajustes?.descanso;
  if (typeof ajuste === 'number' && ajuste > 0) descanso = ajuste;
  return { trabalho, descanso };
}

// ---------- calendário do desafio ----------
export function tipoDoDia(dia, nivel = 1) {
  if (dia === TOTAL_DIAS) return 'desafio';
  if (dia === TOTAL_DIAS - 1) return 'recuperacao';
  const padrao = SEMANAS[nivel] || SEMANAS[1];
  return padrao[(dia - 1) % 7] === 'T' ? 'treino' : 'recuperacao';
}

export function semanaDoDia(dia) {
  return Math.min(4, Math.ceil(dia / 7));
}

export function temaDoDia(dia, perfil) {
  const tipo = tipoDoDia(dia, perfil.nivel);
  if (tipo !== 'treino') return tipo;
  let n = 0;
  for (let d = 1; d <= dia; d++) if (tipoDoDia(d, perfil.nivel) === 'treino') n++;
  const temas = TEMAS[perfil.objetivo] || TEMAS.definir;
  const tema = temas[(n - 1) % temas.length];
  if (tema === 'foco' && (!perfil.area || perfil.area === 'corpo_todo')) return 'corpo';
  return tema;
}

export function tituloDoTema(tema, perfil) {
  if (tema === 'foco') return `Foco: ${AREAS[perfil.area] || 'corpo todo'}`;
  return TITULOS[tema] || 'Treino';
}

export function gerarPlano(perfil) {
  const dias = [];
  for (let dia = 1; dia <= TOTAL_DIAS; dia++) {
    const tipo = tipoDoDia(dia, perfil.nivel);
    const tema = temaDoDia(dia, perfil);
    dias.push({ dia, tipo, tema, semana: semanaDoDia(dia), titulo: tituloDoTema(tema, perfil) });
  }
  return dias;
}

// ---------- seleção de exercícios ----------
function pool(areas, perfil, semana, extra = () => true) {
  return EXERCICIOS.filter((e) => e.areas.some((a) => areas.includes(a)) && permitido(e, perfil, semana) && extra(e));
}

function escolher(lista, n, rnd, usados = new Set()) {
  const out = [];
  for (const e of embaralhar(lista, rnd)) {
    if (out.length >= n) break;
    if (usados.has(e.id)) continue;
    usados.add(e.id);
    out.push(e);
  }
  return out;
}

const AREAS_CORPO = ['pernas', 'bracos', 'abdomen', 'costas'];

function escolherCircuito(tema, perfil, semana, k, rnd, usados = new Set()) {
  const foco = perfil.area && perfil.area !== 'corpo_todo' ? perfil.area : null;
  let lista = [];
  if (tema === 'cardio') {
    lista = escolher(pool(['cardio'], perfil, semana), Math.ceil(k * 0.6), rnd, usados);
    lista = lista.concat(escolher(pool(foco ? [foco] : AREAS_CORPO, perfil, semana), k - lista.length, rnd, usados));
  } else if (tema === 'foco' && foco) {
    lista = escolher(pool([foco], perfil, semana), Math.ceil(k * 0.6), rnd, usados);
    lista = lista.concat(escolher(pool(AREAS_CORPO.filter((a) => a !== foco).concat('cardio'), perfil, semana), k - lista.length, rnd, usados));
  } else if (tema === 'core') {
    lista = escolher(pool(['abdomen', 'costas'], perfil, semana), k, rnd, usados);
  } else if (tema === 'mobilidade') {
    lista = escolher(pool(['costas', 'abdomen'], perfil, semana, (e) => e.nivel === 1), Math.ceil(k / 2), rnd, usados);
    lista = lista.concat(escolher(pool(['alongamento'], perfil, semana, (e) => e.id !== 'respiracao'), k - lista.length, rnd, usados));
  } else {
    // corpo todo: uma de cada área, depois completa
    for (const a of ['pernas', 'bracos', 'abdomen', 'cardio', 'costas']) {
      if (lista.length >= k) break;
      lista = lista.concat(escolher(pool([a], perfil, semana), 1, rnd, usados));
    }
    if (lista.length < k) lista = lista.concat(escolher(pool(AREAS_CORPO.concat('cardio'), perfil, semana), k - lista.length, rnd, usados));
  }
  // Se faltou exercício (perfil muito restrito), completa com qualquer permitido.
  if (lista.length < k) lista = lista.concat(escolher(pool(AREAS_CORPO.concat('cardio'), perfil, 4), k - lista.length, rnd, usados));
  // Ordena: em pé primeiro, chão depois (menos sobe-e-desce).
  return lista.sort((a, b) => Number(!!a.chao) - Number(!!b.chao));
}

function blocoSimples(ids, seg, bloco) {
  const passos = [];
  ids.forEach((id) => passos.push({ tipo: 'exercicio', exId: id, seg, bloco }));
  return passos;
}

function aquecimento(perfil, minutos, rnd, usados = new Set()) {
  if (perfil.ajustes?.aquecimento === false) return [];
  const seg = minutos >= 20 ? 45 : 30;
  const lista = escolher(pool(['aquecimento'], perfil, 1), 4, rnd, usados);
  return blocoSimples(lista.map((e) => e.id), seg, 'Aquecimento');
}

function voltaACalma(perfil, minutos, rnd, usados = new Set()) {
  const n = minutos >= 20 ? 4 : 3;
  const seg = minutos >= 20 ? 45 : 40;
  const lista = escolher(pool(['alongamento'], perfil, 1, (e) => !e.unilateral || minutos >= 20), n, rnd, usados)
    .sort((a, b) => Number(!!a.chao) - Number(!!b.chao));
  return blocoSimples(lista.map((e) => e.id), seg, 'Volta à calma');
}

export function duracao(passos) {
  return passos.reduce((s, p) => s + p.seg, 0);
}

function montarCircuito(lista, perfil, semana, segundosDisponiveis, rodadasExtra = 0) {
  const { trabalho, descanso } = tempos(perfil, semana);
  const k = lista.length;
  const porVolta = k * (trabalho + descanso);
  const voltas = Math.max(1, Math.round(segundosDisponiveis / porVolta)) + rodadasExtra;
  const passos = [];
  for (let v = 1; v <= voltas; v++) {
    lista.forEach((e, i) => {
      passos.push({ tipo: 'exercicio', exId: e.id, seg: trabalho, bloco: 'Circuito', volta: v, voltas });
      const ultimo = v === voltas && i === k - 1;
      if (!ultimo) passos.push({ tipo: 'descanso', seg: i === k - 1 ? Math.max(descanso, 30) : descanso, bloco: 'Circuito' });
    });
  }
  return passos;
}

function treinoRecuperacao(perfil, minutos, rnd) {
  const total = Math.max(8, Math.round(minutos / 2)) * 60;
  const seg = 50;
  const n = Math.max(6, Math.round(total / seg));
  let lista = escolher(pool(['alongamento'], perfil, 1), n, rnd);
  const extras = escolher(pool(['aquecimento'], perfil, 1, (e) => e.impacto === 'baixo'), Math.max(0, n - lista.length), rnd);
  lista = extras.concat(lista).sort((a, b) => Number(!!a.chao) - Number(!!b.chao));
  return blocoSimples(lista.map((e) => e.id), seg, 'Mobilidade');
}

// Monta o treino de um dia do desafio.
export function montarTreino(dia, perfil) {
  const ciclo = perfil.plano?.ciclo || 1;
  const semente = perfil.plano?.semente || perfil.id || 'bora';
  const rnd = aleatorio(hash(`${semente}:${ciclo}:${dia}`));
  const minutos = perfil.minutos || 15;
  const tipo = tipoDoDia(dia, perfil.nivel);
  const semana = semanaDoDia(dia);
  const tema = temaDoDia(dia, perfil);
  let passos;
  if (tipo === 'recuperacao') {
    passos = treinoRecuperacao(perfil, minutos, rnd);
  } else {
    const usados = new Set();
    const aq = aquecimento(perfil, minutos, rnd, usados);
    const vc = voltaACalma(perfil, minutos, rnd, usados);
    const k = minutos <= 10 ? 4 : minutos <= 20 ? 5 : 6;
    let lista;
    if (tipo === 'desafio') {
      // Repete o circuito do Dia 1 com os tempos da semana 4: dá para sentir a evolução.
      const rnd1 = aleatorio(hash(`${semente}:${ciclo}:1`));
      const usados1 = new Set();
      aquecimento(perfil, minutos, rnd1, usados1);
      voltaACalma(perfil, minutos, rnd1, usados1);
      lista = escolherCircuito(temaDoDia(1, perfil), perfil, 1, k, rnd1, usados1);
    } else {
      lista = escolherCircuito(tema, perfil, semana, k, rnd, usados);
    }
    const disponivel = minutos * 60 - duracao(aq) - duracao(vc);
    passos = [...aq, ...montarCircuito(lista, perfil, semana, disponivel, tipo === 'desafio' ? 1 : 0), ...vc];
  }
  return {
    id: `dia-${dia}`,
    dia,
    tipo,
    tema,
    semana,
    titulo: tituloDoTema(tema, perfil),
    passos,
    segundos: duracao(passos),
  };
}

// Treino livre: escolher área e minutos.
export const AREAS_LIVRE = ['corpo_todo', 'abdomen', 'pernas', 'bracos', 'costas', 'cardio', 'alongamento'];

export function montarTreinoLivre({ area = 'corpo_todo', minutos = 10, perfil, semente = Date.now() }) {
  const rnd = aleatorio(hash(`livre:${semente}`));
  const p = { ...perfil, area: AREAS_FOCO.includes(area) ? area : perfil.area };
  let passos;
  let titulo;
  if (area === 'alongamento') {
    passos = treinoRecuperacao(p, minutos * 2, rnd);
    titulo = 'Alongamento';
  } else {
    const tema = area === 'cardio' ? 'cardio' : area === 'corpo_todo' ? 'corpo' : area === 'abdomen' ? 'core' : 'foco';
    const usados = new Set();
    const aq = minutos >= 10 ? aquecimento(p, minutos, rnd, usados) : [];
    const vc = minutos >= 10 ? voltaACalma(p, minutos, rnd, usados) : [];
    const k = minutos <= 10 ? 4 : minutos <= 20 ? 5 : 6;
    const lista = escolherCircuito(tema, p, 2, k, rnd, usados);
    const disponivel = minutos * 60 - duracao(aq) - duracao(vc);
    passos = [...aq, ...montarCircuito(lista, p, 2, disponivel), ...vc];
    titulo = area === 'corpo_todo' ? 'Corpo todo' : AREAS[area];
  }
  return { id: `livre-${semente}`, dia: null, tipo: 'livre', tema: area, semana: 2, titulo, passos, segundos: duracao(passos) };
}

// Troca um exercício por uma variação (mais fácil ou mais difícil) em todo o treino.
export function trocarVariacao(treino, exId, sentido) {
  const ex = POR_ID[exId];
  const novo = sentido === 'facil' ? ex?.facil : ex?.dificil;
  if (!novo || !POR_ID[novo]) return treino;
  return { ...treino, passos: treino.passos.map((p) => (p.exId === exId ? { ...p, exId: novo } : p)) };
}

export function exerciciosDoTreino(treino) {
  const vistos = [];
  for (const p of treino.passos) if (p.tipo === 'exercicio' && !vistos.includes(p.exId)) vistos.push(p.exId);
  return vistos;
}
