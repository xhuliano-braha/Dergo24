import { LegalPage } from '@/components/legal-page';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rreth Nesh | Dërgo24 - Logjistikë dhe Korrier në Shqipëri',
  description: 'Mësoni më shumë rreth misionit, historisë dhe standardeve të shërbimit të Dërgo24 në të gjithë territorin e Shqipërisë.',
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="Njihuni me ne"
      title="Rreth Dërgo24"
      intro="Dërgo24 është kompania lider shqiptare e shërbimeve postare dhe logjistike ekspres, e ndërtuar për t'i dhënë individëve dhe bizneseve shpejtësi, transparencë dhe siguri maksimale në çdo dërgesë."
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Image
          src="/dergo24-fleet.jpg"
          alt="Flota e Dërgo24 para Terminalit Qendror Logjistik në Tiranë"
          width={1280}
          height={720}
          className="h-72 w-full object-cover"
        />
        <div className="bg-slate-50 p-4 text-xs font-semibold text-slate-600">
          Terminali Qendror Logjistik Dërgo24, Tiranë — Flota moderne e shpërndarjes kombëtare.
        </div>
      </div>

      <section>
        <h2>Misioni Ynë</h2>
        <p>
          Misioni i Dërgo24 është të revolucionarizojë logjistikën shqiptare duke ofruar një përvojë pa fërkime: nga porosia online me 2 klikime, te marrja derë më derë në orar të saktë, dhe deri te dorëzimi i shpejtë në 61 bashki të Shqipërisë me gjurmim dixhital në kohë reale.
        </p>
      </section>

      <section>
        <h2>Vlerat Thelbësore</h2>
        <ul>
          <li><strong>Përpikmëri dhe Shpejtësi:</strong> 99.4% e dërgesave tona dorëzohen brenda afateve të premtuara (brenda ditës në Tiranë dhe 24-48 orë në çdo qytet tjetër).</li>
          <li><strong>Siguri & Kujdes:</strong> Çdo pako trajtohet me kujdesin më të lartë me sistem skanimi me barkod në çdo nyje logjistike.</li>
          <li><strong>Transparencë Financiare:</strong> Shërbimi COD (Cash on Delivery) likujdohet në mënyrë të automatizuar dhe të shpejtë për të gjithë partnerët tanë tregtarë.</li>
          <li><strong>Teknologji e Avancuar:</strong> Platformë dixhitale moderne, API për integrim me e-commerce, dhe njoftime të menjëhershme.</li>
        </ul>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Image
          src="/dergo24-hub.jpg"
          alt="Qendra automatike e sortimit të pakove Dërgo24"
          width={1280}
          height={720}
          className="h-72 w-full object-cover"
        />
        <div className="bg-slate-50 p-4 text-xs font-semibold text-slate-600">
          Qendra e automatizuar e skanimit dhe trajtimit të dërgesave.
        </div>
      </div>

      <section>
        <h2>Infrastruktura dhe Flota</h2>
        <p>
          Dërgo24 disponon një flotë të zgjeruar furgonësh modernë dhe automjetesh elektrike për shpërndarje urbane, të pajisura me GPS telematikë. Terminali ynë qendror pranë Casa Italia në Tiranë shërben si qendër kryesore operacionale nga ku koordinohet shpërndarja derë më derë në të 61 bashkitë e Shqipërisë.
        </p>
      </section>

      <section>
        <h2>Partneritet me Bizneset</h2>
        <p>
          Ne jemi mbështetësi kryesor i dhjetëra dyqaneve online, tregtarëve në Instagram/TikTok dhe kompanive distribuuese në Shqipëri. Zbuloni më shumë në faqen tonë <Link href="/b2b">Dërgo24 për Biznese</Link> ose llogarisni tarifat në <Link href="/tarifat">Tabelën e Tarifave</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
