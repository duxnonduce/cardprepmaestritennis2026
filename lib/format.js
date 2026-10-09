const formatoEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export const euro = (n) => formatoEuro.format(Number(n || 0));

export function dataIt(d) {
  if (!d) return '';
  const [a, m, g] = String(d).slice(0, 10).split('-');
  return `${g}/${m}/${a}`;
}

export const ora = (t) => (t ? String(t).slice(0, 5) : '');

export function oggiRoma() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}

// Minuti dalla mezzanotte; come orario di fine "00:00" vale 24:00
function aMinuti(t, comeFine = false) {
  if (!t) return null;
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const v = h * 60 + m;
  return comeFine && v === 0 ? 1440 : v;
}

export function minutiTra(inizio, fine) {
  const a = aMinuti(inizio);
  const b = aMinuti(fine, true);
  if (a === null || b === null) return null;
  return b - a > 0 ? b - a : null;
}

// Quota divisa per fasce: 14:30-15:30 al coperto = 30 min a 8 + 30 min a 10
export function calcolaQuota(inizio, fine, ambiente, tariffe) {
  const a = aMinuti(inizio);
  const b = aMinuti(fine, true);
  if (a === null || b === null || b <= a) return null;
  let totale = 0;
  let coperti = 0;
  const righe = [];
  for (const t of tariffe.filter((x) => x.ambiente === ambiente)) {
    const minuti = Math.max(0, Math.min(b, aMinuti(t.alle, true)) - Math.max(a, aMinuti(t.dalle)));
    if (!minuti) continue;
    coperti += minuti;
    totale += (minuti * Number(t.prezzo_orario)) / 60;
    righe.push({ fascia: t.fascia, minuti, prezzo: Number(t.prezzo_orario) });
  }
  return { importo: Math.round(totale * 100) / 100, righe, fuoriFascia: b - a - coperti };
}

export function parseImporto(v) {
  const testo = String(v ?? '').replace(/\s|€/g, '').replace(',', '.');
  if (testo === '') return NaN;
  const n = Number(testo);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export const decimaleIt = (n) => Number(n || 0).toFixed(2).replace('.', ',');

const NOMI_METODO = { contanti: 'contanti', pos: 'POS', bonifico: 'bonifico', altro: 'altro' };

export function descrizioneMovimento(m) {
  if (m.tipo === 'ricarica') {
    return m.metodo ? `Ricarica in ${NOMI_METODO[m.metodo] || m.metodo}` : 'Ricarica';
  }
  const orario = m.ora_fine ? `${ora(m.ora_inizio)}-${ora(m.ora_fine)}` : `ore ${ora(m.ora_inizio)}`;
  const copertura = m.ambiente === 'interno' ? 'coperto' : 'scoperto';
  return `Campo ${m.campo} ${copertura}, ${orario}`;
}
