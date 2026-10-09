import Link from 'next/link';
import Navigazione from './Navigazione';

const VOCI = {
  admin: [
    ['/segreteria', 'Cassa'],
    ['/admin/maestri', 'Maestri'],
    ['/admin/movimenti', 'Movimenti'],
    ['/admin/registro', 'Registro'],
    ['/admin/utenti', 'Utenze'],
    ['/admin/impostazioni', 'Campi e tariffe'],
  ],
  segreteria: [['/segreteria', 'Cassa']],
  maestro: [],
};

export default function Testata({ profilo }) {
  return (
    <header className="testata">
      <div className="testata-in">
        <Link href="/" className="marchio">KickOff Crediti</Link>
        <Navigazione voci={VOCI[profilo.ruolo] || []} />
        <div className="utente">
          <span>{profilo.nome_visualizzato}</span>
          <form action="/esci" method="post">
            <button className="link chiaro" type="submit">Esci</button>
          </form>
        </div>
      </div>
    </header>
  );
}
