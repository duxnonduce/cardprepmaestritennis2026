'use server';
import { revalidatePath } from 'next/cache';
import { getSessione } from '@/lib/auth';
import { euro } from '@/lib/format';
import { leggiMovimento } from '@/lib/movimenti';

export async function registraMovimento(_prec, fd) {
  const s = await getSessione();
  if (!s.profilo || !['admin', 'segreteria'].includes(s.profilo.ruolo)) {
    return { errore: 'Sessione scaduta: accedi di nuovo.' };
  }

  const { riga, errore } = leggiMovimento(fd);
  if (errore) return { errore };

  const { error } = await s.supabase.from('movimenti').insert({ ...riga, creato_da: s.user.id });
  if (error) return { errore: `Operazione non salvata: ${error.message}` };

  revalidatePath('/', 'layout');
  return {
    ok: true,
    t: Date.now(),
    messaggio: riga.tipo === 'addebito' ? `Scalati ${euro(riga.importo)}.` : `Caricati ${euro(riga.importo)}.`,
  };
}
