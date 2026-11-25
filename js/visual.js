// Escolhe como mostrar um exercício: ilustração animada (quando existe) ou a figura própria.
import { criarFigura } from './figura.js';
import { criarIlustracao, preCarregar } from './arte.js';

export function criarVisual(ex, opcoes = {}) {
  return ex.arte ? criarIlustracao(ex, opcoes) : criarFigura(ex, opcoes);
}

export { preCarregar };
