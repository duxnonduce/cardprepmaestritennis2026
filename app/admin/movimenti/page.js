import Link from 'next/link';
import { getSessione } from '@/lib/auth';
import { dataIt, descrizioneMovimento, euro, oggiRoma } from '@/lib/format';

export const dynamic = 'force-dynamic';

function riepilogoOperatori(righe) {
  const mappa = new Map();
  for (const m of righe) {
    const chiave = m.creato_da || 'nessuno';
    if (!mappa.has(chiave)) {
      mappa.set(chiave, {
        id: m.creato_da,
        nome: m.autore?.nome_visualizzato || 'Non indicato',
        nRicariche: 0, contanti: 0, pos: 0, altro: 0,
        nAddebiti: 0, scalato: 0,
      });
    }
    const r = mappa.get(chiave);
    const importo = Number(m.importo);
    if (m.tipo === 'ricarica') {
      r.nRicariche += 1;
      if (m.metodo === 'contanti') r.contanti += importo;
      else if (m.metodo === 'pos') r.pos += importo;
      else r.altro += importo;
    } else {
      r.nAddebiti += 1;
      r.scalato += importo;
    }
  }
  return [...mappa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

export default async function Movimenti({ searchParams }) {
  const { supabase } = await getSessione();
  const sp = searchParams || {};
  const da = sp.da ?? `${oggiRoma().slice(0, 8)}01`;
  const a = sp.a ?? '';
  const maestro = sp.maestro ?? '';
  const tipo = sp.tipo ?? '';
  const operatore = sp.operatore ?? '';

  let q = supabase
    .from('movimenti')
    .select('*, maestri(nome, cognome), autore:profili!movimenti_creato_da_fkey(nome_visualizzato), modificatore:profili!movimenti_modificato_da_fkey(nome_visualizzato)')
    .order('data', { ascending: false })
    .order('creato_il', { ascending: false })
    .limit(1000);
  if (maestro) q = q.eq('maestro_id', maestro);
  if (tipo) q = q.eq('tipo', tipo);
  if (operatore) q = q.eq('creato_da', operatore);
  if (da) q = q.gte('data', da);
  if (a) q = q.lte('data', a);

  const [{ data: movimenti, error }, { data: maestri }, { data: operatori }] = await Promise.all([
    q,
    supabase.from('maestri').select('id, nome, cognome').order('cognome'),
    supabase.from('profili').select('id, nome_visualizzato, ruolo').in('ruolo', ['admin', 'segreteria']).order('nome_visualizzato'),
  ]);

  const righe = movimenti || [];
  const ricariche = righe.filter((m) => m.tipo === 'ricarica').reduce((t, m) => t + Number(m.importo), 0);
  const addebiti = righe.filter((m) => m.tipo === 'addebito').reduce((t, m) => t + Number(m.importo), 0);
  const perOperatore = riepilogoOperatori(righe);

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
          <span>Registrata da</span>
          <select name="operatore" defaultValue={operatore}>
            <option value="">Tutti</option>
            {(operatori || []).map((o) => (
              <option key={o.id} value={o.id}>{o.nome_visualizzato}</option>
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

      {perOperatore.length > 0 && (
        <section className="pannello">
          <h2>Per operatore</h2>
          <p className="aiuto">Quanto ha registrato ciascuno nel periodo filtrato: utile per far quadrare la cassa a fine turno.</p>
          <div className="tabella-wrap">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Operatore</th>
                  <th className="num">Ricariche</th>
                  <th className="num">Contanti</th>
                  <th className="num">POS</th>
                  <th className="num">Bonifico/altro</th>
                  <th className="num">Addebiti</th>
                  <th className="num">Scalato</th>
                </tr>
              </thead>
              <tbody>
                {perOperatore.map((r) => (
                  <tr key={r.id || 'nessuno'}>
                    <td>{r.nome}</td>
                    <td className="num">{r.nRicariche}</td>
                    <td className="num nowrap">{euro(r.contanti)}</td>
                    <td className="num nowrap">{euro(r.pos)}</td>
                    <td className="num nowrap">{euro(r.altro)}</td>
                    <td className="num">{r.nAddebiti}</td>
                    <td className="num nowrap">{euro(r.scalato)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                    </td>
                    <td className={`num nowrap ${m.tipo === 'ricarica' ? 'pos' : 'neg'}`}>
                      {m.tipo === 'ricarica' ? '+' : '−'}{euro(m.importo)}
                    </td>
                    <td>
                      {m.autore?.nome_visualizzato || <span className="tenue">Non indicato</span>}
                      {m.modificato_il && <div className="nota">modificata da {m.modificatore?.nome_visualizzato || 'admin'}</div>}
                    </td>
                    <td><Link href={`/admin/movimenti/${m.id}`}>Dettagli</Link></td>
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
