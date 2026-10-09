import { Barlow, Barlow_Semi_Condensed } from 'next/font/google';
import './globals.css';

const testo = Barlow({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-testo' });
const titoli = Barlow_Semi_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-titoli' });

export const metadata = {
  title: 'Maestri Tennis',
  description: 'Credito campi dei maestri di KickOff Sport Center e Micolani Tennis',
};

export const viewport = { themeColor: '#1E4D3B' };

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={`${testo.variable} ${titoli.variable}`}>
      <body>{children}</body>
    </html>
  );
}
