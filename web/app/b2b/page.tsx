import { LegalPage } from '@/components/legal-page';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dërgo24 për Biznese & E-Commerce | Logjistikë dhe COD në Shqipëri',
  description: 'Zgjidhja ideale e transportit për dyqane online në Shqipëri. Likujdim COD brenda 24 orëve, marrje falas nga magazina dhe tarifa me zbritje.',
};

export default function B2BPage() {
  return (
    <LegalPage
      eyebrow="Partneritete Tregtare"
      title="Dërgo24 për Biznese & Dyqane Online"
      intro="Rritni shitjet dhe kënaqësinë e klientëve tuaj me shërbimin më të shpejtë dhe më të besueshëm të dërgesave në Shqipëri. Likujdim i menjëhershëm i pagesave COD dhe marrje e garantuar çdo ditë."
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Image
          src="/dergo24-b2b.jpg"
          alt="Dorëzim porosie me korrier Dërgo24 në dyqan mode në Tiranë"
          width={1280}
          height={720}
          className="h-80 w-full object-cover"
        />
        <div className="bg-slate-50 p-4 text-xs font-semibold text-slate-600">
          Partneritet i suksesshëm: Dërgo24 lidh dyqanet fizike dhe online me klientët në çdo cep të vendit.
        </div>
      </div>

      <section>
        <h2>Pse Dyqanet Online Zgjedhin Dërgo24?</h2>
        <ul>
          <li><strong>Likujdim i Shpejtë COD:</strong> Paratë e mbledhura në dorëzim (Cash on Delivery) transferohen automatikisht në llogarinë tuaj bankare brenda 24-48 orëve me raportim të detajuar.</li>
          <li><strong>Marrje Falas në Magazinë:</strong> Korrieri ynë vjen çdo ditë në orar fiks te magazina ose dyqani juaj për të tërhequr porositë e ditës.</li>
          <li><strong>Shkallë e Lartë Dorëzimi:</strong> Korrierët tanë kontaktojnë marrësin me telefon dhe ofrojnë deri në 3 tentativa dorëzimi për të minimizuar kthimet e panevojshme.</li>
          <li><strong>Tarifa me Zbritje Volumi:</strong> Sa më shumë pako dërgoni çdo muaj, aq më e ulët bëhet tarifa për dërgesë.</li>
          <li><strong>Platformë Dixhitale & API:</strong> Krijoni dërgesa në bllok (bulk upload) ose integroni platformën tuaj WooCommerce, Shopify ose ERP me API-n tonë.</li>
        </ul>
      </section>

      <section>
        <h2>Paketat e Bashkëpunimit</h2>
        <div className="grid gap-4 sm:grid-cols-3 not-prose">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Starter</p>
            <p className="mt-2 text-2xl font-black text-slate-900">10–50 pako</p>
            <p className="text-xs text-slate-500">në muaj</p>
            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
              <li>✓ Marrje falas në Tiranë</li>
              <li>✓ Likujdim COD 2 herë në javë</li>
              <li>✓ Paneli i klientit online</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-orange-500 bg-orange-50/50 p-6 shadow-md">
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Më e zgjedhura</span>
            <p className="mt-2 text-2xl font-black text-orange-600">50–300 pako</p>
            <p className="text-xs text-slate-500">në muaj</p>
            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-800">
              <li>✓ Zbritje 15% në çdo dërgesë</li>
              <li>✓ Likujdim COD çdo 24-48 orë</li>
              <li>✓ Menaxher i dedikuar llogarie</li>
              <li>✓ Marrje kudo në Shqipëri</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Enterprise</p>
            <p className="mt-2 text-2xl font-black text-slate-900">300+ pako</p>
            <p className="text-xs text-slate-500">në muaj</p>
            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
              <li>✓ Zbritje maksimale deri 30%</li>
              <li>✓ Integrim i personalizuar me API</li>
              <li>✓ Prioritet absolut në dërgim</li>
              <li>✓ SLA i garantuar me kontratë</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Si të Filloni?</h2>
        <p>
          Plotësoni të dhënat tuaja të biznesit duke na kontaktuar në <a href="mailto:biznes@dergo24.com">biznes@dergo24.com</a> ose telefononi drejtpërdrejt departamentin tonë komercial në <a href="tel:+355692424024">+355 69 24 24 024</a>. Kontrata aktivizohet brenda ditës!
        </p>
        <p>
          Mund të krijoni llogari të menjëhershme në <Link href="/account">Portalin e Klientit</Link> ose të filloni me një dërgesë prove nga <Link href="/">Faqja Kryesore</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
