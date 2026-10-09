'use client';
import { useEffect, useRef, useState } from 'react';

function Logo({ src, nome }) {
  const ref = useRef(null);
  const [ok, setOk] = useState(true);

  // Se l'immagine non esiste (o fallisce prima dell'idratazione) mostra il nome
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setOk(false);
  }, []);

  if (!ok) return <span className="logo-testo">{nome}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={nome} className="logo-img" onError={() => setOk(false)} />;
}

export default function Loghi({ grandi = false }) {
  return (
    <span className={`loghi ${grandi ? 'grandi' : ''}`}>
      <Logo src="/loghi/kickoff.png" nome="KickOff" />
      <span className="loghi-sep" aria-hidden="true" />
      <Logo src="/loghi/micolani.png" nome="Micolani Tennis" />
    </span>
  );
}
