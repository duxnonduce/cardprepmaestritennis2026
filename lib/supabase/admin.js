import { createClient } from '@supabase/supabase-js';

// Solo lato server: usa la chiave service role per creare/gestire utenze
export function createAdminClient() {
  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chiave) throw new Error('Manca SUPABASE_SERVICE_ROLE_KEY nelle variabili di Vercel.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, chiave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
