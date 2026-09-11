import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="brand-canvas min-h-screen text-[#10233d]">
      <header className="premium-app-header">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5">
          <Link href="/" aria-label="Dergo24, faqja kryesore"><Image src="/dergo24-logo-light.svg" alt="Dergo24" width={180} height={42} className="h-9 w-auto" /></Link>
          <Link href="/" className="rounded-xl bg-[#071b33] px-4 py-2.5 text-sm font-black text-white">Kthehu në faqe</Link>
        </div>
      </header>
      <section className="brand-night brand-night-pattern px-5 py-20 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">{intro}</p>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Versioni 1.0 · Përditësuar më 3 shtator 2026</p>
        </div>
      </section>
      <article className="brand-panel relative mx-auto -mt-7 mb-16 max-w-4xl space-y-8 rounded-[2rem] px-6 py-10 sm:px-10 [&_a]:font-bold [&_a]:text-orange-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-black [&_li]:leading-7 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Këto politika përshkruajnë mënyrën e planifikuar të operimit të Dergo24. Të dhënat ligjore të subjektit, licenca dhe kufijtë financiarë duhet të konfirmohen nga pronari dhe këshilltari ligjor përpara përdorimit komercial.</div>
        {children}
      </article>
      <footer className="bg-[#071b33] px-5 py-10 text-sm text-slate-300">
        <div className="mx-auto flex max-w-4xl flex-col justify-between gap-5 sm:flex-row">
          <p>Dergo24 · Rruga Mikel Maruli, pranë Cassa Italia, Tiranë</p>
          <div className="flex flex-wrap gap-4"><Link href="/terms">Kushtet</Link><Link href="/privacy">Privatësia</Link><Link href="/claims-policy">Ankesat</Link></div>
        </div>
      </footer>
    </main>
  );
}
