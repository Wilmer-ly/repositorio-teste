// Camada de dados do Bora: perfis, sessões, conquistas, vídeos e cópia de segurança.
import * as db from './db.js';
import { novoId, CORES_PERFIL } from './util.js';
import { chaveDia } from './datas.js';
import { novidades } from './stats.js';
import { montarBackup, validarBackup, mesclar } from './backup.js';

const estado = {
  perfis: [],
  ativoId: null,
  sessoes: new Map(),
  conquistas: new Map(),
  videos: new Set(),
};

export const AJUSTES_PADRAO = { voz: true, sons: true, vibrar: true, aquecimento: true, descanso: 'auto', lembrete: '07:00' };

function ordenar(lista) {
  return lista.sort((a, b) => String(a.inicio || a.data).localeCompare(String(b.inicio || b.data)));
}

export async function iniciar() {
  estado.perfis = (await db.todos('perfis')).sort((a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm)));
  const meta = await db.pegar('meta', 'perfilAtivo');
  estado.ativoId = estado.perfis.some((p) => p.id === meta?.v) ? meta.v : estado.perfis[0]?.id ?? null;
  estado.sessoes.clear();
  estado.conquistas.clear();
  estado.videos = new Set(await db.chaves('videos'));
  for (const p of estado.perfis) await carregarDoPerfil(p.id);
}

async function carregarDoPerfil(id) {
  estado.sessoes.set(id, ordenar(await db.todos('sessoes', 'perfilId', id)));
  const cs = await db.todos('conquistas', 'perfilId', id);
  estado.conquistas.set(id, new Map(cs.map((c) => [c.chave, c.data])));
}

export function perfis() {
  return estado.perfis;
}

export function perfilAtivo() {
  return estado.perfis.find((p) => p.id === estado.ativoId) || null;
}

export async function definirPerfilAtivo(id) {
  estado.ativoId = id;
  await db.salvar('meta', { k: 'perfilAtivo', v: id });
}

export async function criarPerfil(dados) {
  const usadas = new Set(estado.perfis.map((p) => p.cor));
  const cor = CORES_PERFIL.find((c) => !usadas.has(c)) || CORES_PERFIL[estado.perfis.length % CORES_PERFIL.length];
  const perfil = {
    id: novoId('p'),
    nome: dados.nome.trim(),
    idade: dados.idade,
    objetivo: dados.objetivo,
    area: dados.area,
    minutos: dados.minutos,
    nivel: dados.nivel,
    cor,
    criadoEm: new Date().toISOString(),
    plano: { inicio: chaveDia(), ciclo: 1, semente: novoId('s') },
    ajustes: { ...AJUSTES_PADRAO },
  };
  estado.perfis.push(perfil);
  estado.sessoes.set(perfil.id, []);
  estado.conquistas.set(perfil.id, new Map());
  await db.salvar('perfis', perfil);
  await definirPerfilAtivo(perfil.id);
  return perfil;
}

export async function salvarPerfil(perfil) {
  const i = estado.perfis.findIndex((p) => p.id === perfil.id);
  if (i >= 0) estado.perfis[i] = perfil;
  else estado.perfis.push(perfil);
  await db.salvar('perfis', perfil);
  return perfil;
}

export async function atualizarAjustes(perfilId, mudancas) {
  const p = estado.perfis.find((x) => x.id === perfilId);
  if (!p) return null;
  p.ajustes = { ...AJUSTES_PADRAO, ...p.ajustes, ...mudancas };
  return salvarPerfil(p);
}

export async function reiniciarDesafio(perfilId) {
  const p = estado.perfis.find((x) => x.id === perfilId);
  if (!p) return null;
  p.plano = { ...p.plano, ciclo: (p.plano?.ciclo || 1) + 1, inicio: chaveDia() };
  return salvarPerfil(p);
}

export async function excluirPerfil(id) {
  for (const s of estado.sessoes.get(id) || []) await db.apagar('sessoes', s.id);
  for (const chave of (estado.conquistas.get(id) || new Map()).keys()) await db.apagar('conquistas', `${id}:${chave}`);
  await db.apagar('perfis', id);
  estado.perfis = estado.perfis.filter((p) => p.id !== id);
  estado.sessoes.delete(id);
  estado.conquistas.delete(id);
  if (estado.ativoId === id) await definirPerfilAtivo(estado.perfis[0]?.id ?? null);
}

export function sessoesDe(perfilId) {
  return estado.sessoes.get(perfilId) || [];
}

export function conquistasDe(perfilId) {
  return estado.conquistas.get(perfilId) || new Map();
}

// Guarda a sessão e devolve o que há de novo (meta, recordes, conquistas).
export async function registrarSessao(perfil, dados) {
  const antes = [...sessoesDe(perfil.id)];
  const sessao = {
    id: novoId('s'),
    perfilId: perfil.id,
    data: dados.data || chaveDia(dados.inicio ? new Date(dados.inicio) : new Date()),
    inicio: dados.inicio || new Date().toISOString(),
    fim: dados.fim || new Date().toISOString(),
    segundos: Math.max(0, Math.round(dados.segundos)),
    planejado: dados.planejado || 0,
    tipo: dados.tipo,
    dia: dados.dia ?? null,
    ciclo: perfil.plano?.ciclo || 1,
    titulo: dados.titulo || '',
    kit: dados.kit || null,
    completo: !!dados.completo,
    exercicios: dados.exercicios || 0,
  };
  await db.salvar('sessoes', sessao);
  const depois = ordenar([...antes, sessao]);
  estado.sessoes.set(perfil.id, depois);
  const jaTem = new Set(conquistasDe(perfil.id).keys());
  const nov = novidades(antes, depois, { metaSeg: (perfil.minutos || 15) * 60, ciclo: perfil.plano?.ciclo || 1, jaTem, sessao });
  const mapa = conquistasDe(perfil.id);
  for (const c of nov.novasConquistas) {
    mapa.set(c.chave, sessao.data);
    await db.salvar('conquistas', { id: `${perfil.id}:${c.chave}`, perfilId: perfil.id, chave: c.chave, data: sessao.data });
  }
  estado.conquistas.set(perfil.id, mapa);
  return { sessao, novidades: nov };
}

export async function apagarSessao(perfilId, sessaoId) {
  await db.apagar('sessoes', sessaoId);
  estado.sessoes.set(perfilId, sessoesDe(perfilId).filter((s) => s.id !== sessaoId));
}

// ---------- vídeos próprios ----------
export function temVideo(exId) {
  return estado.videos.has(exId);
}

export async function salvarVideo(exId, arquivo) {
  await db.salvar('videos', { exId, blob: arquivo, tipo: arquivo.type || 'video/mp4', tamanho: arquivo.size || 0, criadoEm: new Date().toISOString() });
  estado.videos.add(exId);
}

export async function videoDe(exId) {
  if (!estado.videos.has(exId)) return null;
  const v = await db.pegar('videos', exId);
  return v?.blob || null;
}

export async function removerVideo(exId) {
  await db.apagar('videos', exId);
  estado.videos.delete(exId);
}

// ---------- cópia de segurança ----------
export async function exportarBackup() {
  const sessoes = [];
  const conquistas = [];
  for (const p of estado.perfis) {
    sessoes.push(...sessoesDe(p.id));
    for (const [chave, data] of conquistasDe(p.id)) conquistas.push({ id: `${p.id}:${chave}`, perfilId: p.id, chave, data });
  }
  return montarBackup({ perfis: estado.perfis, sessoes, conquistas });
}

export async function importarBackup(dados) {
  const v = validarBackup(dados);
  if (!v.ok) return v;
  const atual = await exportarBackup();
  const novo = mesclar(atual, dados);
  const idsCopia = new Set(dados.perfis.map((p) => p.id));
  // Remove do celular o que será substituído, depois grava a cópia.
  for (const s of atual.sessoes) if (idsCopia.has(s.perfilId)) await db.apagar('sessoes', s.id);
  for (const c of atual.conquistas) if (idsCopia.has(c.perfilId)) await db.apagar('conquistas', c.id);
  for (const p of dados.perfis) await db.salvar('perfis', p);
  for (const s of dados.sessoes) await db.salvar('sessoes', s);
  for (const c of dados.conquistas) await db.salvar('conquistas', c);
  await iniciar();
  if (!estado.ativoId || !novo.perfis.some((p) => p.id === estado.ativoId)) await definirPerfilAtivo(dados.perfis[0].id);
  return { ok: true, pessoas: dados.perfis.length, treinos: dados.sessoes.length };
}
