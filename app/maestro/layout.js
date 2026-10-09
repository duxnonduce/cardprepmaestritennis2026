import Testata from '@/components/Testata';
import { richiediRuolo } from '@/lib/auth';

export default async function LayoutMaestro({ children }) {
  const { profilo } = await richiediRuolo(['maestro']);
  return (
    <>
      <Testata profilo={profilo} />
      <main className="pagina stretta">{children}</main>
    </>
  );
}
