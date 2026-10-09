import AzioneForm from '@/components/AzioneForm';
import Pulsante from '@/components/Pulsante';
import { getSessione } from '@/lib/auth';
import { decimaleIt, ora } from '@/lib/format';
import { aggiungiCampo, eliminaCampo, salvaTariffe } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Impostazioni() {
  const { supabase } = await getSessione();
  const [{ data: tariffe }, { data: campi }] = await Promise.all([
    supabase.from('tariffe').select('*').order('ordine'),
    supabase.from('campi').select('*').order('ordine').order('numero'),
  ]);
  const fineFascia = (t) => (ora(t) === '24:00' ? '00:00' : ora(t));

  return (
    <>
      <h1>Campi e tariffe</h1>
      <div className="due-colonne">
        <section className="pannello">
          <h2>Tariffe orarie</h2>
          <p className="aiuto">
            La quota si calcola da sola dagli orari, dividendo i minuti tra le fasce. La segreteria può sempre correggerla.
            Un orario di fine 00:00 vale mezzanotte.
          </p>
          <AzioneForm action={salvaTariffe} className="pila">
            <div className="tabella-wrap">
              <table className="tabella tariffe">
                <thead>
                  <tr><th>Copertura</th><th>Fascia</th><th>Dalle</th><th>Alle</th><th>€ l&apos;ora</th></tr>
                </thead>
                <tbody>
                  {(tariffe || []).map((t) => (
                    <tr key={t.id}>
                      <td>{t.ambiente === 'interno' ? 'Coperto' : 'Scoperto'}<input type="hidden" name="id" value={t.id} /></td>
                      <td>{t.fascia}</td>
                      <td><input type="time" name={`dalle_${t.id}`} defaultValue={ora(t.dalle)} aria-label={`Inizio ${t.fascia}`} /></td>
                      <td><input type="time" name={`alle_${t.id}`} defaultValue={fineFascia(t.alle)} aria-label={`Fine ${t.fascia}`} /></td>
                      <td><input name={`prezzo_${t.id}`} inputMode="decimal" defaultValue={decimaleIt(t.prezzo_orario)} aria-label={`Prezzo ${t.fascia}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pulsante>Salva tariffe</Pulsante>
          </AzioneForm>
        </section>

        <section className="pannello">
          <h2>Campi</h2>
          <p className="aiuto">Scegliendo il campo in cassa, la copertura interno/esterno viene proposta da qui.</p>
          {campi?.length ? (
            <ul className="elenco-campi">
              {campi.map((c) => (
                <li key={c.id}>
                  <span>Campo {c.numero}, {c.ambiente === 'interno' ? 'coperto' : 'scoperto'}</span>
                  <AzioneForm action={eliminaCampo}>
                    <input type="hidden" name="id" value={c.id} />
                    <Pulsante variante="link" conferma={`Rimuovere il campo ${c.numero}?`} inAttesa="…">Rimuovi</Pulsante>
                  </AzioneForm>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vuoto">Nessun campo: in cassa il numero si scriverà a mano.</p>
          )}
          <AzioneForm action={aggiungiCampo} className="pila" svuotaDopo>
            <div className="griglia">
              <label className="campo-form"><span>Numero</span><input name="numero" required /></label>
              <label className="campo-form">
                <span>Copertura abituale</span>
                <select name="ambiente" defaultValue="esterno">
                  <option value="esterno">Scoperto</option>
                  <option value="interno">Coperto</option>
                </select>
              </label>
              <label className="campo-form"><span>Ordine in elenco</span><input name="ordine" inputMode="numeric" defaultValue="0" /></label>
            </div>
            <Pulsante>Aggiungi campo</Pulsante>
          </AzioneForm>
        </section>
      </div>
    </>
  );
}
