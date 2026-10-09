import { redirect } from 'next/navigation';
import { getSessione, homePer } from '@/lib/auth';
import Loghi from '@/components/Loghi';
import LoginForm from './LoginForm';

const ERRORI = {
  profilo: "Questa utenza è disattivata o non è ancora configurata. Rivolgiti all'amministratore.",
};

export default async function Login({ searchParams }) {
  const { profilo } = await getSessione();
  if (profilo) redirect(homePer(profilo.ruolo));

  return (
    <main className="accesso">
      <div className="accesso-box">
        <div className="accesso-testa">
          <Loghi grandi />
          <h1>Maestri Tennis</h1>
          <p>Credito campi dei maestri</p>
        </div>
        <LoginForm erroreIniziale={ERRORI[searchParams?.errore] || null} />
      </div>
    </main>
  );
}
