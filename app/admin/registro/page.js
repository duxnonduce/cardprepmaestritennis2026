import Link from 'next/link';
import { getSessione } from '@/lib/auth';
import { descrizioneMovimento, euro, oggiRoma, offsetRoma } from '@/lib/format';
import { differenze, NOMI_AZIONE, quando } from '@/lib/registro';

export const dynamic = 'force-dynamic';

export default async function Registro({ searchParams }) {
  const { supabase } = await getSessione();
  const sp = searchParams || {};
  const oggi = oggiRoma();
  const da = sp.da ?? `${oggi.slice(0, 8)}01`;
  const a = sp.a ?? '';
  const utente = sp.utente ?? '';
  const azione = sp.azione ?? '';
  const maestro = sp.maestro ?? '';

  let q = supabase.from('registro').select('*').order('quando', { ascending: false }).limit(1000);
  if (utente) q = q.eq('utente_id', utente);
  if (azione) q = q.eq('azione', azione);
  if (maestro) q = q.eq('maestro_id', maestro);
  // i giorni sono in ora italiana
  if (da) q = q.gte('quando', `${da}T00:00:00${offsetRoma(da)}`);
  if (a) q = q.lte('quando', `${a}T23:59:59${offsetRoma(a)}`);

  const [{ data: eventi, error }, { data: maestri }, { data: operatori }] = await Promise.all([
    q,
    supabase.from('maestri').select('id, nome, cognome').order('cognome'),
    supabase.from('profili').select('id, nome_visualizzato, ruolo').in('ruolo', ['admin', 'segreteria']).order('nome_visualizzato'),
  ]);

  const nomi = Object.fromEntries((maestri || []).map((m) => [m.id, `${m.cognome} ${m.nome}`]));
  const nomeMaestro = (id) => nomi[id] || 'maestro eliminato';

  return (
    <>
      <h1>Registro</h1>
      <p className="tenue">Chi ha creato, modificato o eliminato ogni operazione, e quando. Il registro non si può modificare.</p>

      <form className="pannello filtri" method="get">
        <label className="campo-form">
          <span>Operatore</span>
          <select name="utente" defaultValue={utente}>
            <option value="">Tutti</option>
            {(operatori || []).map((o) => (
              <option key={o.id} value={o.id}>{o.nome_visualizzato}</option>
            ))}
          </select>
        </label>
        <label className="campo-form">
          <span>Azione</span>
          <select name="azione" defaultValue={azione}>
            <option value="">Tutte</option>
            <option value="creazione">Creazioni</option>
            <option value="modifica">Modifiche</option>
            <option value="eliminazione">Eliminazioni</option>
          </select>
        </label>
        <label className="campo-form">
          <span>Maestro</span>
          <select name="maestro" defaultValue={maestro}>
            <option value="">Tutti</option>
            {(maestri || []).map((m) => (
              <option key={m.id} value={m.id}>{m.cognome} {m.nome}</option>
            ))}
          </select>
        </label>
        <label className="campo-form"><span>Dal</span><input type="date" name="da" defaultValue={da} /></label>
        <label className="campo-form"><span>Al</span><input type="date" name="a" defaultValue={a} /></label>
        <button className="btn secondario" type="submit">Filtra</button>
      </form>

      {error && <p className="esito errore">Errore nel caricamento: {error.message}</p>}

      <section className="pannello">
        {!eventi?.length ? (
          <p className="vuoto">Nessun evento con questi filtri.</p>
        ) : (
          <div className="tabella-wrap">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Operatore</th>
                  <th>Azione</th>
                  <th>Maestro</th>
                  <th>Operazione</th>
                </tr>
              </thead>
              <tbody>
                {eventi.map((e) => {
                  const mov = e.dopo || e.prima;
                  const cambi = e.azione === 'modifica' ? differenze(e.prima, e.dopo, nomeMaestro) : [];
                  return (
                    <tr key={e.id}>
                      <td className="nowrap">{quando(e.quando)}</td>
                      <td>{e.utente_nome || <span className="tenue">Sistema</span>}</td>
                      <td><span className={`badge azione-${e.azione}`}>{NOMI_AZIONE[e.azione]}</span></td>
                      <td>{nomeMaestro(e.maestro_id)}</td>
                      <td>
                        {e.azione === 'eliminazione' ? (
                          descrizioneMovimento(mov)
                        ) : (
                          <Link href={`/admin/movimenti/${e.movimento_id}`}>{descrizioneMovimento(mov)}</Link>
                        )}
                        {' '}
                        <span className={mov.tipo === 'ricarica' ? 'pos' : 'neg'}>
                          {mov.tipo === 'ricarica' ? '+' : '−'}{euro(mov.importo)}
                        </span>
                        {cambi.map((c) => <div key={c} className="nota">{c}</div>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {eventi?.length === 1000 && <p className="aiuto">Mostro solo gli ultimi 1000 eventi: restringi i filtri.</p>}
      </section>
    </>
  );
}
