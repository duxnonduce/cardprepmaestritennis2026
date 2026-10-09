import Saldo from '@/components/Saldo';
import Storico from '@/components/Storico';
import { getSessione } from '@/lib/auth';
import { dataIt, euro } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AreaMaestro() {
  const { supabase, profilo } = await getSessione();

  if (!profilo.maestro_id) {
    return (
      <section className="pannello">
        <h1>Ciao {profilo.nome_visualizzato}</h1>
        <p>La tua utenza non è ancora collegata a una scheda maestro. Chiedi alla segreteria di collegarla.</p>
      </section>
    );
  }

  const [{ data: saldo }, { data: movimenti }] = await Promise.all([
    supabase.from('saldi').select('*').eq('maestro_id', profilo.maestro_id).maybeSingle(),
    supabase.from('movimenti').select('*').eq('maestro_id', profilo.maestro_id),
  ]);

  const ultimaRicarica = (movimenti || [])
    .filter((m) => m.tipo === 'ricarica')
    .sort((a, b) => b.data.localeCompare(a.data) || b.creato_il.localeCompare(a.creato_il))[0];

  return (
    <>
      <h1>Ciao {saldo?.nome || profilo.nome_visualizzato}</h1>
      <Saldo
        valore={saldo?.saldo}
        sotto={ultimaRicarica ? `Ultima ricarica ${euro(ultimaRicarica.importo)} il ${dataIt(ultimaRicarica.data)}` : 'Nessuna ricarica registrata'}
      />
      {Number(saldo?.saldo) < 0 && (
        <p className="avviso">Il saldo è in negativo: passa in segreteria per ricaricare.</p>
      )}
      <section className="pannello">
        <h2>Le tue operazioni</h2>
        <Storico movimenti={movimenti || []} />
      </section>
    </>
  );
}
