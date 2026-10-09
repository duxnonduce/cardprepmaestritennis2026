import { parseImporto, minutiTra } from './format';

const AMBIENTI = ['interno', 'esterno'];
const METODI = ['contanti', 'pos', 'bonifico', 'altro'];

const testo = (fd, k) => String(fd.get(k) ?? '').trim();

// Legge e valida i campi di un movimento da un form
export function leggiMovimento(fd) {
  const tipo = testo(fd, 'tipo');
  const maestro_id = testo(fd, 'maestro_id');
  const data = testo(fd, 'data');
  const importo = parseImporto(fd.get('importo'));
  const note = testo(fd, 'note') || null;

  if (!maestro_id) return { errore: 'Scegli il maestro.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { errore: 'Inserisci una data valida.' };
  if (!(importo > 0)) return { errore: "Inserisci un importo maggiore di zero (es. 12,50)." };

  const riga = {
    tipo, maestro_id, data, importo, note,
    campo: null, ambiente: null, ora_inizio: null, ora_fine: null, metodo: null,
  };

  if (tipo === 'addebito') {
    riga.campo = testo(fd, 'campo');
    riga.ambiente = testo(fd, 'ambiente');
    riga.ora_inizio = testo(fd, 'ora_inizio').slice(0, 5) || null;
    riga.ora_fine = testo(fd, 'ora_fine').slice(0, 5) || null;
    if (!riga.campo) return { errore: 'Indica il numero del campo.' };
    if (!AMBIENTI.includes(riga.ambiente)) return { errore: 'Indica se il campo è interno o esterno.' };
    if (!riga.ora_inizio) return { errore: "Indica l'orario di inizio." };
    if (riga.ora_fine && !minutiTra(riga.ora_inizio, riga.ora_fine)) {
      return { errore: "L'orario di fine deve essere dopo quello di inizio." };
    }
  } else if (tipo === 'ricarica') {
    const metodo = testo(fd, 'metodo');
    riga.metodo = METODI.includes(metodo) ? metodo : null;
  } else {
    return { errore: 'Tipo di operazione non valido.' };
  }
  return { riga };
}
