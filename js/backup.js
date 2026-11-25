// Cópia de segurança: montar, validar e mesclar (lógica pura).
export const APP = 'bora';
export const VERSAO_BACKUP = 1;

export function montarBackup({ perfis, sessoes, conquistas }, agora = new Date()) {
  return {
    app: APP,
    versao: VERSAO_BACKUP,
    criadoEm: agora.toISOString(),
    perfis,
    sessoes,
    conquistas,
  };
}

function ehTexto(x, max = 200) {
  return typeof x === 'string' && x.length > 0 && x.length <= max;
}

export function validarBackup(dados) {
  if (!dados || typeof dados !== 'object') return { ok: false, erro: 'O arquivo não é uma cópia do Bora.' };
  if (dados.app !== APP) return { ok: false, erro: 'Este arquivo não é uma cópia de segurança do Bora.' };
  if (typeof dados.versao !== 'number' || dados.versao > VERSAO_BACKUP) return { ok: false, erro: 'Esta cópia foi feita por uma versão mais nova do app.' };
  for (const campo of ['perfis', 'sessoes', 'conquistas']) {
    if (!Array.isArray(dados[campo])) return { ok: false, erro: 'A cópia está incompleta ou danificada.' };
  }
  if (!dados.perfis.length) return { ok: false, erro: 'A cópia não tem nenhuma pessoa.' };
  for (const p of dados.perfis) {
    if (!ehTexto(p.id, 80) || !ehTexto(p.nome, 120)) return { ok: false, erro: 'A cópia está danificada (pessoa sem nome).' };
  }
  const ids = new Set(dados.perfis.map((p) => p.id));
  for (const s of dados.sessoes) {
    if (!ehTexto(s.id, 120) || !ids.has(s.perfilId) || typeof s.segundos !== 'number' || !/^\d{4}-\d{2}-\d{2}$/.test(s.data || '')) {
      return { ok: false, erro: 'A cópia está danificada (treino inválido).' };
    }
  }
  return { ok: true, dados };
}

// Restaurar: as pessoas da cópia substituem as do celular com o mesmo id; as outras continuam.
export function mesclar(atual, copia) {
  const ids = new Set(copia.perfis.map((p) => p.id));
  return {
    perfis: [...atual.perfis.filter((p) => !ids.has(p.id)), ...copia.perfis],
    sessoes: [...atual.sessoes.filter((s) => !ids.has(s.perfilId)), ...copia.sessoes],
    conquistas: [...atual.conquistas.filter((c) => !ids.has(c.perfilId)), ...copia.conquistas],
  };
}
