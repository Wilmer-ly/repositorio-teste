// Dicas do Bora (textos próprios, gerais; não substituem orientação profissional).
export const CATEGORIAS = {
  comecar: 'Começar bem',
  tecnica: 'Postura e técnica',
  respiracao: 'Respiração',
  hidratacao: 'Hidratação',
  sono: 'Descanso e sono',
  alimentacao: 'Alimentação',
  motivacao: 'Motivação',
  casal: 'Treinar a dois',
  seguranca: 'Segurança',
};

export const DICAS = [
  { id: 'comece-pelo-que-da', cat: 'comecar', titulo: 'Comece pelo que dá', texto: 'Dez minutos feitos valem mais que uma hora planejada. Se hoje está difícil, faça só o aquecimento: muitas vezes a vontade aparece depois de começar.' },
  { id: 'horario-fixo', cat: 'comecar', titulo: 'Escolha um horário fixo', texto: 'Treinar sempre no mesmo horário transforma o treino em hábito, como escovar os dentes. Use o lembrete diário do app para não esquecer.' },
  { id: 'prepare-o-espaco', cat: 'comecar', titulo: 'Prepare o espaço', texto: 'Deixe um cantinho livre, com um tapete ou toalha e uma garrafa de água. Quanto menos coisa para arrumar, menos desculpa para não começar.' },
  { id: 'roupa-e-calcado', cat: 'comecar', titulo: 'Roupa e calçado', texto: 'Roupa leve e um tênis que não escorregue. Os exercícios no chão podem ser feitos descalço, em cima de um tapete.' },
  { id: 'qualidade', cat: 'tecnica', titulo: 'Qualidade antes de velocidade', texto: 'Fazer devagar e bem trabalha mais o músculo e protege as articulações. Acelere só quando o movimento estiver firme.' },
  { id: 'barriga-firme', cat: 'tecnica', titulo: 'Barriga firme', texto: 'Contrair de leve o abdômen, como quem vai receber um abraço apertado, ajuda a proteger a lombar em quase todos os exercícios.' },
  { id: 'joelhos', cat: 'tecnica', titulo: 'Joelhos na direção dos pés', texto: 'Em agachamentos e afundos, os joelhos apontam para onde os pés apontam e não caem para dentro.' },
  { id: 'pescoco', cat: 'tecnica', titulo: 'Pescoço relaxado', texto: 'Nos abdominais, quem sobe é o tronco. Olhe para cima ou para os joelhos e não puxe a cabeça com as mãos.' },
  { id: 'variacoes', cat: 'tecnica', titulo: 'Use as variações', texto: 'Muitos exercícios têm uma versão mais fácil e outra mais difícil. Trocar não é trapaça: é treinar no seu nível. Toque em “Mais fácil” ou “Mais difícil” antes de começar o treino.' },
  { id: 'nao-prenda-o-ar', cat: 'respiracao', titulo: 'Não prenda o ar', texto: 'Solte o ar no esforço (ao subir, empurrar ou levantar) e puxe o ar na volta. Prender a respiração cansa mais rápido.' },
  { id: 'respirar-para-acalmar', cat: 'respiracao', titulo: 'Respiração para acalmar', texto: 'No fim do treino, puxe o ar contando até 4 e solte contando até 6. Repita algumas vezes para o corpo desacelerar.' },
  { id: 'agua-por-perto', cat: 'hidratacao', titulo: 'Água por perto', texto: 'Tome alguns goles antes, nas pausas e depois do treino. Em dias quentes, capriche um pouco mais.' },
  { id: 'sede', cat: 'hidratacao', titulo: 'Beba ao longo do dia', texto: 'Boca seca, dor de cabeça e cansaço fora do normal podem ser sinal de pouca água. Beba aos poucos durante o dia, não tudo de uma vez.' },
  { id: 'descansar', cat: 'sono', titulo: 'Descansar também é treinar', texto: 'É no descanso que o corpo se recupera. Por isso o plano tem dias de recuperação ativa: são mais leves de propósito.' },
  { id: 'dormir-bem', cat: 'sono', titulo: 'Durma bem', texto: 'Dormir pouco deixa o treino mais pesado e a fome maior. Tente manter horários parecidos para deitar e acordar.' },
  { id: 'dor-boa-dor-ruim', cat: 'sono', titulo: 'Cansaço normal e dor de alerta', texto: 'Sentir os músculos cansados nos dias seguintes é comum. Dor forte, em pontada ou nas articulações, não: pare e procure orientação.' },
  { id: 'prato-colorido', cat: 'alimentacao', titulo: 'Prato colorido', texto: 'Encher boa parte do prato com verduras e legumes dá mais saciedade e nutrientes. Não precisa de nada complicado.' },
  { id: 'comida-de-verdade', cat: 'alimentacao', titulo: 'Comida de verdade', texto: 'Prefira alimentos simples e feitos em casa aos ultraprocessados. Arroz, feijão, ovos, frutas e legumes são ótimos aliados.' },
  { id: 'antes-de-treinar', cat: 'alimentacao', titulo: 'Antes de treinar', texto: 'Treinar de estômago muito cheio incomoda. Se comeu bastante, espere um pouco; se está há muito tempo sem comer, um lanche leve ajuda.' },
  { id: 'perder-peso', cat: 'alimentacao', titulo: 'Para perder peso', texto: 'O treino ajuda muito, e a alimentação faz grande parte do resultado. Mudanças pequenas e constantes funcionam melhor que dietas radicais. Para um plano alimentar, procure um nutricionista.' },
  { id: 'corrente', cat: 'motivacao', titulo: 'Não quebre a corrente', texto: 'Ver a racha crescer motiva. Em dias corridos, faça um treino mais curto, mas faça.' },
  { id: 'compare-se', cat: 'motivacao', titulo: 'Compare-se com você', texto: 'Cada corpo tem seu ritmo. A única comparação que importa é com você mesmo de ontem: o app guarda seus recordes para isso.' },
  { id: 'pequenas-vitorias', cat: 'motivacao', titulo: 'Comemore as pequenas vitórias', texto: 'Terminar a primeira semana, passar da meta, subir de nível: cada conquista merece um “Parabéns!”.' },
  { id: 'perdeu-um-dia', cat: 'motivacao', titulo: 'Perdeu um dia? Siga em frente', texto: 'Faltar um dia não apaga o que você já fez. O plano espera por você: é só fazer o próximo dia.' },
  { id: 'a-dois', cat: 'casal', titulo: 'Treinar a dois', texto: 'Combinar o horário com quem você ama ajuda os dois a não faltarem. Um puxa o outro nos dias de preguiça.' },
  { id: 'cada-um-no-seu-nivel', cat: 'casal', titulo: 'Cada um no seu nível', texto: 'Treinando juntos, cada um usa a variação que serve para si. O importante é estarem juntos, não fazerem igual.' },
  { id: 'desafio-do-casal', cat: 'casal', titulo: 'Desafio do casal', texto: 'Que tal ver quem chega primeiro a 7 dias de racha? Competição saudável, com abraço no final.' },
  { id: 'antes-de-comecar', cat: 'seguranca', titulo: 'Antes de começar', texto: 'Se tem pressão alta, problema no coração ou nas articulações, está grávida ou se recuperando de lesão, converse com um profissional de saúde antes de começar.' },
  { id: 'sinais-para-parar', cat: 'seguranca', titulo: 'Sinais para parar', texto: 'Pare na hora se sentir dor no peito, falta de ar fora do normal, tontura ou enjoo. Se não passar, procure atendimento.' },
  { id: 'espaco-seguro', cat: 'seguranca', titulo: 'Espaço seguro', texto: 'Afaste móveis, tapetes soltos e objetos do chão. Nos exercícios com cadeira, encoste a cadeira na parede para não escorregar.' },
  { id: 'mais-de-60', cat: 'seguranca', titulo: 'Mais de 60 anos?', texto: 'Exercícios de força e equilíbrio ajudam muito no dia a dia. Tenha sempre uma parede ou cadeira firme por perto para apoio.' },
];

export function dicaDoDia(indice) {
  return DICAS[((indice % DICAS.length) + DICAS.length) % DICAS.length];
}
