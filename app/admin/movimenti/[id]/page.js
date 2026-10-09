import Link from 'next/link';
import { notFound } from 'next/navigation';
import AzioneForm from '@/components/AzioneForm';
import Pulsante from '@/components/Pulsante';
import { getSessione } from '@/lib/auth';
import { decimaleIt, ora } from '@/lib/format';
import { differenze, NOMI_AZIONE, quando as quandoReg } from '@/lib/registro';
import { aggiornaMovimento, eliminaMovimento } from '../../actions';

export const dynamic = 'force-dynamic';

const quando = (ts) =>
  new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(ts));

export default async function Movimento({ params }) {
  const { supabase } = await getSessione();
  const [{ data: m }, { data: maestri }, { data: campi }, { data: eventi }] = await Promise.all([
    supabase
      .from('movimenti')
      .select('*, autore:profili!movimenti_creato_da_fkey(nome_visualizzato), modificatore:profili!movimenti_modificato_da_fkey(nome_visualizzato)')
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('maestri').select('id, nome, cognome').order('cognome'),
    supabase.from('campi').select('numero').order('ordine').order('numero'),
    supabase.from('registro').select('*').eq('movimento_id', params.id).order('quando'),
  ]);
  if (!m) notFound();
  const nomi = Object.fromEntries((maestri || []).map((x) => [x.id, `${x.cognome} ${x.nome}`]));

  return (
    <>
      <p className="briciole"><Link href="/admin/movimenti">Movimenti</Link></p>
      <h1>Operazione</h1>
      <p className="tenue">
        Registrata il {quando(m.creato_il)}{m.autore ? ` da ${m.autore.nome_visualizzato}` : ''}
        {m.modificato_il && `. Ultima modifica il ${quando(m.modificato_il)}${m.modificatore ? ` da ${m.modificatore.nome_visualizzato}` : ''}`}.
      </p>

      <section className="pannello stretta">
        <AzioneForm action={aggiornaMovimento} className="pila">
          <input type="hidden" name="id" value={m.id} />
          <div className="griglia">
            <label className="campo-form">
              <span>Tipo</span>
              <select name="tipo" defaultValue={m.tipo}>
                <option value="addebito">Addebito (scala)</option>
                <option value="ricarica">Ricarica (carica)</option>
              </select>
            </label>
            <label className="campo-form">
              <span>Maestro</span>
              <select name="maestro_id" defaultValue={m.maestro_id}>
                {(maestri || []).map((x) => (
                  <option key={x.id} value={x.id}>{x.cognome} {x.nome}</option>
                ))}
              </select>
            </label>
            <label className="campo-form"><span>Data</span><input type="date" name="data" defaultValue={m.data} required /></label>
            <label className="campo-form"><span>Importo (€)</span><input name="importo" inputMode="decimal" defaultValue={decimaleIt(m.importo)} required /></label>
          </div>

          <fieldset className="riquadro">
            <legend>Solo per gli addebiti</legend>
            <div className="griglia">
              <label className="campo-form">
                <span>Campo</span>
                <input name="campo" defaultValue={m.campo || ''} list="elenco-campi" />
                <datalist id="elenco-campi">
                  {(campi || []).map((c) => <option key={c.numero} value={c.numero} />)}
                </datalist>
              </label>
              <label className="campo-form">
                <span>Copertura</span>
                <select name="ambiente" defaultValue={m.ambiente || 'esterno'}>
                  <option value="esterno">Scoperto</option>
                  <option value="interno">Coperto</option>
                </select>
              </label>
              <label className="campo-form"><span>Dalle</span><input type="time" name="ora_inizio" defaultValue={ora(m.ora_inizio)} /></label>
              <label className="campo-form"><span>Alle</span><input type="time" name="ora_fine" defaultValue={ora(m.ora_fine)} /></label>
            </div>
          </fieldset>

          <fieldset className="riquadro">
            <legend>Solo per le ricariche</legend>
            <label className="campo-form">
              <span>Pagato con</span>
              <select name="metodo" defaultValue={m.metodo || 'contanti'}>
                <option value="contanti">Contanti</option>
                <option value="pos">POS</option>
                <option value="bonifico">Bonifico</option>
                <option value="altro">Altro</option>
              </select>
            </label>
          </fieldset>

          <label className="campo-form"><span>Note</span><input name="note" defaultValue={m.note || ''} maxLength={200} /></label>
          <Pulsante>Salva modifiche</Pulsante>
        </AzioneForm>
      </section>

      <section className="pannello stretta">
        <h2>Cronologia</h2>
        {!eventi?.length ? (
          <p className="vuoto">Nessun evento registrato.</p>
        ) : (
          <ol className="cronologia">
            {eventi.map((e) => (
              <li key={e.id}>
                <strong>{NOMI_AZIONE[e.azione]}</strong> da {e.utente_nome || 'sistema'}, {quandoReg(e.quando)}
                {e.azione === 'modifica' &&
                  differenze(e.prima, e.dopo, (id) => nomi[id] || 'maestro eliminato').map((c) => (
                    <div key={c} className="nota">{c}</div>
                  ))}
              </li>
            ))}
          </ol>
        )}
      </section>

      <AzioneForm action={eliminaMovimento} className="zona-pericolo stretta">
        <input type="hidden" name="id" value={m.id} />
        <Pulsante variante="pericolo" conferma="Eliminare questa operazione? Il saldo del maestro verrà ricalcolato." inAttesa="Eliminazione…">
          Elimina operazione
        </Pulsante>
      </AzioneForm>
    </>
  );
}
