import { LegalPage } from '@/components/legal-page';

export default function ClaimsPolicyPage() {
  return (
    <LegalPage eyebrow="Mbrojtja e dërgesës" title="Ankesat, sigurimi dhe rimbursimet" intro="Procedura për të raportuar vonesë, humbje, dëmtim ose një shërbim të kryer gabim.">
      <section><h2>1. Si paraqitet ankesa</h2><p>Hapni dërgesën në llogarinë tuaj, zgjidhni “Raporto problem” dhe jepni kodin, përshkrimin, shumën e kërkuar dhe provat. Mund ta paraqisni edhe në zyrën Dergo24. Raportojeni problemin sa më shpejt dhe ruani paketimin, faturat dhe fotografitë.</p></section>
      <section><h2>2. Shqyrtimi</h2><ul><li>Statusi kalon nga “e re” në “në shqyrtim”, pastaj miratohet ose refuzohet me arsyetim.</li><li>Dergo24 mund të kërkojë foto, faturë blerjeje, deklarim vlere, paketimin ose identifikim.</li><li>Pagesa e kërkuar nga klienti nuk përbën automatikisht shumën e miratuar.</li></ul></section>
      <section><h2>3. Dëmtimi, humbja dhe vonesa</h2><p>Vlerësimi merr parasysh gjurmimin, provën e marrjes/dorëzimit, paketimin, vlerën e dokumentuar, tarifën e paguar dhe kufijtë ligjorë ose kontraktualë. Dëmet indirekte dhe fitimi i munguar përjashtohen vetëm në masën që lejon ligji.</p></section>
      <section><h2>4. Sigurimi</h2><p>Një dërgesë konsiderohet e siguruar vetëm kur shërbimi i sigurimit është ofruar, pranuar dhe shënuar në rezervim ose dokumentin fiskal. Klienti duhet të deklarojë vlerën reale. Kufiri, primi, përjashtimet dhe dokumentet e kërkuara duhet të konfirmohen para marrjes.</p></section>
      <section><h2>5. Rimbursimi</h2><p>Kur miratohet, paneli regjistron shumën dhe vendimin. Pagesa kryhet me metodën e dakordësuar pasi verifikohen përfituesi dhe të dhënat financiare. Statusi “rimbursuar” vendoset vetëm pasi pagesa të jetë ekzekutuar.</p></section>
      <section><h2>6. Përshkallëzimi</h2><p>Dergo24 është kontakti i parë për verifikimin e faturimit dhe cilësisë. Nëse zgjidhja nuk pranohet, përdoruesi mund të ndjekë fazën e zgjidhjes së mosmarrëveshjes pranë <a href="https://akep.al/perdorues/sherbim-postar/" target="_blank" rel="noreferrer">AKEP</a> dhe mjetet e tjera që lejon ligji.</p></section>
    </LegalPage>
  );
}
