import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export const getSessione = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profilo: null };
  const { data: profilo } = await supabase.from('profili').select('*').eq('id', user.id).maybeSingle();
  return { supabase, user, profilo: profilo?.attivo ? profilo : null };
});

export async function richiediRuolo(ruoli) {
  const s = await getSessione();
  if (!s.user) redirect('/login');
  if (!s.profilo) redirect('/esci?motivo=profilo');
  if (!ruoli.includes(s.profilo.ruolo)) redirect(homePer(s.profilo.ruolo));
  return s;
}

export function homePer(ruolo) {
  return ruolo === 'maestro' ? '/maestro' : '/segreteria';
}

export const NOMI_RUOLO = { admin: 'Amministratore', segreteria: 'Segreteria', maestro: 'Maestro' };
