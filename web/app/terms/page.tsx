import { LegalPage } from '@/components/legal-page';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Informacion kontraktual" title="Kushtet e shërbimit" intro="Këto kushte shpjegojnë rezervimin, marrjen, transportin dhe dorëzimin e dërgesave Dergo24 në Shqipëri.">
      <section><h2>1. Shërbimi</h2><p>Dergo24 pranon kërkesa për marrje, transport, gjurmim dhe dorëzim pakosh. Afatet e shfaqura janë vlerësime, përveç rastit kur një afat është konfirmuar shprehimisht me shkrim.</p></section>
      <section><h2>2. Rezervimi dhe çmimi</h2><ul><li>Klienti duhet të japë emra, telefona, adresa, peshë, përmbajtje dhe vlerë të sakta.</li><li>Çmimi online mund të korrigjohet kur pesha, përmasat, destinacioni ose shërbimi real ndryshojnë.</li><li>Pagesa në dorëzim mblidhet vetëm për shumën e regjistruar dhe evidentohet në sistem.</li></ul></section>
      <section><h2>3. Paketimi dhe sendet e ndaluara</h2><p>Dërguesi është përgjegjës për paketim të përshtatshëm. Nuk pranohen sende të paligjshme, armë, eksplozivë, substanca të rrezikshme, para fizike, materiale të ndaluara, produkte që kërkojnë kushte të palicencuara ose sende që rrezikojnë personelin dhe dërgesat e tjera.</p></section>
      <section><h2>4. Marrja dhe dorëzimi</h2><ul><li>Korrieri mund të kontaktojë dërguesin ose marrësin për verifikim.</li><li>Marrësi duhet të jetë i disponueshëm në adresë dhe mund t’i kërkohet identifikim.</li><li>Firma, fotografia, emri i marrësit, ora dhe pozicioni GPS mund të ruhen si provë dorëzimi.</li><li>Pas një tentative të pasuksesshme, dërgesa mund të ricaktohet, mbahet në pikë ose kthehet me kosto shtesë të njoftuar.</li></ul></section>
      <section><h2>5. Gjurmimi dhe komunikimet</h2><p>Kodi i gjurmimit është unik dhe duhet ruajtur nga klienti. Statuset pasqyrojnë informacionin operacional më të fundit. Njoftimet mund të dërgohen me telefon, email, SMS ose WhatsApp kur këto kanale aktivizohen.</p></section>
      <section><h2>6. Anulimet dhe përgjegjësia</h2><p>Anulimi para marrjes zakonisht nuk ka kosto; pas marrjes mund të zbatohen kostot e kryera. Përgjegjësia, dëmshpërblimi dhe përjashtimet trajtohen sipas llojit të shërbimit, deklarimit të vlerës, sigurimit të blerë dhe legjislacionit në fuqi.</p></section>
      <section><h2>7. Ligji dhe ankesat</h2><p>Shërbimi postar në Shqipëri rregullohet nga ligji nr. 46/2015 dhe aktet e AKEP. Fillimisht ankesa paraqitet te Dergo24; nëse nuk zgjidhet, klienti mund të ndjekë procedurën e AKEP. Shihni <Link href="/claims-policy">politikën e ankesave</Link> dhe informacionin zyrtar të <a href="https://akep.al/perdorues/sherbim-postar/" target="_blank" rel="noreferrer">AKEP</a>.</p></section>
    </LegalPage>
  );
}
