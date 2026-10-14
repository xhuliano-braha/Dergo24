import { LegalPage } from '@/components/legal-page';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pika Qendrore — Casa Italia | Dërgo24 Shqipëri',
  description:
    'Adresa, oraret dhe numri i kontaktit të Terminalit Qendror Dërgo24 pranë Casa Italia, Tiranë. Shërbim korrieri derë më derë në 61 bashkitë e Shqipërisë.',
};

export default function PikatPage() {
  const hub = {
    city: 'Tiranë',
    title: 'Terminali Qendror (HQ & Qendra Operacionale)',
    address: 'Rruga Mikel Maruli, pranë Casa Italia, Tiranë',
    hours: 'E Hënë – E Shtunë: 08:00 – 20:00 · E Diel: 09:00 – 15:00',
    phone: '+355 69 801 2388',
    services: [
      'Tërheqje & Dorëzim Pakosh',
      'Drop-off E-Commerce',
      'Pagesa me Kartë / CASH',
      'Magazinim & Sortim',
      'Paketim i Sigurt',
      'Shërbim Express 24h',
    ],
    mapsUrl: 'https://maps.google.com/?q=Casa+Italia,+Tirana,+Albania',
  };

  return (
    <LegalPage
      eyebrow="Qendra Operacionale"
      title="Terminali Qendror — Casa Italia, Tiranë"
      intro="Pika jonë kryesore fizike e shërbimit dhe terminali logjistik operon pranë Casa Italia në Tiranë. Nga ky terminal, flota jonë mbulon me shërbim korrieri derë më derë çdo cep të Shqipërisë në 61 bashki."
    >
      <div className="not-prose">
        <div className="rounded-3xl border-2 border-orange-500/30 bg-white p-7 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                <span className="size-2 rounded-full bg-orange-500" />
                Pika Jonë Fizike (HQ)
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                Hapur sot deri në 20:00
              </span>
            </div>
            <a
              href={hub.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-600 transition shadow"
            >
              Merr Udhëzimet në Hartë ↗
            </a>
          </div>

          <h3 className="mt-4 text-2xl font-black text-slate-900">{hub.title}</h3>
          <p className="mt-1 text-base font-semibold text-slate-700">📍 {hub.address}</p>

          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-2 border border-slate-100">
            <p>
              🕒 <strong>Orari:</strong> {hub.hours}
            </p>
            <p>
              📞 <strong>Telefon:</strong>{' '}
              <a
                href={`tel:${hub.phone}`}
                className="font-bold text-orange-600 hover:underline"
              >
                {hub.phone} (069 801 2388)
              </a>
            </p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Shërbimet e ofruara në pikë:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hub.services.map((srv, sIdx) => (
                <span
                  key={sIdx}
                  className="rounded-lg bg-orange-50 border border-orange-200/80 px-2.5 py-1 text-xs font-semibold text-orange-900"
                >
                  {srv}
                </span>
              ))}
            </div>
          </div>

          {/* Map Frame */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 min-h-[360px] bg-slate-100">
            <iframe
              src="https://maps.google.com/maps?q=Casa+Italia,+Tirana,+Albania&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="360"
              className="w-full border-0 min-h-[360px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Harta Casa Italia Tirane"
            />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2>Marrje dhe Dorëzim Derë më Derë në të Gjithë Shqipërinë</h2>
        <p>
          Për momentin kemi 1 pikë fizike shërbimi në Casa Italia, Tiranë. Megjithatë,{' '}
          <strong>nuk keni nevojë të paraqiteni fizikisht në pikë</strong>!
        </p>
        <p>
          Shërbimi ynë i korrierëve operon aktivisht në <strong>61 bashkitë e Shqipërisë</strong>:
          korrieri vjen direkt në adresën tuaj (shtëpi, dyqan apo zyrë) për ta marrë pakon dhe për ta
          dorëzuar në destinacion brenda 24 orëve.
        </p>
        <p>
          Rezervoni menjëherë një dërgesë nga <Link href="/">Faqja Kryesore</Link> ose kontaktoni
          shërbimin e klientit në <a href="tel:+355698012388">+355 69 801 2388</a>.
        </p>
      </section>

      <section className="mt-8">
        <h2>Zgjerimi me Pika të Reja Fizike</h2>
        <p>
          Dërgo24 është në proces zgjerimi të rrjetit të pikave fizike drop-off edhe në qytete të tjera si
          Durrës, Vlorë, Shkodër, Elbasan, Fier dhe Korçë. Qëndroni të informuar në këtë faqe për hapjen
          e pikave të reja!
        </p>
      </section>
    </LegalPage>
  );
}
