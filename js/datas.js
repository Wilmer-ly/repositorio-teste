// Datas locais (o "dia" é o do celular da pessoa).

export function chaveDia(d = new Date()) {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${a}-${m}-${dd}`;
}

export function dataDaChave(chave) {
  const [a, m, d] = chave.split('-').map(Number);
  return new Date(a, m - 1, d, 12, 0, 0); // meio-dia evita problemas com horário de verão
}

export function somarDias(chave, n) {
  const d = dataDaChave(chave);
  d.setDate(d.getDate() + n);
  return chaveDia(d);
}

export function diasEntre(a, b) {
  return Math.round((dataDaChave(b) - dataDaChave(a)) / 86400000);
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function nomeMes(m) {
  return MESES[m];
}

export function dataPorExtenso(chave) {
  const d = dataDaChave(chave);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function dataCurta(chave) {
  const d = dataDaChave(chave);
  return `${d.getDate()} de ${MESES[d.getMonth()].slice(0, 3)}`;
}
