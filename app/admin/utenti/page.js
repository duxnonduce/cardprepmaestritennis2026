import Link from 'next/link';
import AzioneForm from '@/components/AzioneForm';
import Pulsante from '@/components/Pulsante';
import { getSessione, NOMI_RUOLO } from '@/lib/auth';
import { creaUtente } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Utenze() {
  const { supabase } = await getSessione();
  const [{ data: profili }, { data: maestri }] = await Promise.all([
    supabase.from('profili').select('*, maestri(nome, cognome)').order('ruolo').order('username'),
    supabase.from('maestri').select('id, nome, cognome').eq('attivo', true).order('cognome'),
  ]);

  return (
    <>
      <h1>Utenze</h1>
      <div className="due-colonne largo-sinistra">
        <section className="pannello">
          <div className="tabella-wrap">
            <table className="tabella">
              <thead>
                <tr><th>Username</th><th>Nome</th><th>Ruolo</th><th>Maestro collegato</th></tr>
              </thead>
              <tbody>
                {(profili || []).map((p) => (
                  <tr key={p.id} className={p.attivo ? '' : 'spento'}>
                    <td>
                      <Link href={`/admin/utenti/${p.id}`}>{p.username}</Link>
                      {!p.attivo && <span className="badge">disattivata</span>}
                    </td>
                    <td>{p.nome_visualizzato}</td>
                    <td>{NOMI_RUOLO[p.ruolo]}</td>
                    <td>{p.maestri ? `${p.maestri.cognome} ${p.maestri.nome}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pannello">
          <h2>Nuova utenza</h2>
          <AzioneForm action={creaUtente} className="pila" svuotaDopo>
            <label className="campo-form"><span>Username</span><input name="username" autoCapitalize="none" required placeholder="es. segreteria2" /></label>
            <label className="campo-form"><span>Nome da mostrare</span><input name="nome_visualizzato" placeholder="es. Segreteria sera" /></label>
            <label className="campo-form"><span>Password</span><input name="password" type="text" autoComplete="new-password" required placeholder="Almeno 8 caratteri" /></label>
            <label className="campo-form">
              <span>Ruolo</span>
              <select name="ruolo" defaultValue="segreteria">
                <option value="segreteria">Segreteria</option>
                <option value="maestro">Maestro</option>
                <option value="admin">Amministratore</option>
              </select>
            </label>
            <label className="campo-form">
              <span>Maestro collegato</span>
              <select name="maestro_id" defaultValue="">
                <option value="">Solo per il ruolo Maestro</option>
                {(maestri || []).map((m) => (
                  <option key={m.id} value={m.id}>{m.cognome} {m.nome}</option>
                ))}
              </select>
            </label>
            <Pulsante>Crea utenza</Pulsante>
          </AzioneForm>
        </section>
      </div>
    </>
  );
}
