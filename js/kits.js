// Cor ("uniforme") de cada parte do corpo. Os valores ficam em css/tokens.css ([data-kit]).
export const KITS = ['aquecimento', 'cardio', 'pernas', 'abdomen', 'bracos', 'costas', 'alongamento', 'corpo_todo', 'descanso', 'desafio'];

export function kitDoExercicio(ex) {
  const a = ex?.areas?.[0];
  return KITS.includes(a) ? a : 'corpo_todo';
}

// Funciona com um treino montado ou com um dia do plano (os dois têm "tema").
export function kitDoTreino(t, perfil) {
  switch (t?.tema) {
    case 'cardio':
      return 'cardio';
    case 'foco':
      return perfil?.area && perfil.area !== 'corpo_todo' ? perfil.area : 'corpo_todo';
    case 'corpo':
      return 'corpo_todo';
    case 'core':
      return 'abdomen';
    case 'mobilidade':
      return 'alongamento';
    case 'recuperacao':
      return 'descanso';
    case 'desafio':
      return 'desafio';
    default:
      return KITS.includes(t?.tema) ? t.tema : 'corpo_todo';
  }
}
