import { LegalPage } from '@/components/legal-page';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pikat & Qendrat Logjistike | Dërgo24 Shqipëri',
  description: 'Gjeni adresat, oraret dhe numrat e kontaktit të pikave të tërheqjes dhe qendrave logjistike Dërgo24 në Tiranë, Durrës, Vlorë, Shkodër dhe në gjithë Shqipërinë.',
};

export default function PikatPage() {
  const hubs = [
    {
      city: 'Tiranë',
      title: 'Terminali Qendror (HQ & Hub Kombëtar)',
      address: 'Rruga Mikel Maruli, pranë Cassa Italia, Tiranë',
      hours: 'E Hënë – E Shtunë: 08:00 – 20:00 (E Diel: 09:00 – 15:00)',
      phone: '+355 69 24 24 024',
      services: ['Tërheqje & Dorëzim', 'Drop-off Ekspres', 'Pagesa me Kartë/CASH', 'Magazinim', 'Paketim i Sigurt'],
      mapsUrl: 'https://maps.google.com/?q=Rruga+Mikel+Maruli+Tirana+Albania',
    },
    {
      city: 'Durrës',
      title: 'Pika Qendrore Portuale',
      address: 'Bulevardi Dyrrah & Rruga Pavarësia, Durrës',
      hours: 'E Hënë – E Shtunë: 08:30 – 19:30',
      phone: '+355 69 24 24 025',
      services: ['Tërheqje Pakosh', 'Dorëzim Dyqanesh', 'Pagesa COD'],
      mapsUrl: 'https://maps.google.com/?q=Durres+Albania',
    },
    {
      city: 'Vlorë',
      title: 'Hub Rajonal Jugor',
      address: 'Bulevardi Ismail Qemali, pranë Sheshit të Flamurit, Vlorë',
      hours: 'E Hënë – E Shtunë: 08:30 – 19:00',
      phone: '+355 69 24 24 026',
      services: ['Shpërndarje Rajonale', 'Tërheqje Pakosh', 'Pagesa COD'],
      mapsUrl: 'https://maps.google.com/?q=Vlore+Albania',
    },
    {
      city: 'Shkodër',
      title: 'Hub Rajonal Verior',
      address: 'Rruga 13 Dhjetori, Pedonale, Shkodër',
      hours: 'E Hënë – E Shtunë: 08:30 – 19:00',
      phone: '+355 69 24 24 027',
      services: ['Shpërndarje Rajonale', 'Tërheqje Pakosh', 'Pagesa COD'],
      mapsUrl: 'https://maps.google.com/?q=Shkoder+Albania',
    },
    {
      city: 'Elbasan',
      title: 'Pika Tregtare Elbasan',
      address: 'Bulevardi Qemal Stafa, Qendër, Elbasan',
      hours: 'E Hënë – E Shtunë: 08:30 – 18:30',
      phone: '+355 69 24 24 028',
      services: ['Tërheqje Pakosh', 'Dorëzim Ekspres'],
      mapsUrl: 'https://maps.google.com/?q=Elbasan+Albania',
    },
    {
      city: 'Fier',
      title: 'Pika Rajonale Fier',
      address: 'Rruga Kastriot Muho, Fier',
      hours: 'E Hënë – E Shtunë: 08:30 – 19:00',
      phone: '+355 69 24 24 029',
      services: ['Tërheqje Pakosh', 'Pagesa COD'],
      mapsUrl: 'https://maps.google.com/?q=Fier+Albania',
    },
    {
      city: 'Korçë',
      title: 'Pika Rajonale Korçë',
      address: 'Bulevardi Fan Noli, Korçë',
      hours: 'E Hënë – E Shtunë: 08:30 – 18:00',
      phone: '+355 69 24 24 030',
      services: ['Tërheqje Pakosh', 'Dorëzim Ekspres'],
      mapsUrl: 'https://maps.google.com/?q=Korce+Albania',
    },
  ];

  return (
    <LegalPage
      eyebrow="Rrjeti Kombëtar"
      title="Pikat dhe Qendrat Logjistike"
      intro="Dërgo24 operon përmes një rrjeti pikash moderne dhe qendrash logjistike të shpërndara në pikat strategjike të Shqipërisë, me orare fleksibël dhe staf të kualifikuar."
    >
      <div className="grid gap-6 not-prose">
        {hubs.map((hub, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                <span className="size-2 rounded-full bg-orange-500" />
                {hub.city}
              </span>
              <a
                href={hub.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-500 hover:text-white transition-colors"
              >
                Hap në Hartë ↗
              </a>
            </div>

            <h3 className="mt-3 text-xl font-black text-slate-900">{hub.title}</h3>
            <p className="mt-1 text-sm font-medium text-slate-600">📍 {hub.address}</p>

            <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <p>🕒 <strong>Orari:</strong> {hub.hours}</p>
              <p>📞 <strong>Telefon:</strong> <a href={`tel:${hub.phone}`} className="font-bold text-orange-600">{hub.phone}</a></p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-slate-50">
              {hub.services.map((srv, sIdx) => (
                <span key={sIdx} className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {srv}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2>Dëshironi marrje direkt në shtëpi apo zyrë?</h2>
        <p>
          Nuk keni nevojë të shkoni te pika fizike! Korrierët tanë vijnë direkt te dera juaj. Rezervoni menjëherë një dërgesë nga <Link href="/">Faqja Kryesore</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
