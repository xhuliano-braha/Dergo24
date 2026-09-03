import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dergo24 | Dërgesa në gjithë Shqipërinë',
  description: 'Dërgo pako shpejt dhe sigurt në çdo qytet të Shqipërisë. Rezervo marrjen dhe gjurmo dërgesën online.',
  openGraph: { title: 'Dergo24 | Shqipëria në derën tënde', description: 'Transport dhe shpërndarje pakosh në të gjithë Shqipërinë.', images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: 'Dergo24 | Shqipëria në derën tënde', description: 'Transport dhe shpërndarje pakosh në të gjithë Shqipërinë.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sq"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
