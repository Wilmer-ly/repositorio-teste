// Utilidades pequenas.
export function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function relogio(seg) {
  const s = Math.max(0, Math.ceil(seg));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function minutosTexto(seg) {
  const min = Math.round(seg / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} h ${String(r).padStart(2, '0')} min` : `${h} h`;
}

export function minutosNumero(seg) {
  return Math.round(seg / 60);
}

export function plural(n, um, varios) {
  return `${n} ${n === 1 ? um : varios}`;
}

export function saudacao(agora = new Date()) {
  const h = agora.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

export function inicial(nome) {
  const t = String(nome || '').trim();
  return t ? Array.from(t)[0].toUpperCase() : '?';
}

export const CORES_PERFIL = ['#6a3bdb', '#e02d4b', '#1d6fe0', '#0a7d3c', '#cc2a86', '#c2410c'];

export function novoId(prefixo = 'id') {
  const r = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefixo}-${r}`;
}

export function limitar(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
