import { euro } from '@/lib/format';

export default function Saldo({ valore, titolo = 'Credito residuo', sotto }) {
  const n = Number(valore || 0);
  return (
    <div className={`tabellone ${n < 0 ? 'negativo' : ''}`}>
      <span className="etichetta">{titolo}</span>
      <span className="cifra">{euro(n)}</span>
      {sotto && <span className="sotto">{sotto}</span>}
    </div>
  );
}
