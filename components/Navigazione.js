'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigazione({ voci }) {
  const percorso = usePathname();
  if (!voci.length) return null;
  return (
    <nav className="nav" aria-label="Sezioni">
      {voci.map(([href, etichetta]) => {
        const attiva = percorso === href || percorso.startsWith(href + '/');
        return (
          <Link key={href} href={href} className={attiva ? 'attiva' : ''} aria-current={attiva ? 'page' : undefined}>
            {etichetta}
          </Link>
        );
      })}
    </nav>
  );
}
