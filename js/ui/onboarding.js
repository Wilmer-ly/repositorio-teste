// Boas-vindas e perguntas iniciais (S01–S08).
import { estado, salvarRascunho, limparRascunho } from '../estado.js';
import * as store from '../store.js';
import { OBJETIVOS, AREAS_FOCO, MINUTOS_OPCOES, NIVEIS, gerarPlano, faixaIdade } from '../plano.js';
import { AREAS } from '../exercicios.js';
import { esc, primeiroNome } from '../util.js';
import { icone, figHtml, montarFiguras, ir, aviso } from './comum.js';

const TOTAL = 6;
const ICONES_OBJ = { perder_peso: 'balanca', definir: 'alvo', forca: 'musculo', disposicao: 'coracao', mobilidade: 'alongar' };
const AJUDA_OBJ = {
  perder_peso: 'Mais cardio para gastar energia',
  definir: 'Mais exercícios na área que você escolher',
  forca: 'Mais exercícios de força',
  disposicao: 'Fôlego e energia para o dia a dia',
  mobilidade: 'Corpo solto e menos tensão',
};
const FIG_AREA = { corpo_todo: 'burpee', abdomen: 'prancha', pernas: 'agachamento', bracos: 'flexao', costas: 'superman' };
const AJUDA_NIVEL = { 1: 'Estou começando ou voltando agora', 2: 'Treino de vez em quando', 3: 'Treino com frequência' };

export function boasVindas(raiz) {
  const nova = estado.novaPessoa;
  raiz.innerHTML = `<main class="tela sem-abas boas-vindas">
    <div class="heroi" aria-hidden="true">
      <div class="figurinha f1" data-kit="pernas">${figHtml('agachamento', { anim: true })}</div>
      <div class="figurinha f2" data-kit="cardio">${figHtml('polichinelo', { anim: true })}</div>
      <div class="figurinha f3" data-kit="bracos">${figHtml('flexao', { anim: true })}</div>
    </div>
    <div class="texto pilha">
      <p class="logo">Bora!</p>
      <h1>${nova ? 'Vamos montar o plano de mais uma pessoa' : 'Treino em casa, no seu ritmo'}</h1>
      <p class="muted">Um desafio de 30 dias feito para você, com treinos guiados por animação e voz. Sem academia, sem cadastro e sem pagar nada.</p>
    </div>
    <div class="pilha-p">
      <a class="btn btn-primario btn-grande" href="#/perguntas/1">Começar</a>
      ${nova ? '<a class="btn btn-fantasma btn-largo" href="#/pessoas">Cancelar</a>' : `<label class="btn btn-fantasma btn-largo" for="restaurar">${icone('subir')}Já usava o Bora? Restaurar cópia</label>
      <input type="file" id="restaurar" accept="application/json,.json" class="sr-only">`}
    </div>
  </main>`;
  montarFiguras(raiz);
  raiz.querySelector('#restaurar')?.addEventListener('change', async (e) => {
    const arq = e.target.files?.[0];
    e.target.value = '';
    if (!arq) return;
    let dados;
    try {
      dados = JSON.parse(await arq.text());
    } catch {
      return aviso('Esse arquivo não é uma cópia do Bora.');
    }
    const r = await store.importarBackup(dados);
    if (!r.ok) return aviso(r.erro);
    aviso(`Bem-vindo de volta! ${r.treinos} treinos restaurados.`);
    ir('#/hoje');
  });
}

function cabecalho(passo, titulo, ajuda = '') {
  const barras = Array.from({ length: TOTAL }, (_, i) => `<i class="${i < passo ? 'on' : ''}"></i>`).join('');
  const voltar = passo === 1 ? (estado.novaPessoa ? '#/nova-pessoa' : '#/inicio') : `#/perguntas/${passo - 1}`;
  return `<header class="topo"><a class="btn-icone" href="${voltar}" aria-label="Voltar">${icone('voltar')}</a>
      <h1 class="muted">Pergunta ${passo} de ${TOTAL}</h1></header>
    <div class="progresso-passos" aria-hidden="true">${barras}</div>
    <h1 id="pergunta" tabindex="-1">${titulo}</h1>${ajuda ? `<p class="muted" style="margin-top:8px">${ajuda}</p>` : ''}`;
}

function opcoes(lista, atual, campo, { grade = false } = {}) {
  const itens = lista.map(([valor, rotulo, ajuda, extra]) => `
    <button type="button" class="opcao" role="radio" aria-checked="${String(atual) === String(valor)}" data-campo="${campo}" data-valor="${esc(valor)}">
      ${extra || ''}<span class="cresce"><b>${rotulo}</b>${ajuda ? `<small>${ajuda}</small>` : ''}</span>
      ${grade ? '' : `<span class="marca">${icone('check')}</span>`}
    </button>`).join('');
  return `<div class="${grade ? 'grade-opcoes' : 'opcoes'}" role="radiogroup" aria-labelledby="pergunta" style="margin-top:24px">${itens}</div>`;
}

export function pergunta(raiz, passo) {
  const r = estado.rascunho;
  // Não deixa pular perguntas.
  const faltando = [!r.nome, !r.objetivo, !r.area, !r.idade, !r.minutos].findIndex(Boolean);
  if (faltando >= 0 && passo > faltando + 1) return ir(`#/perguntas/${faltando + 1}`);
  let corpo = '';
  let rodape = '';
  if (passo === 1) {
    corpo = `${cabecalho(1, 'Como você se chama?', 'É assim que o app vai falar com você.')}
      <form class="campo" id="form-nome" style="margin-top:24px" novalidate>
        <label class="sr-only" for="nome">Seu nome</label>
        <input class="entrada" id="nome" name="nome" autocomplete="given-name" maxlength="40" placeholder="Seu nome" value="${esc(r.nome)}" enterkeyhint="next">
        <p class="erro-campo" id="erro-nome" hidden>Escreva seu nome para continuar.</p>
      </form>`;
    rodape = '<button class="btn btn-primario btn-grande" type="submit" form="form-nome">Continuar</button>';
  } else if (passo === 2) {
    corpo = cabecalho(2, 'O que você quer?') + opcoes(Object.entries(OBJETIVOS).map(([k, v]) => [k, v, AJUDA_OBJ[k], icone(ICONES_OBJ[k])]), r.objetivo, 'objetivo');
  } else if (passo === 3) {
    corpo = cabecalho(3, 'Qual parte do corpo você quer trabalhar mais?', 'Os outros grupos também entram no plano.') +
      opcoes(AREAS_FOCO.map((a) => [a, AREAS[a], '', `<span class="fig-op" data-kit="${a}">${figHtml(FIG_AREA[a])}</span>`]), r.area, 'area');
  } else if (passo === 4) {
    corpo = `${cabecalho(4, 'Quantos anos você tem?', 'Usamos a idade para escolher exercícios seguros para você.')}
      <form id="form-idade" style="margin-top:24px" novalidate>
        <div class="contador-idade">
          <button type="button" class="btn-icone" data-idade="-1" aria-label="Diminuir idade">${icone('voltar')}</button>
          <input class="entrada" id="idade" type="number" inputmode="numeric" min="16" max="99" value="${esc(r.idade)}" aria-label="Idade em anos">
          <button type="button" class="btn-icone" data-idade="1" aria-label="Aumentar idade">${icone('seta')}</button>
        </div>
        <p class="erro-campo centro" id="erro-idade" hidden style="margin-top:12px"></p>
      </form>`;
    rodape = '<button class="btn btn-primario btn-grande" type="submit" form="form-idade">Continuar</button>';
  } else if (passo === 5) {
    corpo = cabecalho(5, 'Quanto tempo por dia você tem para treinar?', 'Dá para mudar depois.') +
      opcoes(MINUTOS_OPCOES.map((m) => [m, `${m}`, 'minutos']), r.minutos, 'minutos', { grade: true });
  } else if (passo === 6) {
    const sugere = faixaIdade(r.idade) === 'senior' ? 1 : null;
    corpo = cabecalho(6, 'Como está seu preparo hoje?', 'Seja sincero: o plano sobe de nível com você.') +
      opcoes([1, 2, 3].map((n) => [n, `${NIVEIS[n]}${sugere === n ? ' (recomendado)' : ''}`, AJUDA_NIVEL[n], `<span class="nivel" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`]), r.nivel, 'nivel');
  }
  raiz.innerHTML = `<main class="tela sem-abas perguntas${rodape ? ' com-rodape' : ''}">${corpo}</main>${rodape ? `<div class="rodape-fixo"><div>${rodape}</div></div>` : ''}`;
  montarFiguras(raiz);
  raiz.querySelector('#pergunta')?.focus({ preventScroll: true });

  raiz.querySelectorAll('.opcao').forEach((b) => b.addEventListener('click', () => {
    const campo = b.dataset.campo;
    const valor = ['minutos', 'nivel'].includes(campo) ? Number(b.dataset.valor) : b.dataset.valor;
    r[campo] = valor;
    salvarRascunho();
    raiz.querySelectorAll('.opcao').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
    setTimeout(() => ir(passo < TOTAL ? `#/perguntas/${passo + 1}` : '#/plano-pronto'), 220);
  }));
  raiz.querySelector('[role="radiogroup"]')?.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const lista = [...raiz.querySelectorAll('.opcao')];
    const i = lista.indexOf(document.activeElement);
    const prox = lista[(i + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1) + lista.length) % lista.length];
    prox.focus();
    e.preventDefault();
  });

  const formNome = raiz.querySelector('#form-nome');
  if (formNome) {
    const input = raiz.querySelector('#nome');
    if (!r.nome) setTimeout(() => input.focus(), 50);
    formNome.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = input.value.trim().replace(/\s+/g, ' ');
      if (!nome) {
        raiz.querySelector('#erro-nome').hidden = false;
        input.focus();
        return;
      }
      r.nome = nome;
      salvarRascunho();
      ir('#/perguntas/2');
    });
  }
  const formIdade = raiz.querySelector('#form-idade');
  if (formIdade) {
    const input = raiz.querySelector('#idade');
    const erro = raiz.querySelector('#erro-idade');
    raiz.querySelectorAll('[data-idade]').forEach((b) => b.addEventListener('click', () => {
      const v = (Number(input.value) || 35) + Number(b.dataset.idade);
      input.value = Math.min(99, Math.max(16, v));
    }));
    formIdade.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = Math.round(Number(input.value));
      if (!v || v < 16 || v > 99) {
        erro.textContent = v && v < 16 ? 'O Bora é para quem tem 16 anos ou mais.' : 'Digite uma idade entre 16 e 99 anos.';
        erro.hidden = false;
        input.focus();
        return;
      }
      r.idade = v;
      salvarRascunho();
      ir('#/perguntas/5');
    });
  }
}

export function planoPronto(raiz) {
  const r = estado.rascunho;
  if (!r.nome || !r.objetivo || !r.area || !r.idade || !r.minutos || !r.nivel) return ir('#/perguntas/1');
  const faixa = faixaIdade(r.idade);
  const dias = gerarPlano({ ...r, plano: { ciclo: 1, semente: 'previa' } });
  const mini = dias.map((d) => `<i class="${d.tipo === 'recuperacao' ? 'r' : d.tipo === 'desafio' ? 'd' : ''}" title="Dia ${d.dia}"></i>`).join('');
  const nota = faixa === 'senior'
    ? 'Plano sem saltos, com descansos maiores e exercícios com apoio de cadeira ou parede.'
    : faixa === 'maduro' ? 'Plano sem saltos e com descansos um pouco maiores.' : '';
  raiz.innerHTML = `<main class="tela sem-abas com-rodape pilha" style="padding-top:24px">
    <p class="logo">Bora<span>!</span></p>
    <h1 id="titulo-pronto" tabindex="-1">Seu plano está pronto, ${esc(primeiroNome(r.nome))}!</h1>
    <div class="selos">
      <span class="selo">${icone(ICONES_OBJ[r.objetivo])}${esc(OBJETIVOS[r.objetivo])}</span>
      <span class="selo">${esc(AREAS[r.area])}</span>
      <span class="selo">${icone('relogio')}${r.minutos} min por dia</span>
      <span class="selo">${esc(NIVEIS[r.nivel])}</span>
    </div>
    <section class="cartao pilha-p">
      <h2>30 dias</h2>
      <p class="muted pequeno">${dias.filter((d) => d.tipo === 'treino').length} dias de treino, ${dias.filter((d) => d.tipo === 'recuperacao').length} de recuperação ativa e o desafio final no dia 30. Cada semana fica um pouco mais forte.</p>
      <div class="mini-plano" aria-hidden="true">${mini}</div>
      ${nota ? `<p class="pequeno"><b>${esc(nota)}</b></p>` : ''}
    </section>
    <section class="cartao liso aviso">${icone('alerta')}<p class="pequeno">Se você tem alguma condição de saúde, dor, está grávida ou se recuperando de lesão, converse com um profissional de saúde antes de começar. Pare se sentir dor, tontura ou falta de ar.</p></section>
  </main>
  <div class="rodape-fixo"><div><button class="btn btn-primario btn-grande" id="criar">Bora começar!</button></div></div>`;
  raiz.querySelector('#titulo-pronto').focus({ preventScroll: true });
  raiz.querySelector('#criar').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      await store.criarPerfil(r);
      estado.novaPessoa = false;
      limparRascunho();
      ir('#/hoje');
    } catch (err) {
      e.currentTarget.disabled = false;
      aviso('Não foi possível salvar. Tente de novo.');
      console.error(err);
    }
  });
}
