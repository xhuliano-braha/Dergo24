import { LegalPage } from '@/components/legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Të dhënat personale" title="Politika e privatësisë" intro="Kjo politikë shpjegon çfarë të dhënash përdor Dergo24, pse nevojiten dhe cilat janë të drejtat tuaja.">
      <section><h2>1. Të dhënat që përpunojmë</h2><ul><li>Të dhëna identifikimi dhe kontakti të dërguesit, marrësit, klientit dhe stafit.</li><li>Adresa, përshkrimi i pakos, pesha, çmimi, COD-i dhe historiku i dërgesës.</li><li>Firma, fotografia, emri i marrësit, koha dhe GPS-i kur regjistrohet prova e dorëzimit.</li><li>Të dhëna teknike dhe sigurie të nevojshme për sesionin dhe funksionimin e aplikacionit.</li></ul></section>
      <section><h2>2. Qëllimet</h2><p>Të dhënat përdoren për të lidhur kontratën e transportit, realizuar dhe gjurmuar dërgesën, komunikuar me palët, mbledhur COD-in, trajtuar ankesat, parandaluar abuzimin dhe përmbushur detyrimet ligjore.</p></section>
      <section><h2>3. Baza dhe minimizimi</h2><p>Përpunimi mbështetet te realizimi i shërbimit të kërkuar, detyrimet ligjore, interesat legjitime të sigurisë dhe, kur kërkohet, pëlqimi. Dergo24 duhet të mbledhë vetëm të dhënat që nevojiten për këto qëllime.</p></section>
      <section><h2>4. Ndarja dhe ofruesit</h2><p>Të dhënat mund t’u jepen korrierëve të autorizuar, ofruesve të infrastrukturës cloud dhe databazës, shërbimeve të komunikimit, pagesave ose autoriteteve kur kërkohet me ligj. Ato nuk shiten për marketing të palëve të treta.</p></section>
      <section><h2>5. Ruajtja dhe siguria</h2><p>Të dhënat ruhen vetëm për aq kohë sa kërkohet për shërbimin, ankesat, kontabilitetin dhe detyrimet rregullatore. Përdoren kontrolle aksesi, sesione të sigurta, kufizim rolesh dhe kopje rezervë; asnjë sistem nuk mund të garantojë rrezik zero.</p></section>
      <section><h2>6. Të drejtat tuaja</h2><p>Sipas ligjit nr. 124/2024, mund të kërkoni informacion, akses, korrigjim, fshirje ose kufizim kur zbatohet, si dhe të kundërshtoni përpunimin. Kërkesa mund të bëhet në zyrën Dergo24. Mund të ankoheni edhe pranë <a href="https://idp.al/ankohu/" target="_blank" rel="noreferrer">Komisionerit për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave Personale</a>.</p></section>
      <section><h2>7. Ndryshimet</h2><p>Versioni dhe data e politikës publikohen në këtë faqe. Ndryshimet thelbësore duhet t’u komunikohen përdoruesve përpara se të hyjnë në fuqi kur kjo kërkohet.</p></section>
    </LegalPage>
  );
}
