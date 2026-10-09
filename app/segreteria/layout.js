import Testata from '@/components/Testata';
import { richiediRuolo } from '@/lib/auth';

export default async function LayoutSegreteria({ children }) {
  const { profilo } = await richiediRuolo(['admin', 'segreteria']);
  return (
    <>
      <Testata profilo={profilo} />
      <main className="pagina">{children}</main>
    </>
  );
}
