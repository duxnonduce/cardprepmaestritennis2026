import Link from 'next/link';
import { dataIt, descrizioneMovimento, euro } from '@/lib/format';

// Mostra lo storico con il saldo progressivo dopo ogni operazione
export default function Storico({ movimenti, modificabile = false, mostraOperatore = false }) {
  if (!movimenti?.length) return <p className="vuoto">Nessuna operazione registrata.</p>;

  const crescente = [...movimenti].sort((a, b) =>
    a.data === b.data ? a.creato_il.localeCompare(b.creato_il) : a.data.localeCompare(b.data)
  );
  let progressivo = 0;
  const righe = crescente
    .map((m) => {
      progressivo += m.tipo === 'ricarica' ? Number(m.importo) : -Number(m.importo);
      return { ...m, progressivo: Math.round(progressivo * 100) / 100 };
    })
    .reverse();

  return (
    <div className="tabella-wrap">
      <table className="tabella">
        <thead>
          <tr>
            <th>Data</th>
            <th>Operazione</th>
            <th className="num">Importo</th>
            <th className="num">Saldo</th>
            {mostraOperatore && <th>Operatore</th>}
            {modificabile && <th><span className="sr">Azioni</span></th>}
          </tr>
        </thead>
        <tbody>
          {righe.map((m) => (
            <tr key={m.id}>
              <td className="nowrap">{dataIt(m.data)}</td>
              <td>
                {descrizioneMovimento(m)}
                {m.note && <div className="nota">{m.note}</div>}
              </td>
              <td className={`num nowrap ${m.tipo === 'ricarica' ? 'pos' : 'neg'}`}>
                {m.tipo === 'ricarica' ? '+' : '−'}{euro(m.importo)}
              </td>
              <td className={`num nowrap ${m.progressivo < 0 ? 'neg' : ''}`}>{euro(m.progressivo)}</td>
              {mostraOperatore && (
                <td>
                  {m.autore?.nome_visualizzato || <span className="tenue">Non indicato</span>}
                  {m.modificato_il && <div className="nota">modificata da {m.modificatore?.nome_visualizzato || 'admin'}</div>}
                </td>
              )}
              {modificabile && (
                <td><Link href={`/admin/movimenti/${m.id}`}>Modifica</Link></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
