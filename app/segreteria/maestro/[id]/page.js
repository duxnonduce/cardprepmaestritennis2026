import Link from 'next/link';
import { notFound } from 'next/navigation';
import OperazioneForm from '@/components/OperazioneForm';
import Saldo from '@/components/Saldo';
import Storico from '@/components/Storico';
import { getSessione } from '@/lib/auth';
import { oggiRoma } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function SchedaMaestro({ params }) {
  const { supabase, profilo } = await getSessione();

  const [{ data: saldo }, { data: movimenti }, { data: campi }, { data: tariffe }] = await Promise.all([
    supabase.from('saldi').select('*').eq('maestro_id', params.id).maybeSingle(),
    supabase.from('movimenti').select('*, autore:profili!movimenti_creato_da_fkey(nome_visualizzato), modificatore:profili!movimenti_modificato_da_fkey(nome_visualizzato)').eq('maestro_id', params.id),
    supabase.from('campi').select('*').order('ordine').order('numero'),
    supabase.from('tariffe').select('*').order('ordine'),
  ]);
  if (!saldo) notFound();
  const admin = profilo.ruolo === 'admin';

  return (
    <>
      <p className="briciole">
        <Link href="/segreteria">Cassa</Link>
        {admin && <> / <Link href={`/admin/maestri/${params.id}`}>Dati del maestro</Link></>}
      </p>
      <h1>{saldo.cognome} {saldo.nome}{!saldo.attivo && ' (non attivo)'}</h1>
      <div className="due-colonne">
        <div className="colonna">
          <Saldo valore={saldo.saldo} />
          <OperazioneForm
            maestri={[saldo]}
            campi={campi || []}
            tariffe={tariffe || []}
            oggi={oggiRoma()}
            maestroIniziale={saldo.maestro_id}
            bloccaMaestro
          />
        </div>
        <section className="pannello">
          <h2>Storico operazioni</h2>
          <Storico movimenti={movimenti || []} modificabile={admin} mostraOperatore />
        </section>
      </div>
    </>
  );
}
