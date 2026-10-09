import { redirect } from 'next/navigation';
import { homePer, richiediRuolo } from '@/lib/auth';

export default async function Home() {
  const { profilo } = await richiediRuolo(['admin', 'segreteria', 'maestro']);
  redirect(homePer(profilo.ruolo));
}
