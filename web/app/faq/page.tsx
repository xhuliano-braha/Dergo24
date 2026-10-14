import { LegalPage } from '@/components/legal-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pyetje të Shpeshta (FAQ) | Dërgo24 - Ndihmë dhe Përgjigje',
  description: 'Gjeni përgjigje për pyetjet më të shpeshta mbi dërgimin e pakove, pagesat në dorëzim (COD), kohën e mbërritjes dhe gjurmimin online.',
};

export default function FAQPage() {
  const faqs = [
    {
      q: 'Sa kushton dërgimi i një pakoje?',
      a: 'Çmimi bazë brenda qytetit të Tiranës është vetëm 200 Lekë për pako deri në 2 kg. Dërgesat midis Tiranës dhe të gjitha rretheve të Shqipërisë (ose midis rretheve) kushtojnë 300 Lekë. Për çdo kg shtesë mbi 2 kg aplikohet vetëm +50 Lekë/kg.',
    },
    {
      q: 'Sa kohë zgjat mbërritja e pakos?',
      a: 'Për dërgesat brenda Tiranës dorëzimi bëhet brenda ditës ose maksimalisht 24 orë. Për qytetet e tjera në të gjithë Shqipërinë dorëzimi realizohet brenda 24 deri në 48 orë.',
    },
    {
      q: 'Si funksionon shërbimi i Pagesës në Dorëzim (COD)?',
      a: 'Nëse jeni shitës ose dyqan online, korrieri ynë merr paratë në dorëzim nga blerësi (cash) dhe ato transferohen automatikisht në llogarinë tuaj bankare brenda 24-48 orëve me faturë dhe raportim të qartë.',
    },
    {
      q: 'A duhet ta çoj unë pakon diku, apo vjen korrieri te dera ime?',
      a: 'Korrieri vjen direkt në adresën tuaj (shtëpi, zyrë, magazinë ose dyqan) për ta tërhequr pakon falas. Gjithashtu, nëse dëshironi, mund ta dorëzoni ose ta tërhiqni vetë në një nga Pikat Dërgo24.',
    },
    {
      q: 'Si mund ta gjurmoj pakon time në kohë reale?',
      a: 'Menjëherë pas rezervimit merrni një kod unik gjurmimi (p.sh. D24-26-AB12CD34). Mjafton ta vendosni te fusha "Gjurmo dërgesën" në faqen kryesore për të parë vendndodhjen, statusin dhe historikun e plotë të dërgesës suaj.',
    },
    {
      q: 'Çfarë ndodh nëse marrësi nuk është në adresë gjatë tentativës së parë?',
      a: 'Korrieri e telefonon gjithmonë marrësin para mbërritjes. Nëse marrësi nuk përgjigjet ose nuk është i disponueshëm, bëhet një tentativë e dytë dhe e tretë në orar të dakordësuar, ose pakoja ruhet në pikën më të afërt Dergo24.',
    },
    {
      q: 'A dërgoni mobilje, sende të mëdha apo ngarkesa të brishta?',
      a: 'Po! Përveç pakove të vogla, ne ofrojmë transport të dedikuar për mobilje, elektroshtëpiake dhe ngarkesa biznesi. Mjafton të klikoni "Kërko ofertë transporti" dhe stafi ynë përgatit ofertën e personalizuar brenda pak minutash.',
    },
  ];

  return (
    <LegalPage
      eyebrow="Qendra e Ndihmës"
      title="Pyetje të Shpeshta (FAQ)"
      intro="Këtu gjeni përgjigjet e detajuara për të gjitha pyetjet më të zakonshme rreth rezervimit, tarifave, mënyrave të pagesës dhe shpërndarjes në Shqipëri."
    >
      <div className="space-y-6 not-prose">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">{faq.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.a}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2>Keni pyetje të tjera?</h2>
        <p>
          Ekipi ynë i shërbimit të klientit është në dispozicionin tuaj çdo ditë nga ora 08:00 deri në 20:00. Na telefononi në <a href="tel:+355692424024">+355 69 24 24 024</a> ose na shkruani në <a href="mailto:info@dergo24.com">info@dergo24.com</a>.
        </p>
      </section>
    </LegalPage>
  );
}
