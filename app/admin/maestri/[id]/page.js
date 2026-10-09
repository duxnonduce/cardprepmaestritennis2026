import Link from 'next/link';
import { notFound } from 'next/navigation';
import AzioneForm from '@/components/AzioneForm';
import Pulsante from '@/components/Pulsante';
import Saldo from '@/components/Saldo';
import Storico from '@/components/Storico';
import { getSessione } from '@/lib/auth';
import { aggiornaMaestro, eliminaMaestro } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function Maestro({ params }) {
  const { supabase } = await getSessione();
  const [{ data: m }, { data: saldo }, { data: movimenti }, { data: account }] = await Promise.all([
    supabase.from('maestri').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('saldi').select('saldo').eq('maestro_id', params.id).maybeSingle(),
    supabase.from('movimenti').select('*, autore:profili!movimenti_creato_da_fkey(nome_visualizzato), modificatore:profili!movimenti_modificato_da_fkey(nome_visualizzato)').eq('maestro_id', params.id),
    supabase.from('profili').select('id, username, attivo').eq('maestro_id', params.id),
  ]);
  if (!m) notFound();

  return (
    <>
      <p className="briciole"><Link href="/admin/maestri">Maestri</Link></p>
      <h1>{m.cognome} {m.nome}</h1>

      <div className="due-colonne">
        <div className="colonna">
          <Saldo valore={saldo?.saldo} />
          <Link className="btn primario" href={`/segreteria/maestro/${m.id}`}>Scala o carica credito</Link>

          <section className="pannello">
            <h2>Dati</h2>
            <AzioneForm action={aggiornaMaestro} className="pila">
              <input type="hidden" name="id" value={m.id} />
              <div className="griglia">
                <label className="campo-form"><span>Nome</span><input name="nome" defaultValue={m.nome} required /></label>
                <label className="campo-form"><span>Cognome</span><input name="cognome" defaultValue={m.cognome} required /></label>
              </div>
              <label className="campo-form"><span>Telefono</span><input name="telefono" type="tel" defaultValue={m.telefono || ''} /></label>
              <label className="campo-form"><span>Note</span><input name="note" defaultValue={m.note || ''} /></label>
              <label className="spunta">
                <input type="checkbox" name="attivo" defaultChecked={m.attivo} />
                Attivo (compare in cassa)
              </label>
              <Pulsante>Salva dati</Pulsante>
            </AzioneForm>
          </section>

          <section className="pannello">
            <h2>Accesso</h2>
            {account?.length ? (
              <ul className="elenco-semplice">
                {account.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/utenti/${a.id}`}>{a.username}</Link>
                    {!a.attivo && <span className="badge">disattivato</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="vuoto">Nessun accesso. Crealo da <Link href="/admin/utenti">Utenze</Link>.</p>
            )}
          </section>

          <AzioneForm action={eliminaMaestro} className="zona-pericolo">
            <input type="hidden" name="id" value={m.id} />
            <Pulsante variante="pericolo" conferma={`Eliminare definitivamente ${m.nome} ${m.cognome}?`} inAttesa="Eliminazione…">
              Elimina maestro
            </Pulsante>
          </AzioneForm>
        </div>

        <section className="pannello">
          <h2>Storico operazioni</h2>
          <Storico movimenti={movimenti || []} modificabile mostraOperatore />
        </section>
      </div>
    </>
  );
}
