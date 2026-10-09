import ElencoSaldi from '@/components/ElencoSaldi';
import OperazioneForm from '@/components/OperazioneForm';
import { getSessione } from '@/lib/auth';
import { descrizioneMovimento, euro, oggiRoma } from '@/lib/format';

export const dynamic = 'force-dynamic';

const oraRegistrazione = (ts) =>
  new Intl.DateTimeFormat('it-IT', { timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(ts));

export default async function Cassa({ searchParams }) {
  const { supabase } = await getSessione();
  const oggi = oggiRoma();

  const [{ data: saldi }, { data: campi }, { data: tariffe }, { data: diOggi }] = await Promise.all([
    supabase.from('saldi').select('*').eq('attivo', true).order('cognome').order('nome'),
    supabase.from('campi').select('*').order('ordine').order('numero'),
    supabase.from('tariffe').select('*').order('ordine'),
    supabase
      .from('movimenti')
      .select('*, maestri(nome, cognome), autore:profili!movimenti_creato_da_fkey(nome_visualizzato)')
      .eq('data', oggi)
      .order('creato_il', { ascending: false }),
  ]);

  return (
    <>
      <h1>Cassa</h1>
      <div className="due-colonne">
        <OperazioneForm
          maestri={saldi || []}
          campi={campi || []}
          tariffe={tariffe || []}
          oggi={oggi}
          maestroIniziale={searchParams?.maestro || ''}
        />
        <ElencoSaldi saldi={saldi || []} />
      </div>

      <section className="pannello">
        <h2>Operazioni con data di oggi</h2>
        {!diOggi?.length ? (
          <p className="vuoto">Ancora nessuna operazione per oggi.</p>
        ) : (
          <div className="tabella-wrap">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Maestro</th>
                  <th>Operazione</th>
                  <th className="num">Importo</th>
                  <th>Operatore</th>
                  <th>Ora</th>
                </tr>
              </thead>
              <tbody>
                {diOggi.map((m) => (
                  <tr key={m.id}>
                    <td>{m.maestri?.cognome} {m.maestri?.nome}</td>
                    <td>{descrizioneMovimento(m)}</td>
                    <td className={`num nowrap ${m.tipo === 'ricarica' ? 'pos' : 'neg'}`}>
                      {m.tipo === 'ricarica' ? '+' : '−'}{euro(m.importo)}
                    </td>
                    <td>{m.autore?.nome_visualizzato || ''}</td>
                    <td className="nowrap">{oraRegistrazione(m.creato_il)}</td>
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
