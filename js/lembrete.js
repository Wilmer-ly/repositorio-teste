// Lembrete diário sem servidor: evento repetido no Google Agenda ou arquivo .ics.

function pad(n) {
  return String(n).padStart(2, '0');
}

// Data/hora local no formato do Google Agenda (sem "Z" = horário local + ctz).
function formatoAgenda(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function proximaOcorrencia(hora, agora = new Date()) {
  const [h, m] = hora.split(':').map(Number);
  const d = new Date(agora);
  d.setHours(h, m, 0, 0);
  if (d <= agora) d.setDate(d.getDate() + 1);
  return d;
}

export function linkGoogleAgenda({ hora, minutos = 15, titulo, detalhes = '', fuso, agora = new Date() }) {
  const inicio = proximaOcorrencia(hora, agora);
  const fim = new Date(inicio.getTime() + minutos * 60000);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${formatoAgenda(inicio)}/${formatoAgenda(fim)}`,
    details: detalhes,
    recur: 'RRULE:FREQ=DAILY',
  });
  if (fuso) p.set('ctz', fuso);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function escaparIcs(t) {
  return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function arquivoIcs({ hora, minutos = 15, titulo, detalhes = '', fuso = 'America/Sao_Paulo', agora = new Date() }) {
  const inicio = proximaOcorrencia(hora, agora);
  const fim = new Date(inicio.getTime() + minutos * 60000);
  const carimbo = `${agora.getUTCFullYear()}${pad(agora.getUTCMonth() + 1)}${pad(agora.getUTCDate())}T${pad(agora.getUTCHours())}${pad(agora.getUTCMinutes())}${pad(agora.getUTCSeconds())}Z`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bora//Treino em casa//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:bora-lembrete-${inicio.getTime()}@bora.app`,
    `DTSTAMP:${carimbo}`,
    `DTSTART;TZID=${fuso}:${formatoAgenda(inicio)}`,
    `DTEND;TZID=${fuso}:${formatoAgenda(fim)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escaparIcs(titulo)}`,
    `DESCRIPTION:${escaparIcs(detalhes)}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escaparIcs(titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
