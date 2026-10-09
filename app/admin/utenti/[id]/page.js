import Link from 'next/link';
import { notFound } from 'next/navigation';
import AzioneForm from '@/components/AzioneForm';
import Pulsante from '@/components/Pulsante';
import { getSessione } from '@/lib/auth';
import { aggiornaUtente, eliminaUtente, reimpostaPassword } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function Utenza({ params }) {
  const { supabase, user } = await getSessione();
  const [{ data: p }, { data: maestri }] = await Promise.all([
    supabase.from('profili').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('maestri').select('id, nome, cognome').order('cognome'),
  ]);
  if (!p) notFound();
  const sonoIo = p.id === user.id;

  return (
    <>
      <p className="briciole"><Link href="/admin/utenti">Utenze</Link></p>
      <h1>{p.username}</h1>

      <div className="due-colonne">
        <section className="pannello">
          <h2>Dati e permessi</h2>
          <AzioneForm action={aggiornaUtente} className="pila">
            <input type="hidden" name="id" value={p.id} />
            <label className="campo-form"><span>Nome da mostrare</span><input name="nome_visualizzato" defaultValue={p.nome_visualizzato} required /></label>
            <label className="campo-form">
              <span>Ruolo</span>
              <select name="ruolo" defaultValue={p.ruolo}>
                <option value="segreteria">Segreteria</option>
                <option value="maestro">Maestro</option>
                <option value="admin">Amministratore</option>
              </select>
            </label>
            <label className="campo-form">
              <span>Maestro collegato</span>
              <select name="maestro_id" defaultValue={p.maestro_id || ''}>
                <option value="">Solo per il ruolo Maestro</option>
                {(maestri || []).map((m) => (
                  <option key={m.id} value={m.id}>{m.cognome} {m.nome}</option>
                ))}
              </select>
            </label>
            <label className="spunta">
              <input type="checkbox" name="attivo" defaultChecked={p.attivo} />
              Attiva (può accedere)
            </label>
            <Pulsante>Salva modifiche</Pulsante>
          </AzioneForm>
        </section>

        <div className="colonna">
          <section className="pannello">
            <h2>Nuova password</h2>
            <AzioneForm action={reimpostaPassword} className="pila" svuotaDopo>
              <input type="hidden" name="id" value={p.id} />
              <label className="campo-form"><span>Password</span><input name="password" type="text" autoComplete="new-password" required placeholder="Almeno 8 caratteri" /></label>
              <Pulsante>Cambia password</Pulsante>
            </AzioneForm>
          </section>

          {!sonoIo && (
            <AzioneForm action={eliminaUtente} className="zona-pericolo">
              <input type="hidden" name="id" value={p.id} />
              <Pulsante variante="pericolo" conferma={`Eliminare l'utenza ${p.username}? Le operazioni registrate restano.`} inAttesa="Eliminazione…">
                Elimina utenza
              </Pulsante>
            </AzioneForm>
          )}
        </div>
      </div>
    </>
  );
}
