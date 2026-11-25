// Perfil e ajustes (S22), pessoas (S23), cópia de segurança (S24) e lembrete (S25).
import * as store from '../store.js';
import { estado } from '../estado.js';
import { OBJETIVOS, AREAS_FOCO, MINUTOS_OPCOES, NIVEIS } from '../plano.js';
import { AREAS } from '../exercicios.js';
import { diasDoPlanoFeitos, totalSegundos } from '../stats.js';
import { linkGoogleAgenda, arquivoIcs } from '../lembrete.js';
import { chaveDia } from '../datas.js';
import { esc, inicial, minutosNumero } from '../util.js';
import { topo, abas, icone, aviso, confirmar, ir } from './comum.js';

function opcoesSelect(pares, atual) {
  return pares.map(([v, r]) => `<option value="${esc(v)}"${String(v) === String(atual) ? ' selected' : ''}>${esc(r)}</option>`).join('');
}

function interruptor(id, rotulo, ligado, ic) {
  return `<label class="ajuste" for="${id}">${icone(ic)}<span class="cresce">${rotulo}</span><span class="interruptor"><input type="checkbox" id="${id}" ${ligado ? 'checked' : ''}><span></span></span></label>`;
}

export function perfil(raiz) {
  const p = store.perfilAtivo();
  const aj = { ...store.AJUSTES_PADRAO, ...p.ajustes };
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Perfil e ajustes', voltar: '#/hoje', avatar: false })}
    <section class="cartao pessoa">
      <span class="avatar grande" style="background:${esc(p.cor)}" aria-hidden="true">${esc(inicial(p.nome))}</span>
      <div class="cresce"><h2 class="nome-perfil">${esc(p.nome)}</h2><p class="muted pequeno">${p.idade} anos</p></div>
      <a class="btn btn-secundario" href="#/pessoas">${icone('pessoas')}Trocar</a>
    </section>

    <div class="secao-titulo"><h2>Você</h2></div>
    <div class="lista-ajustes">
      <label class="ajuste" for="nome">${icone('pessoa')}<span class="cresce">Nome</span><input id="nome" class="entrada" style="min-height:44px;max-width:55%;font-size:16px" maxlength="40" value="${esc(p.nome)}"></label>
      <label class="ajuste" for="idade">${icone('info')}<span class="cresce">Idade</span><input id="idade" class="entrada" type="number" inputmode="numeric" min="16" max="99" style="min-height:44px;max-width:30%;font-size:16px;text-align:center" value="${p.idade}"></label>
    </div>

    <div class="secao-titulo"><h2>Seu plano</h2></div>
    <div class="lista-ajustes">
      <label class="ajuste" for="objetivo">${icone('alvo')}<span class="cresce">Objetivo</span><select id="objetivo">${opcoesSelect(Object.entries(OBJETIVOS), p.objetivo)}</select></label>
      <label class="ajuste" for="area">${icone('musculo')}<span class="cresce">Área do corpo</span><select id="area">${opcoesSelect(AREAS_FOCO.map((a) => [a, AREAS[a]]), p.area)}</select></label>
      <label class="ajuste" for="minutos">${icone('relogio')}<span class="cresce">Tempo por dia</span><select id="minutos">${opcoesSelect(MINUTOS_OPCOES.map((m) => [m, `${m} min`]), p.minutos)}</select></label>
      <label class="ajuste" for="nivel">${icone('grafico')}<span class="cresce">Nível</span><select id="nivel">${opcoesSelect(Object.entries(NIVEIS), p.nivel)}</select></label>
    </div>
    <p class="muted pequeno" style="margin-top:8px">Mudanças valem para os próximos treinos. O que você já fez continua contando.</p>

    <div class="secao-titulo"><h2>Durante o treino</h2></div>
    <div class="lista-ajustes">
      ${interruptor('voz', 'Voz do treinador', aj.voz, 'voz')}
      ${interruptor('sons', 'Bipes de contagem', aj.sons, 'sino')}
      ${interruptor('vibrar', 'Vibrar nas trocas', aj.vibrar, 'raio')}
      ${interruptor('aquecimento', 'Aquecimento antes do circuito', aj.aquecimento, 'fogo')}
      <label class="ajuste" for="descanso">${icone('relogio')}<span class="cresce">Descanso entre exercícios</span><select id="descanso">${opcoesSelect([['auto', 'Automático'], [15, '15 s'], [20, '20 s'], [30, '30 s'], [45, '45 s'], [60, '60 s']], aj.descanso)}</select></label>
    </div>

    <div class="secao-titulo"><h2>Mais</h2></div>
    <div class="lista-ajustes">
      <a class="ajuste" href="#/lembrete">${icone('sino')}<span class="cresce">Lembrete diário</span>${icone('seta')}</a>
      <a class="ajuste" href="#/backup">${icone('baixar')}<span class="cresce">Cópia de segurança</span>${icone('seta')}</a>
      <a class="ajuste" href="#/pessoas">${icone('pessoas')}<span class="cresce">Pessoas da família</span>${icone('seta')}</a>
      <button type="button" class="ajuste" id="reiniciar">${icone('sortear')}<span class="cresce">Reiniciar o desafio de 30 dias</span>${icone('seta')}</button>
    </div>

    <section class="cartao liso pilha-p" style="margin-top:24px">
      <h3>Sobre o Bora</h3>
      <p class="pequeno muted">App de treino em casa para a família. Funciona sem internet e guarda tudo só neste celular.</p>
      <p class="pequeno muted">Os treinos são gerais e não substituem orientação médica ou de um profissional de educação física. Pare se sentir dor, tontura ou falta de ar.</p>
      <details class="creditos">
        <summary>Créditos das ilustrações e letras</summary>
        <p>As ilustrações dos exercícios são do <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener">Workout Guide</a>, de Bryl Lim, baseadas no projeto <a href="https://github.com/everkinetic/data" target="_blank" rel="noopener">Everkinetic</a>. Licença <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br" target="_blank" rel="noopener">CC BY-SA 4.0</a>. O Bora só muda a cor e anima os quadros; as imagens continuam sob a mesma licença.</p>
        <p>Os exercícios sem ilustração usam a figura animada própria do Bora. Textos, ícones e treinos são do Bora.</p>
        <p>Letras Barlow e Barlow Condensed, de Jeremy Tribby, sob a SIL Open Font License.</p>
      </details>
    </section>
  </main>${abas('hoje')}`;

  const salvarCampo = async (mudancas, msg = 'Salvo.') => {
    Object.assign(p, mudancas);
    await store.salvarPerfil(p);
    estado.trocas = {};
    aviso(msg);
  };
  raiz.querySelector('#nome').addEventListener('change', (e) => {
    const nome = e.target.value.trim().replace(/\s+/g, ' ');
    if (!nome) {
      e.target.value = p.nome;
      return aviso('O nome não pode ficar vazio.');
    }
    salvarCampo({ nome }, 'Nome atualizado.');
    raiz.querySelector('.pessoa h2').textContent = nome;
  });
  raiz.querySelector('#idade').addEventListener('change', (e) => {
    const v = Math.round(Number(e.target.value));
    if (!(v >= 16 && v <= 99)) {
      e.target.value = p.idade;
      return aviso('Idade entre 16 e 99 anos.');
    }
    salvarCampo({ idade: v }, 'Idade atualizada. O plano se ajustou.');
  });
  for (const campo of ['objetivo', 'area', 'minutos', 'nivel']) {
    raiz.querySelector(`#${campo}`).addEventListener('change', (e) => {
      const v = ['minutos', 'nivel'].includes(campo) ? Number(e.target.value) : e.target.value;
      salvarCampo({ [campo]: v }, 'Plano atualizado.');
    });
  }
  for (const campo of ['voz', 'sons', 'vibrar', 'aquecimento']) {
    raiz.querySelector(`#${campo}`).addEventListener('change', (e) => {
      store.atualizarAjustes(p.id, { [campo]: e.target.checked });
      estado.trocas = {};
    });
  }
  raiz.querySelector('#descanso').addEventListener('change', (e) => {
    const v = e.target.value === 'auto' ? 'auto' : Number(e.target.value);
    store.atualizarAjustes(p.id, { descanso: v });
    aviso('Descanso atualizado.');
  });
  raiz.querySelector('#reiniciar').addEventListener('click', async () => {
    const ok = await confirmar({ titulo: 'Reiniciar o desafio?', texto: 'O plano volta para o Dia 1. Seu histórico, recordes e conquistas continuam guardados.', botoes: [{ rotulo: 'Reiniciar', valor: true, estilo: 'btn-perigo' }, { rotulo: 'Cancelar', valor: false }] });
    if (!ok) return;
    await store.reiniciarDesafio(p.id);
    estado.trocas = {};
    aviso('Desafio reiniciado. Bora!');
    ir('#/hoje');
  });
}

export function pessoas(raiz) {
  const ativo = store.perfilAtivo();
  const lista = store.perfis().map((p) => {
    const ses = store.sessoesDe(p.id);
    const dias = diasDoPlanoFeitos(ses, p.plano?.ciclo || 1).size;
    return `<li class="cartao pessoa" style="margin-bottom:12px">
      <span class="avatar" style="background:${esc(p.cor)}" aria-hidden="true">${esc(inicial(p.nome))}</span>
      <div class="cresce"><b>${esc(p.nome)}</b>${p.id === ativo?.id ? ' <span class="selo ok">usando agora</span>' : ''}<br><span class="muted pequeno">${dias} de 30 dias, ${minutosNumero(totalSegundos(ses))} min</span></div>
      ${p.id === ativo?.id ? '' : `<button type="button" class="btn btn-primario" data-usar="${p.id}">Usar</button>`}
      <button type="button" class="btn-icone" data-excluir="${p.id}" aria-label="Excluir ${esc(p.nome)}">${icone('lixeira')}</button>
    </li>`;
  }).join('');
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Pessoas da família', voltar: '#/perfil', avatar: false })}
    <p class="muted">Cada pessoa tem o seu plano, progresso e conquistas. Se cada um usa o próprio celular, não precisa adicionar ninguém aqui.</p>
    <ul style="list-style:none;padding:0;margin:16px 0 0">${lista}</ul>
    <a class="btn btn-secundario btn-largo" href="#/nova-pessoa">${icone('mais')}Adicionar pessoa</a>
  </main>${abas('hoje')}`;
  raiz.querySelectorAll('[data-usar]').forEach((b) => b.addEventListener('click', async () => {
    await store.definirPerfilAtivo(b.dataset.usar);
    estado.trocas = {};
    estado.resultado = null;
    aviso(`Olá, ${store.perfilAtivo().nome.split(' ')[0]}!`);
    ir('#/hoje');
  }));
  raiz.querySelectorAll('[data-excluir]').forEach((b) => b.addEventListener('click', async () => {
    const alvo = store.perfis().find((x) => x.id === b.dataset.excluir);
    const ok = await confirmar({ titulo: `Excluir ${alvo.nome}?`, texto: 'O plano, o histórico e as conquistas dessa pessoa serão apagados deste celular. Isso não pode ser desfeito.', botoes: [{ rotulo: 'Excluir', valor: true, estilo: 'btn-perigo' }, { rotulo: 'Cancelar', valor: false }] });
    if (!ok) return;
    await store.excluirPerfil(alvo.id);
    aviso('Pessoa excluída.');
    estado.trocas = {};
    if (!store.perfis().length) return ir('#/inicio');
    pessoas(raiz);
  }));
}

function baixarArquivo(nome, conteudo, tipo) {
  const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function backup(raiz) {
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Cópia de segurança', voltar: '#/perfil', avatar: false })}
    <section class="cartao pilha-p">
      <div class="linha">${icone('baixar')}<h2>Salvar uma cópia</h2></div>
      <p class="muted pequeno">O Bora guarda tudo só neste celular. Salve uma cópia de vez em quando (por exemplo no Google Drive ou mandando para você no WhatsApp). Se trocar de celular, é só restaurar.</p>
      <button type="button" class="btn btn-primario btn-largo" id="salvar">${icone('compartilhar')}Salvar cópia</button>
    </section>
    <section class="cartao pilha-p" style="margin-top:16px">
      <div class="linha">${icone('subir')}<h2>Restaurar uma cópia</h2></div>
      <p class="muted pequeno">Escolha o arquivo <b>bora-copia-….json</b>. As pessoas da cópia substituem as mesmas pessoas deste celular; as outras continuam como estão.</p>
      <label class="btn btn-secundario btn-largo" for="arquivo">${icone('subir')}Escolher arquivo</label>
      <input type="file" id="arquivo" accept="application/json,.json" class="sr-only">
    </section>
    <div class="nota cuidado" style="margin-top:16px">${icone('info')}<p class="pequeno">Os vídeos que você adicionou nos exercícios não entram na cópia, porque são muito grandes. No celular novo, adicione de novo.</p></div>
  </main>${abas('hoje')}`;
  raiz.querySelector('#salvar').addEventListener('click', async () => {
    const dados = await store.exportarBackup();
    const nome = `bora-copia-${chaveDia()}.json`;
    const texto = JSON.stringify(dados);
    const arquivo = new File([texto], nome, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Cópia do Bora', text: 'Cópia de segurança do app Bora' });
        aviso('Cópia pronta.');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    baixarArquivo(nome, arquivo);
    aviso('Cópia salva em Downloads.');
  });
  raiz.querySelector('#arquivo').addEventListener('change', async (e) => {
    const arq = e.target.files?.[0];
    e.target.value = '';
    if (!arq) return;
    let dados;
    try {
      dados = JSON.parse(await arq.text());
    } catch {
      return aviso('Esse arquivo não é uma cópia do Bora.');
    }
    const nomes = Array.isArray(dados?.perfis) ? dados.perfis.map((x) => x?.nome).filter(Boolean).join(', ') : '';
    const ok = await confirmar({ titulo: 'Restaurar esta cópia?', texto: nomes ? `Pessoas na cópia: <b>${esc(nomes)}</b>.` : '', botoes: [{ rotulo: 'Restaurar', valor: true, estilo: 'btn-primario' }, { rotulo: 'Cancelar', valor: false }] });
    if (!ok) return;
    const r = await store.importarBackup(dados);
    if (!r.ok) return aviso(r.erro);
    estado.trocas = {};
    aviso(`Cópia restaurada: ${r.pessoas} ${r.pessoas === 1 ? 'pessoa' : 'pessoas'}, ${r.treinos} treinos.`);
    ir('#/hoje');
  });
}

export function lembrete(raiz) {
  const p = store.perfilAtivo();
  const aj = { ...store.AJUSTES_PADRAO, ...p.ajustes };
  raiz.innerHTML = `<main class="tela">
    ${topo({ titulo: 'Lembrete diário', voltar: '#/perfil', avatar: false })}
    <p class="muted">O Bora funciona sem internet e sem servidor. Por isso o aviso de todo dia fica na agenda do seu celular, que avisa mesmo com o app fechado.</p>
    <div class="campo" style="margin-top:20px"><label for="hora">Que horas você quer treinar?</label><input class="entrada" id="hora" type="time" value="${esc(aj.lembrete)}"></div>
    <div class="pilha-p" style="margin-top:20px">
      <a class="btn btn-primario btn-grande" id="agenda" target="_blank" rel="noopener" href="#">${icone('calendario')}Criar no Google Agenda</a>
      <button type="button" class="btn btn-secundario btn-largo" id="ics">${icone('baixar')}Outro calendário (.ics)</button>
    </div>
    <ol class="passos pequeno" style="margin-top:24px">
      <li><span>Toque em <b>Criar no Google Agenda</b>.</span></li>
      <li><span>Confira a hora e toque em <b>Salvar</b>. O evento se repete todos os dias.</span></li>
      <li><span>Para avisar na hora certa, abra o evento e deixe a notificação em <b>0 minutos antes</b>.</span></li>
    </ol>
  </main>${abas('hoje')}`;
  const hora = raiz.querySelector('#hora');
  const agenda = raiz.querySelector('#agenda');
  const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  const dados = () => ({
    hora: hora.value || '07:00',
    minutos: p.minutos,
    titulo: `Bora treinar, ${p.nome.split(' ')[0]}!`,
    detalhes: `Abra o app Bora e faça o treino de hoje (${p.minutos} min).`,
    fuso,
  });
  const atualizar = () => {
    agenda.href = linkGoogleAgenda(dados());
  };
  atualizar();
  hora.addEventListener('change', () => {
    atualizar();
    store.atualizarAjustes(p.id, { lembrete: hora.value || '07:00' });
  });
  agenda.addEventListener('click', () => {
    store.atualizarAjustes(p.id, { lembrete: hora.value || '07:00', lembreteCriado: true });
  });
  raiz.querySelector('#ics').addEventListener('click', () => {
    baixarArquivo('bora-lembrete.ics', arquivoIcs(dados()), 'text/calendar');
    store.atualizarAjustes(p.id, { lembrete: hora.value || '07:00', lembreteCriado: true });
    aviso('Arquivo baixado. Abra-o para adicionar ao calendário.');
  });
}
