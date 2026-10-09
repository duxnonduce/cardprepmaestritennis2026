import Link from 'next/link';
import AzioneForm from '@/components/AzioneForm';
import Pulsante from '@/components/Pulsante';
import { getSessione } from '@/lib/auth';
import { dataIt, euro } from '@/lib/format';
import { creaMaestro } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Maestri() {
  const { supabase } = await getSessione();
  const [{ data: saldi }, { data: account }] = await Promise.all([
    supabase.from('saldi').select('*').order('attivo', { ascending: false }).order('cognome').order('nome'),
    supabase.from('profili').select('username, maestro_id').eq('ruolo', 'maestro'),
  ]);
  const accessoDi = Object.fromEntries((account || []).map((a) => [a.maestro_id, a.username]));
  const totale = (saldi || []).filter((s) => s.attivo).reduce((t, s) => t + Number(s.saldo), 0);
  const inNegativo = (saldi || []).filter((s) => s.attivo && Number(s.saldo) < 0).length;

  return (
    <>
      <h1>Maestri</h1>
      <p className="riepilogo">
        Credito totale dei maestri attivi: <strong>{euro(totale)}</strong>
        {inNegativo > 0 && <>. In negativo: <strong className="neg">{inNegativo}</strong></>}
      </p>

      <div className="due-colonne largo-sinistra">
        <section className="pannello">
          {!saldi?.length ? (
            <p className="vuoto">Nessun maestro. Aggiungi il primo con il modulo qui accanto.</p>
          ) : (
            <div className="tabella-wrap">
              <table className="tabella">
                <thead>
                  <tr>
                    <th>Maestro</th>
                    <th className="num">Saldo</th>
                    <th>Ultima operazione</th>
                    <th>Accesso</th>
                  </tr>
                </thead>
                <tbody>
                  {saldi.map((s) => (
                    <tr key={s.maestro_id} className={s.attivo ? '' : 'spento'}>
                      <td>
                        <Link href={`/admin/maestri/${s.maestro_id}`}>{s.cognome} {s.nome}</Link>
                        {!s.attivo && <span className="badge">non attivo</span>}
                      </td>
                      <td className={`num nowrap ${Number(s.saldo) < 0 ? 'neg' : ''}`}>{euro(s.saldo)}</td>
                      <td>{s.ultimo_movimento ? dataIt(s.ultimo_movimento) : 'Mai'}</td>
                      <td>{accessoDi[s.maestro_id] || <span className="tenue">Nessuno</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="pannello">
          <h2>Nuovo maestro</h2>
          <AzioneForm action={creaMaestro} className="pila" svuotaDopo>
            <div className="griglia">
              <label className="campo-form"><span>Nome</span><input name="nome" required /></label>
              <label className="campo-form"><span>Cognome</span><input name="cognome" required /></label>
            </div>
            <label className="campo-form"><span>Telefono</span><input name="telefono" type="tel" /></label>
            <label className="campo-form"><span>Note</span><input name="note" /></label>
            <fieldset className="riquadro">
              <legend>Accesso per il maestro (facoltativo)</legend>
              <p className="aiuto">Compila se vuoi che il maestro possa vedere credito e storico dal telefono.</p>
              <div className="griglia">
                <label className="campo-form"><span>Username</span><input name="username" autoCapitalize="none" placeholder="es. mario.rossi" /></label>
                <label className="campo-form"><span>Password</span><input name="password" type="text" autoComplete="new-password" placeholder="Almeno 8 caratteri" /></label>
              </div>
            </fieldset>
            <Pulsante>Aggiungi maestro</Pulsante>
          </AzioneForm>
        </section>
      </div>
    </>
  );
}
