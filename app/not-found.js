import Link from 'next/link';

export default function NonTrovato() {
  return (
    <main className="pagina stretta">
      <h1>Pagina non trovata</h1>
      <p>Il maestro, l&apos;utenza o l&apos;operazione che cerchi non esiste più.</p>
      <Link className="btn primario" href="/">Torna all&apos;inizio</Link>
    </main>
  );
}
