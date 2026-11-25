// Estado temporário da interface (não é salvo).
function lerRascunho() {
  try {
    return JSON.parse(sessionStorage.getItem('bora-rascunho')) || null;
  } catch {
    return null;
  }
}

export const estado = {
  rascunho: lerRascunho() || { nome: '', objetivo: null, area: null, idade: 35, minutos: null, nivel: null },
  novaPessoa: false,
  treino: null, // treino que vai para o player
  treinoLivre: null,
  trocas: {}, // dia -> { exId: novoId }
  resultado: null, // última sessão concluída
  filtroArea: 'todos',
  busca: '',
  livre: { area: 'corpo_todo', minutos: 10 },
  mesCal: null, // { ano, mes }
  catDica: 'todas',
};

export function salvarRascunho() {
  try {
    sessionStorage.setItem('bora-rascunho', JSON.stringify(estado.rascunho));
  } catch {
    /* sem armazenamento de sessão */
  }
}

export function limparRascunho() {
  estado.rascunho = { nome: '', objetivo: null, area: null, idade: 35, minutos: null, nivel: null };
  try {
    sessionStorage.removeItem('bora-rascunho');
  } catch {
    /* nada */
  }
}

// Velocidade do relógio (só para testes automáticos: ?velocidade=20).
export const VELOCIDADE = (() => {
  try {
    const v = Number(new URLSearchParams(location.search).get('velocidade'));
    return v > 0 && v <= 100 ? v : 1;
  } catch {
    return 1;
  }
})();
