// Dicas (S20, S21).
import { DICAS, CATEGORIAS } from '../dicas.js';
import { estado } from '../estado.js';
import { esc } from '../util.js';
import { topo, abas, icone, ir } from './comum.js';

export function dicas(raiz) {
  const cats = [['todas', 'Todas'], ...Object.entries(CATEGORIAS)];
  const chips = cats.map(([id, nome]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="${estado.catDica === id}">${esc(nome)}</button>`).join('');
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Dicas' })}
    <p class="muted">Conselhos curtos para treinar melhor, com segurança. Não substituem orientação de um profissional.</p>
    <div class="chips" role="group" aria-label="Filtrar dicas" style="margin-top:12px">${chips}</div>
    <div class="lista-dicas" id="lista" style="margin-top:8px"></div>
  </main>${abas('dicas')}`;
  const lista = raiz.querySelector('#lista');
  function desenhar() {
    const itens = DICAS.filter((d) => estado.catDica === 'todas' || d.cat === estado.catDica);
    lista.innerHTML = itens.map((d) => `<a class="cartao dica-card pilha-p" href="#/dica/${d.id}">
      <span class="mini cat">${esc(CATEGORIAS[d.cat])}</span><h3>${esc(d.titulo)}</h3><p class="muted pequeno">${esc(d.texto.length > 110 ? `${d.texto.slice(0, 108).trim()}…` : d.texto)}</p></a>`).join('');
  }
  desenhar();
  raiz.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
    estado.catDica = b.dataset.cat;
    raiz.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    desenhar();
  }));
}

export function dica(raiz, id) {
  const i = DICAS.findIndex((d) => d.id === id);
  if (i < 0) return ir('#/dicas');
  const d = DICAS[i];
  const prox = DICAS[(i + 1) % DICAS.length];
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Dica', voltar: '#/dicas' })}
    <article class="cartao pilha" style="margin-top:8px">
      <span class="selo">${icone('lampada')}${esc(CATEGORIAS[d.cat])}</span>
      <h1>${esc(d.titulo)}</h1>
      <p class="dica-texto">${esc(d.texto)}</p>
    </article>
    <a class="cartao liso linha" href="#/dica/${prox.id}" style="margin-top:16px"><span class="cresce"><span class="mini muted">Próxima dica</span><br><b>${esc(prox.titulo)}</b></span>${icone('seta')}</a>
  </main>${abas('dicas')}`;
}
