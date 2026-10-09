'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessione } from '@/lib/auth';
import { parseImporto } from '@/lib/format';
import { leggiMovimento } from '@/lib/movimenti';
import { createAdminClient } from '@/lib/supabase/admin';
import { emailDaUsername, usernameValido } from '@/lib/utenti';

const testo = (fd, k) => String(fd.get(k) ?? '').trim();
const RUOLI = ['admin', 'segreteria', 'maestro'];
const BAN_PERMANENTE = '876000h';

async function soloAdmin() {
  const s = await getSessione();
  return s.profilo?.ruolo === 'admin' ? s : null;
}
const NON_AUTORIZZATO = { errore: 'Solo gli amministratori possono farlo. Accedi di nuovo.' };

function fatto(messaggio) {
  revalidatePath('/', 'layout');
  return { ok: true, messaggio, t: Date.now() };
}

// ---------- Utenze ----------

async function creaAccount({ username, password, nome_visualizzato, ruolo, maestro_id }) {
  if (!usernameValido(username)) {
    return 'Username non valido: da 3 a 30 caratteri tra lettere minuscole, numeri, punto, trattino e underscore.';
  }
  if (password.length < 8) return 'La password deve avere almeno 8 caratteri.';
  if (!RUOLI.includes(ruolo)) return 'Ruolo non valido.';
  if (ruolo === 'maestro' && !maestro_id) return 'Scegli a quale maestro collegare questa utenza.';

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return e.message;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: emailDaUsername(username),
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (error) {
    return /already|registered|exists/i.test(error.message)
      ? `Lo username "${username}" è già in uso.`
      : `Utenza non creata: ${error.message}`;
  }

  const { error: e2 } = await admin.from('profili').insert({
    id: data.user.id,
    username,
    nome_visualizzato,
    ruolo,
    maestro_id: ruolo === 'maestro' ? maestro_id : null,
  });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    return `Utenza non creata: ${e2.message}`;
  }
  return null;
}

export async function creaUtente(_prec, fd) {
  if (!(await soloAdmin())) return NON_AUTORIZZATO;
  const username = testo(fd, 'username').toLowerCase();
  const nome_visualizzato = testo(fd, 'nome_visualizzato') || username;
  const errore = await creaAccount({
    username,
    password: String(fd.get('password') || ''),
    nome_visualizzato,
    ruolo: testo(fd, 'ruolo'),
    maestro_id: testo(fd, 'maestro_id') || null,
  });
  if (errore) return { errore };
  return fatto(`Utenza "${username}" creata.`);
}

export async function aggiornaUtente(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const id = testo(fd, 'id');
  const ruolo = testo(fd, 'ruolo');
  const attivo = fd.get('attivo') === 'on';
  const maestro_id = testo(fd, 'maestro_id') || null;
  const nome_visualizzato = testo(fd, 'nome_visualizzato');

  if (!RUOLI.includes(ruolo)) return { errore: 'Ruolo non valido.' };
  if (!nome_visualizzato) return { errore: 'Inserisci il nome da mostrare.' };
  if (ruolo === 'maestro' && !maestro_id) return { errore: 'Scegli a quale maestro collegare questa utenza.' };
  if (id === s.user.id && (ruolo !== 'admin' || !attivo)) {
    return { errore: 'Non puoi togliere a te stesso il ruolo di amministratore o disattivarti.' };
  }

  const { error } = await s.supabase
    .from('profili')
    .update({ nome_visualizzato, ruolo, attivo, maestro_id: ruolo === 'maestro' ? maestro_id : null })
    .eq('id', id);
  if (error) return { errore: `Modifiche non salvate: ${error.message}` };

  try {
    await createAdminClient().auth.admin.updateUserById(id, { ban_duration: attivo ? 'none' : BAN_PERMANENTE });
  } catch {
    // il blocco del profilo basta già a impedire l'accesso
  }
  return fatto('Utenza aggiornata.');
}

export async function reimpostaPassword(_prec, fd) {
  if (!(await soloAdmin())) return NON_AUTORIZZATO;
  const password = String(fd.get('password') || '');
  if (password.length < 8) return { errore: 'La password deve avere almeno 8 caratteri.' };
  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(testo(fd, 'id'), { password });
    if (error) return { errore: `Password non cambiata: ${error.message}` };
  } catch (e) {
    return { errore: e.message };
  }
  return fatto('Password cambiata. Comunicala alla persona.');
}

export async function eliminaUtente(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const id = testo(fd, 'id');
  if (id === s.user.id) return { errore: 'Non puoi eliminare la tua utenza.' };
  try {
    const { error } = await createAdminClient().auth.admin.deleteUser(id);
    if (error) return { errore: `Utenza non eliminata: ${error.message}` };
  } catch (e) {
    return { errore: e.message };
  }
  revalidatePath('/', 'layout');
  redirect('/admin/utenti');
}

// ---------- Maestri ----------

function leggiMaestro(fd) {
  const dati = {
    nome: testo(fd, 'nome'),
    cognome: testo(fd, 'cognome'),
    telefono: testo(fd, 'telefono') || null,
    note: testo(fd, 'note') || null,
  };
  if (!dati.nome || !dati.cognome) return { errore: 'Inserisci nome e cognome.' };
  return { dati };
}

export async function creaMaestro(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const { dati, errore } = leggiMaestro(fd);
  if (errore) return { errore };

  const { data: maestro, error } = await s.supabase.from('maestri').insert(dati).select('id').single();
  if (error) return { errore: `Maestro non creato: ${error.message}` };

  const username = testo(fd, 'username').toLowerCase();
  if (username) {
    const e = await creaAccount({
      username,
      password: String(fd.get('password') || ''),
      nome_visualizzato: `${dati.nome} ${dati.cognome}`,
      ruolo: 'maestro',
      maestro_id: maestro.id,
    });
    if (e) {
      revalidatePath('/', 'layout');
      return { errore: `Maestro creato, ma l'accesso no: ${e} Puoi crearlo da Utenze.` };
    }
    return fatto(`${dati.nome} ${dati.cognome} aggiunto con accesso "${username}".`);
  }
  return fatto(`${dati.nome} ${dati.cognome} aggiunto.`);
}

export async function aggiornaMaestro(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const { dati, errore } = leggiMaestro(fd);
  if (errore) return { errore };
  const { error } = await s.supabase
    .from('maestri')
    .update({ ...dati, attivo: fd.get('attivo') === 'on' })
    .eq('id', testo(fd, 'id'));
  if (error) return { errore: `Modifiche non salvate: ${error.message}` };
  return fatto('Dati del maestro salvati.');
}

export async function eliminaMaestro(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const id = testo(fd, 'id');
  const { count } = await s.supabase.from('movimenti').select('id', { count: 'exact', head: true }).eq('maestro_id', id);
  if (count > 0) {
    return { errore: 'Questo maestro ha operazioni registrate: togli la spunta "Attivo" invece di eliminarlo.' };
  }
  const { error } = await s.supabase.from('maestri').delete().eq('id', id);
  if (error) return { errore: `Maestro non eliminato: ${error.message}` };
  revalidatePath('/', 'layout');
  redirect('/admin/maestri');
}

// ---------- Movimenti ----------

export async function aggiornaMovimento(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const { riga, errore } = leggiMovimento(fd);
  if (errore) return { errore };
  const { error } = await s.supabase.from('movimenti').update(riga).eq('id', testo(fd, 'id'));
  if (error) return { errore: `Modifiche non salvate: ${error.message}` };
  return fatto('Operazione aggiornata.');
}

export async function eliminaMovimento(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const { error } = await s.supabase.from('movimenti').delete().eq('id', testo(fd, 'id'));
  if (error) return { errore: `Operazione non eliminata: ${error.message}` };
  revalidatePath('/', 'layout');
  redirect('/admin/movimenti');
}

// ---------- Campi e tariffe ----------

export async function salvaTariffe(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const aggiornamenti = [];
  for (const id of fd.getAll('id').map(String)) {
    const prezzo_orario = parseImporto(fd.get(`prezzo_${id}`));
    const dalle = testo(fd, `dalle_${id}`).slice(0, 5);
    let alle = testo(fd, `alle_${id}`).slice(0, 5);
    if (alle === '00:00') alle = '24:00';
    if (!(prezzo_orario >= 0)) return { errore: 'Inserisci prezzi validi (es. 8,00).' };
    if (!dalle || !alle || alle <= dalle) return { errore: "In ogni fascia l'orario di fine deve essere dopo l'inizio." };
    aggiornamenti.push(s.supabase.from('tariffe').update({ prezzo_orario, dalle, alle }).eq('id', id));
  }
  const risultati = await Promise.all(aggiornamenti);
  const errore = risultati.find((r) => r.error)?.error;
  if (errore) return { errore: `Tariffe non salvate: ${errore.message}` };
  return fatto('Tariffe salvate.');
}

export async function aggiungiCampo(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const numero = testo(fd, 'numero');
  const ambiente = testo(fd, 'ambiente');
  const ordine = parseInt(testo(fd, 'ordine') || '0', 10) || 0;
  if (!numero) return { errore: 'Inserisci il numero del campo.' };
  if (!['interno', 'esterno'].includes(ambiente)) return { errore: 'Scegli interno o esterno.' };
  const { error } = await s.supabase.from('campi').insert({ numero, ambiente, ordine });
  if (error) return { errore: error.code === '23505' ? `Il campo ${numero} esiste già.` : error.message };
  return fatto(`Campo ${numero} aggiunto.`);
}

export async function eliminaCampo(_prec, fd) {
  const s = await soloAdmin();
  if (!s) return NON_AUTORIZZATO;
  const { error } = await s.supabase.from('campi').delete().eq('id', testo(fd, 'id'));
  if (error) return { errore: error.message };
  return fatto('Campo rimosso.');
}
