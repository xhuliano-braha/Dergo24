import { LegalPage } from '@/components/legal-page';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifat & Çmimet | Dërgo24 - Transport Pakosh në Shqipëri',
  description: 'Zbuloni tarifat transparente të dërgesave në Tiranë dhe në të gjithë Shqipërinë. Çmime fikse pa kosto të fshehura.',
};

export default function PricingPage() {
  return (
    <LegalPage
      eyebrow="Transparencë e plotë"
      title="Tarifat e Transportit"
      intro="Struktura jonë e çmimeve është e thjeshtë, e parashikueshme dhe pa komisione të fshehura. Zgjidhni shërbimin që i përshtatet nevojave tuaja."
    >
      <section>
        <h2>Tabela e Tarifave Standarde</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-700">
              <tr>
                <th className="p-4">Itinerari</th>
                <th className="p-4">Pesha Bazë (deri 2 kg)</th>
                <th className="p-4">Koha e Dorëzimit</th>
                <th className="p-4">Çmimi Bazë</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="p-4 font-bold text-slate-900">Brenda Tiranës</td>
                <td className="p-4">Deri në 2 kg</td>
                <td className="p-4 text-emerald-600 font-bold">24 orë (brenda ditës me Express)</td>
                <td className="p-4 font-black text-orange-600">200 Lekë</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Tiranë ↔ Durrës</td>
                <td className="p-4">Deri në 2 kg</td>
                <td className="p-4 text-emerald-600 font-bold">24 orë</td>
                <td className="p-4 font-black text-orange-600">300 Lekë</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Tiranë ↔ Rrethe (61 Bashki)</td>
                <td className="p-4">Deri në 2 kg</td>
                <td className="p-4 font-bold">24 – 48 orë</td>
                <td className="p-4 font-black text-orange-600">300 Lekë</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Rrethe ↔ Rrethe</td>
                <td className="p-4">Deri në 2 kg</td>
                <td className="p-4 font-bold">24 – 48 orë</td>
                <td className="p-4 font-black text-orange-600">300 Lekë</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Shtesat dhe Shërbimet Opsionale</h2>
        <ul>
          <li><strong>Peshë mbi 2 kg:</strong> +50 Lekë për çdo kilogram shtesë mbi kufirin bazë të 2 kg.</li>
          <li><strong>Opsioni Express (Prioritet brenda ditës):</strong> +100 Lekë shtesë për dërgesa me urgjencë brenda qytetit të Tiranës ose akseve kryesore.</li>
          <li><strong>Pagesë në Dorëzim (COD):</strong> Mbledhja e pagesës nga marrësi në dorëzim dhe kalimi në llogarinë e dërguesit pa komision shtesë për klientët e rregullt.</li>
          <li><strong>Marrje në Adresë (Pickup):</strong> E përfshirë falas për çdo porosi të regjistruar online.</li>
          <li><strong>Sigurimi i Pakos:</strong> Pako deri në 10,000 Lekë vlerë mbulohet falas. Për vlera më të larta zbatohet tarifa 1% e vlerës së deklaruar.</li>
        </ul>
      </section>

      <section>
        <h2>Zbritje për Dyqane dhe Biznese (B2B)</h2>
        <p>
          Dyqanet online dhe bizneset që dërgojnë mbi 50 pako në muaj përfitojnë tarifa të dedikuara me zbritje deri në 30%, faturë tatimore mujore, menaxher llogarie dhe platformë të dedikuar raportimi.
        </p>
        <p>
          Kontaktoni departamentin tregtar në <Link href="/b2b">Dërgo24 për Biznese</Link> ose telefononi në <a href="tel:+355692424024">+355 69 24 24 024</a>.
        </p>
      </section>
    </LegalPage>
  );
}
