// Treino concluído (S13): Parabéns, recordes e conquistas.
import * as store from '../store.js';
import { estado } from '../estado.js';
import { rachaAtual, diasDoPlanoFeitos } from '../stats.js';
import { TOTAL_DIAS } from '../plano.js';
import { esc, minutosNumero, primeiroNome } from '../util.js';
import { icone, confete, ir } from './comum.js';
import { kitDoTreino } from '../kits.js';

const ICONE_CONQ = { estrela: 'estrela', raio: 'raio', medalha: 'medalha', trofeu: 'trofeu', fogo: 'fogo', relogio: 'relogio', sol: 'sol', lua: 'lua' };

export function textoRecorde(r) {
  if (r.chave === 'maiorSessao') return { titulo: 'Novo recorde: treino mais longo', valor: `${minutosNumero(r.valor)} min`, antes: `antes: ${minutosNumero(r.anterior)} min` };
  if (r.chave === 'maiorDia') return { titulo: 'Novo recorde: dia com mais minutos', valor: `${minutosNumero(r.valor)} min`, antes: `antes: ${minutosNumero(r.anterior)} min` };
  return { titulo: 'Novo recorde: maior racha', valor: `${r.valor} dias seguidos`, antes: `antes: ${r.anterior} ${r.anterior === 1 ? 'dia' : 'dias'}` };
}

export function concluido(raiz) {
  const res = estado.resultado;
  const p = store.perfilAtivo();
  if (!res || !p || res.perfilId !== p.id) return ir('#/hoje');
  const { sessao, novidades: n } = res;
  const sessoes = store.sessoesDe(p.id);
  const racha = rachaAtual(sessoes, sessao.data);
  const feitos = diasDoPlanoFeitos(sessoes, p.plano?.ciclo || 1).size;
  const nome = esc(primeiroNome(p.nome));
  const min = minutosNumero(sessao.segundos);

  let titulo;
  let texto;
  if (n.metaSuperada) {
    titulo = `Parabéns, ${nome}!`;
    texto = `Você passou da sua meta: <b>${minutosNumero(n.hojeSeg)} min</b> hoje, ${minutosNumero(n.excedenteSeg)} a mais que os ${p.minutos} min combinados.`;
  } else if (n.metaAtingida) {
    titulo = `Parabéns, ${nome}!`;
    texto = `Meta de hoje cumprida: <b>${p.minutos} min</b>.`;
  } else if (sessao.completo) {
    titulo = 'Treino concluído!';
    texto = sessao.dia ? `Dia ${sessao.dia} feito. Mais um passo no seu desafio.` : 'Treino livre feito. Cada minuto conta!';
  } else {
    titulo = 'Bom trabalho!';
    texto = `Você treinou ${min} min. Cada minuto conta para a sua racha.`;
  }
  const comemorar = n.metaSuperada || n.metaAtingida || n.novosRecordes.length || n.novasConquistas.length || sessao.completo;

  const recordes = n.novosRecordes.map((r) => {
    const t = textoRecorde(r);
    return `<div class="novidade recorde"><div class="disco">${icone('raio')}</div><div class="cresce"><b>${esc(t.titulo)}</b><br><span>${esc(t.valor)}</span> <span class="muted pequeno">(${esc(t.antes)})</span></div></div>`;
  }).join('');
  const conquistas = n.novasConquistas.map((c, k) => `<div class="novidade" style="animation-delay:${(k + 1) * 120}ms"><div class="disco">${icone(ICONE_CONQ[c.icone] || 'medalha')}</div><div class="cresce"><b>${esc(c.nome)}</b><br><span class="muted pequeno">${esc(c.desc)}</span></div></div>`).join('');

  const kit = res.treino ? kitDoTreino(res.treino, p) : 'corpo_todo';
  raiz.innerHTML = `<main class="tela sem-abas concluido">
    <section class="fim" data-kit="${kit}">
      <div class="heroi-ico">${icone(n.metaSuperada || n.novosRecordes.length ? 'trofeu' : 'check')}</div>
      <h1 id="titulo-fim" tabindex="-1">${titulo}</h1>
      <p>${texto}</p>
    </section>
    <div class="linha-num">
      <div><b>${min}</b><span>min agora</span></div>
      <div><b>${racha}</b><span>${racha === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
      <div><b>${feitos}/${TOTAL_DIAS}</b><span>dias do plano</span></div>
    </div>
    ${recordes || conquistas ? `<div class="pilha-p" style="margin-top:24px">${recordes}${conquistas}</div>` : ''}
    <div class="pilha-p" style="margin-top:32px">
      <a class="btn btn-primario btn-grande" href="#/hoje">Voltar ao início</a>
      <a class="btn btn-fantasma btn-largo" href="#/progresso">Ver meu progresso</a>
    </div>
  </main>`;
  raiz.querySelector('#titulo-fim').focus({ preventScroll: true });
  if (comemorar) setTimeout(() => confete(), 150);
}
