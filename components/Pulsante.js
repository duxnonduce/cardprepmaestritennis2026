'use client';
import { useFormStatus } from 'react-dom';

export default function Pulsante({ children, variante = 'primario', conferma, inAttesa = 'Salvataggio…' }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn ${variante}`}
      disabled={pending}
      onClick={(e) => {
        if (conferma && !window.confirm(conferma)) e.preventDefault();
      }}
    >
      {pending ? inAttesa : children}
    </button>
  );
}
