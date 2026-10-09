'use client';
import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';

// Form che chiama una server action e mostra l'esito sotto i campi
export default function AzioneForm({ action, children, className = '', svuotaDopo = false }) {
  const [stato, formAction] = useFormState(action, null);
  const ref = useRef(null);

  useEffect(() => {
    if (stato?.ok && svuotaDopo) ref.current?.reset();
  }, [stato, svuotaDopo]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {stato?.errore && <p className="esito errore" role="alert">{stato.errore}</p>}
      {stato?.ok && stato.messaggio && <p className="esito ok" role="status">{stato.messaggio}</p>}
    </form>
  );
}
