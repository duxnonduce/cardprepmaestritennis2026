'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { accedi } from './actions';

function Entra() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn primario grande" disabled={pending}>
      {pending ? 'Accesso…' : 'Entra'}
    </button>
  );
}

export default function LoginForm({ erroreIniziale }) {
  const [stato, azione] = useFormState(accedi, null);
  const errore = stato?.errore || erroreIniziale;
  return (
    <form action={azione} className="accesso-form">
      <label className="campo-form">
        <span>Username</span>
        <input name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" required />
      </label>
      <label className="campo-form">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {errore && <p className="esito errore" role="alert">{errore}</p>}
      <Entra />
    </form>
  );
}
