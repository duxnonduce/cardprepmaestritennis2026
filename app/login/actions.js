'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { emailDaUsername } from '@/lib/utenti';

export async function accedi(_prec, fd) {
  const username = String(fd.get('username') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  if (!username || !password) return { errore: 'Inserisci username e password.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: emailDaUsername(username), password });
  if (error) return { errore: 'Username o password non corretti.' };
  redirect('/');
}
