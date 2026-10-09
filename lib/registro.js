import { dataIt, euro, ora } from './format';

export const NOMI_AZIONE = { creazione: 'Creata', modifica: 'Modificata', eliminazione: 'Eliminata' };

const CAMPI = [
  ['tipo', 'Tipo', (v) => (v === 'ricarica' ? 'ricarica' : 'addebito')],
  ['maestro_id', 'Maestro', null],
  ['data', 'Data', dataIt],
  ['importo', 'Importo', euro],
  ['campo', 'Campo', (v) => v],
  ['ambiente', 'Copertura', (v) => (v === 'interno' ? 'coperto' : v === 'esterno' ? 'scoperto' : v)],
  ['ora_inizio', 'Dalle', ora],
  ['ora_fine', 'Alle', ora],
  ['metodo', 'Pagamento', (v) => (v === 'pos' ? 'POS' : v)],
  ['note', 'Note', (v) => v],
];

// Elenco leggibile delle differenze tra due versioni di un'operazione
export function differenze(prima, dopo, nomeMaestro = (id) => id) {
  if (!prima || !dopo) return [];
  const righe = [];
  for (const [chiave, etichetta, formato] of CAMPI) {
    const a = prima[chiave] ?? null;
    const b = dopo[chiave] ?? null;
    if (String(a ?? '') === String(b ?? '')) continue;
    const f = chiave === 'maestro_id' ? nomeMaestro : formato;
    righe.push(`${etichetta}: ${a === null || a === '' ? 'vuoto' : f(a)} → ${b === null || b === '' ? 'vuoto' : f(b)}`);
  }
  return righe;
}

export const quando = (ts) =>
  new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(ts));
