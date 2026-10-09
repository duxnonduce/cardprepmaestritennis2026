'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { registraMovimento } from '@/app/segreteria/actions';
import { calcolaQuota, euro, parseImporto } from '@/lib/format';

function Invia({ tipo }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn primario grande" disabled={pending}>
      {pending ? 'Registrazione…' : tipo === 'addebito' ? 'Scala credito' : 'Carica credito'}
    </button>
  );
}

export default function OperazioneForm({ maestri, campi, tariffe, oggi, maestroIniziale = '', bloccaMaestro = false }) {
  const [stato, azione] = useFormState(registraMovimento, null);
  const formRef = useRef(null);
  const [tipo, setTipo] = useState('addebito');
  const [maestroId, setMaestroId] = useState(maestroIniziale);
  const [campo, setCampo] = useState('');
  const [ambiente, setAmbiente] = useState('esterno');
  const [inizio, setInizio] = useState('');
  const [fine, setFine] = useState('');
  const [importo, setImporto] = useState('');
  const [manuale, setManuale] = useState(false);

  const calcolo = useMemo(
    () => calcolaQuota(inizio, fine, ambiente, tariffe || []),
    [inizio, fine, ambiente, tariffe]
  );

  // Calcolo automatico della quota dalle tariffe a fasce (sempre modificabile)
  useEffect(() => {
    if (tipo !== 'addebito' || manuale) return;
    if (calcolo && calcolo.importo > 0) setImporto(calcolo.importo.toFixed(2).replace('.', ','));
  }, [tipo, calcolo, manuale]);

  useEffect(() => {
    if (!stato?.ok) return;
    formRef.current?.reset();
    setCampo('');
    setInizio('');
    setFine('');
    setImporto('');
    setManuale(false);
  }, [stato]);

  function cambiaTipo(nuovo) {
    setTipo(nuovo);
    setImporto('');
    setManuale(false);
  }

  function scegliCampo(valore) {
    setCampo(valore);
    const c = campi.find((x) => x.numero === valore);
    if (c) setAmbiente(c.ambiente);
  }

  const maestro = maestri.find((m) => m.maestro_id === maestroId);
  const importoNum = parseImporto(importo);
  const saldoDopo =
    maestro && importoNum > 0
      ? Number(maestro.saldo) + (tipo === 'addebito' ? -importoNum : importoNum)
      : null;

  return (
    <form ref={formRef} action={azione} className={`pannello operazione tipo-${tipo}`}>
      <div className="interruttore" role="radiogroup" aria-label="Tipo di operazione">
        <button type="button" role="radio" aria-checked={tipo === 'addebito'} onClick={() => cambiaTipo('addebito')}>
          Scala credito
        </button>
        <button type="button" role="radio" aria-checked={tipo === 'ricarica'} onClick={() => cambiaTipo('ricarica')}>
          Carica credito
        </button>
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      {bloccaMaestro ? (
        <input type="hidden" name="maestro_id" value={maestroId} />
      ) : (
        <label className="campo-form">
          <span>Maestro</span>
          <select name="maestro_id" value={maestroId} onChange={(e) => setMaestroId(e.target.value)} required>
            <option value="">Scegli il maestro</option>
            {maestri.map((m) => (
              <option key={m.maestro_id} value={m.maestro_id}>
                {m.cognome} {m.nome} ({euro(m.saldo)})
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="griglia">
        <label className="campo-form">
          <span>Data</span>
          <input type="date" name="data" defaultValue={oggi} required />
        </label>

        {tipo === 'addebito' ? (
          <>
            <label className="campo-form">
              <span>Campo</span>
              {campi.length ? (
                <select name="campo" value={campo} onChange={(e) => scegliCampo(e.target.value)} required>
                  <option value="">Scegli</option>
                  {campi.map((c) => (
                    <option key={c.id} value={c.numero}>Campo {c.numero}</option>
                  ))}
                </select>
              ) : (
                <input name="campo" value={campo} onChange={(e) => setCampo(e.target.value)} inputMode="numeric" placeholder="N." required />
              )}
            </label>

            <fieldset className="campo-form scelta">
              <legend>Copertura</legend>
              <div className="opzioni">
                {['esterno', 'interno'].map((a) => (
                  <label key={a} className={ambiente === a ? 'scelta-attiva' : ''}>
                    <input type="radio" name="ambiente" value={a} checked={ambiente === a} onChange={() => setAmbiente(a)} />
                    {a === 'esterno' ? 'Scoperto' : 'Coperto'}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="campo-form">
              <span>Dalle</span>
              <input type="time" name="ora_inizio" value={inizio} onChange={(e) => setInizio(e.target.value)} step="300" required />
            </label>
            <label className="campo-form">
              <span>Alle</span>
              <input type="time" name="ora_fine" value={fine} onChange={(e) => setFine(e.target.value)} step="300" />
            </label>
          </>
        ) : (
          <label className="campo-form">
            <span>Pagato con</span>
            <select name="metodo" defaultValue="contanti">
              <option value="contanti">Contanti</option>
              <option value="pos">POS</option>
              <option value="bonifico">Bonifico</option>
              <option value="altro">Altro</option>
            </select>
          </label>
        )}

        <label className="campo-form">
          <span>{tipo === 'addebito' ? 'Quota da scalare (€)' : 'Importo caricato (€)'}</span>
          <input
            name="importo"
            inputMode="decimal"
            placeholder="0,00"
            value={importo}
            onChange={(e) => {
              setImporto(e.target.value);
              setManuale(true);
            }}
            required
          />
          {tipo === 'addebito' && calcolo?.righe.length > 0 && (
            <small className="aiuto">
              {calcolo.righe.map((r) => `${r.fascia}: ${r.minuti} min a ${euro(r.prezzo)}/h`).join(', ')}
              {calcolo.fuoriFascia > 0 && `. ${calcolo.fuoriFascia} min fuori fascia non conteggiati`}
              {manuale && (
                <>
                  {' '}
                  <button type="button" className="link" onClick={() => setManuale(false)}>Ricalcola</button>
                </>
              )}
            </small>
          )}
        </label>
      </div>

      <label className="campo-form">
        <span>Note</span>
        <input name="note" maxLength={200} placeholder="Facoltative" />
      </label>

      {saldoDopo !== null && (
        <p className={`anteprima ${saldoDopo < 0 ? 'neg' : ''}`}>
          {maestro.cognome} {maestro.nome} passa da {euro(maestro.saldo)} a <strong>{euro(saldoDopo)}</strong>
          {saldoDopo < 0 && tipo === 'addebito' ? '. Credito insufficiente: il saldo andrà in negativo.' : '.'}
        </p>
      )}
      {stato?.errore && <p className="esito errore" role="alert">{stato.errore}</p>}
      {stato?.ok && <p className="esito ok" role="status">{stato.messaggio}</p>}

      <Invia tipo={tipo} />
    </form>
  );
}
