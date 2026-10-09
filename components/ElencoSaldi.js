'use client';
import { useState } from 'react';
import Link from 'next/link';
import { euro } from '@/lib/format';

export default function ElencoSaldi({ saldi }) {
  const [cerca, setCerca] = useState('');
  const q = cerca.trim().toLowerCase();
  const filtrati = saldi.filter((s) => `${s.cognome} ${s.nome}`.toLowerCase().includes(q));

  return (
    <section className="pannello">
      <div className="pannello-testa">
        <h2>Crediti maestri</h2>
        <input
          type="search"
          className="cerca"
          placeholder="Cerca maestro"
          aria-label="Cerca maestro"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
        />
      </div>
      {filtrati.length === 0 ? (
        <p className="vuoto">{saldi.length ? 'Nessun maestro con questo nome.' : 'Nessun maestro attivo.'}</p>
      ) : (
        <ul className="elenco-saldi">
          {filtrati.map((s) => (
            <li key={s.maestro_id}>
              <Link href={`/segreteria/maestro/${s.maestro_id}`}>
                <span>{s.cognome} {s.nome}</span>
                <span className={`importo ${Number(s.saldo) < 0 ? 'neg' : ''}`}>{euro(s.saldo)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
