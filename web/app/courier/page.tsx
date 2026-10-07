'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function CourierPage() {
  return (
    <main className="brand-night flex min-h-screen flex-col items-center justify-center p-6 text-center text-white">
      <div className="max-w-md rounded-3xl border border-white/10 bg-[#071b38]/85 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <Link
          href="/"
          className="mb-6 inline-block"
          aria-label="Dergo24, faqja kryesore"
        >
          <Image
            src="/dergo24-logo-dark.svg"
            alt="Dërgo24"
            width={180}
            height={40}
            className="mx-auto h-10 w-auto"
          />
        </Link>
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-orange-500/20 text-orange-400">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Paneli i Korrierit nuk është aktiv
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Ky funksionalitet është pezulluar përkohësisht. Për momentin, të gjitha
          veprimet dhe dërgesat menaxhohen direkt nga paneli qendror i stafit.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/staff"
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            Hyr në Panelin e Stafit
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="size-4" /> Kthehu në Faqen Kryesore
          </Link>
        </div>
      </div>
    </main>
  );
}
