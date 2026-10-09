// Le utenze usano uno username; internamente Supabase vuole un'email,
// quindi ne costruiamo una fittizia che non riceve mai posta.
export const DOMINIO_UTENZE = 'kickoff.local';

export function emailDaUsername(username) {
  const u = String(username || '').trim().toLowerCase();
  return u.includes('@') ? u : `${u}@${DOMINIO_UTENZE}`;
}

export function usernameValido(username) {
  return /^[a-z0-9._-]{3,30}$/.test(username);
}
