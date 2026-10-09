import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function esci(request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  const url = new URL('/login', request.url);
  const motivo = request.nextUrl.searchParams.get('motivo');
  if (motivo) url.searchParams.set('errore', motivo);
  return NextResponse.redirect(url, { status: 303 });
}

export const GET = esci;
export const POST = esci;
