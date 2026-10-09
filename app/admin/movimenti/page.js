import Link from 'next/link';
import { getSessione } from '@/lib/auth';
import { dataIt, descrizioneMovimento, euro, oggiRoma } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Movimenti({ searchParams }) {
  const { supabase } = await getSessione();
  const sp = searchParams || {};
  const da = sp.da ?? `${oggiRoma().slice(0, 8)}01`;
  const a = sp.a ?? '';
  const maestro = sp.maestro ?? '';
  const tipo = sp.tipo ?? '';

  let q = supabase
    .from('movimenti')
    .select('*, maestri(nome, cognome), autore:profili!movimenti_creato_da_fkey(nome_visualizzato)')
    .order('data', { ascending: false })
    .order('creato_il', { ascending: false })
    .limit(1000);
  if (maestro) q = q.eq('maestro_id', maestro);
  if (tipo) q = q.eq('tipo', tipo);
  if (da) q = q.gte('data', da);
  if (a) q = q.lte('data', a);

  const [{ data: movimenti, error }, { data: maestri }] = await Promise.all([
    q,
    supabase.from('maestri').select('id, nome, cognome').order('cognome'),
  ]);

  const righe = movimenti || [];
  const ricariche = righe.filter((m) => m.tipo === 'ricarica').reduce((t, m) => t + Number(m.importo), 0);
  const addebiti = righe.filter((m) => m.tipo === 'addebito').reduce((t, m) => t + Number(m.importo), 0);

  return (
    <>
      <h1>Movimenti</h1>

      <form className="pannello filtri" method="get">
        <label className="campo-form">
          <span>Maestro</span>
          <select name="maestro" defaultValue={maestro}>
            <option value="">Tutti</option>
            {(maestri || []).map((m) => (
              <option key={m.id} value={m.id}>{m.cognome} {m.nome}</option>
            ))}
          </select>
        </label>
        <label className="campo-form">
          <span>Tipo</span>
          <select name="tipo" defaultValue={tipo}>
            <option value="">Tutti</option>
            <option value="addebito">Addebiti</option>
            <option value="ricarica">Ricariche</option>
          </select>
        </label>
        <label className="campo-form"><span>Dal</span><input type="date" name="da" defaultValue={da} /></label>
        <label className="campo-form"><span>Al</span><input type="date" name="a" defaultValue={a} /></label>
        <button className="btn secondario" type="submit">Filtra</button>
      </form>

      <p className="riepilogo">
        {righe.length} operazioni. Ricariche <strong className="pos">{euro(ricariche)}</strong>, addebiti{' '}
        <strong className="neg">{euro(addebiti)}</strong>
        {righe.length === 1000 && '. Mostro solo le prime 1000: restringi i filtri.'}
      </p>
      {error && <p className="esito errore">Errore nel caricamento: {error.message}</p>}

      <section className="pannello">
        {!righe.length ? (
          <p className="vuoto">Nessuna operazione con questi filtri.</p>
        ) : (
          <div className="tabella-wrap">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Maestro</th>
                  <th>Operazione</th>
                  <th className="num">Importo</th>
                  <th>Registrata da</th>
                  <th><span className="sr">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {righe.map((m) => (
                  <tr key={m.id}>
                    <td className="nowrap">{dataIt(m.data)}</td>
                    <td>{m.maestri?.cognome} {m.maestri?.nome}</td>
                    <td>
                      {descrizioneMovimento(m)}
                      {m.note && <div className="nota">{m.note}</div>}
                      {m.modificato_il && <div className="nota">Modificata</div>}
                    </td>
                    <td className={`num nowrap ${m.tipo === 'ricarica' ? 'pos' : 'neg'}`}>
                      {m.tipo === 'ricarica' ? '+' : '−'}{euro(m.importo)}
                    </td>
                    <td>{m.autore?.nome_visualizzato || ''}</td>
                    <td><Link href={`/admin/movimenti/${m.id}`}>Modifica</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
