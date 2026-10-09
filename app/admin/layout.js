import Testata from '@/components/Testata';
import { richiediRuolo } from '@/lib/auth';

export default async function LayoutAdmin({ children }) {
  const { profilo } = await richiediRuolo(['admin']);
  return (
    <>
      <Testata profilo={profilo} />
      <main className="pagina">{children}</main>
    </>
  );
}
