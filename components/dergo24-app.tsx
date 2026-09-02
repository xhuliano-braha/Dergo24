'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Box, Check, Clock3, Headphones, MapPin, Menu, PackageCheck, Route, Search, ShieldCheck, Sparkles, Truck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const cities = ['Tiranë', 'Durrës', 'Shkodër', 'Vlorë', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Pogradec', 'Kavajë', 'Gjirokastër', 'Sarandë', 'Lezhë', 'Kukës', 'Peshkopi', 'Krujë', 'Laç', 'Patos', 'Librazhd', 'Kuçovë', 'Burrel', 'Cërrik', 'Gramsh', 'Bulqizë', 'Përmet', 'Ballsh', 'Rrëshen', 'Tepelenë', 'Ersekë', 'Peqin', 'Bajram Curri', 'Divjakë', 'Himarë', 'Pukë', 'Maliq', 'Roskovec', 'Belsh', 'Fushë-Arrëz', 'Konispol', 'Koplik', 'Memaliaj', 'Poliçan', 'Delvinë', 'Vorë', 'Kamëz', 'Selenicë', 'Orikum', 'Shijak', 'Ura Vajgurore', 'Rrogozhinë'];

type TrackingResult = { shipment: { trackingCode: string; pickupCity: string; deliveryCity: string; status: string }; events: Array<{ status: string; location: string; details: string; createdAt: string }> };
type BookingResult = { trackingCode: string; price: number; status: string };

const initialForm = { senderName: '', senderPhone: '', recipientName: '', recipientPhone: '', pickupCity: 'Tiranë', deliveryCity: 'Durrës', address: '', packageType: 'Pako', weight: '1', service: 'standard' };

export function Dergo24App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [trackingError, setTrackingError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const estimate = useMemo(() => (form.service === 'express' ? 800 : 500) + Math.max(0, Math.ceil(Number(form.weight) || 1) - 1) * 100, [form.service, form.weight]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    void context.registerTool({ name: 'start_shipment_booking', title: 'Start shipment booking', description: 'Open the Dergo24 shipment booking form.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => { setBookingOpen(true); return { opened: true }; } }, { signal: controller.signal });
    return () => controller.abort();
  }, []);

  async function trackShipment(event: FormEvent) {
    event.preventDefault();
    if (!trackingCode.trim()) return;
    setTrackingLoading(true); setTrackingError(''); setTracking(null);
    try {
      const response = await fetch(`/api/shipments?tracking=${encodeURIComponent(trackingCode)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTracking(data);
    } catch (error) { setTrackingError(error instanceof Error ? error.message : 'Ndodhi një gabim.'); }
    finally { setTrackingLoading(false); }
  }

  async function bookShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBookingLoading(true); setBookingError('');
    try {
      const response = await fetch('/api/shipments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, weight: Number(form.weight) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBooking(data); setTrackingCode(data.trackingCode);
    } catch (error) { setBookingError(error instanceof Error ? error.message : 'Ndodhi një gabim.'); }
    finally { setBookingLoading(false); }
  }

  function field(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function goToTracking() { document.querySelector('#gjurmo')?.scrollIntoView(); }

  return <main className="min-h-screen overflow-hidden">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-[#fbfaf7]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Dergo24, faqja kryesore"><Logo /></a>
        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex"><a href="#sherbimet">Shërbimet</a><a href="#si-funksionon">Si funksionon</a><a href="#mbulim">Mbulimi</a><a href="#kontakt">Kontakt</a></nav>
        <div className="hidden items-center gap-3 lg:flex"><Button variant="ghost" className="h-11 px-4" onClick={goToTracking}>Gjurmo pakon</Button><Button className="h-11 rounded-xl px-5 shadow-[0_8px_24px_rgba(215,45,40,.2)]" onClick={() => setBookingOpen(true)}>Dërgo tani <ArrowRight /></Button></div>
        <button className="grid size-10 place-items-center lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Hap menunë">{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <nav className="border-t bg-white px-5 py-5 lg:hidden"><div className="flex flex-col gap-4 font-semibold"><a href="#sherbimet" onClick={() => setMenuOpen(false)}>Shërbimet</a><a href="#si-funksionon" onClick={() => setMenuOpen(false)}>Si funksionon</a><a href="#mbulim" onClick={() => setMenuOpen(false)}>Mbulimi</a><Button className="mt-2 h-11" onClick={() => setBookingOpen(true)}>Dërgo tani</Button></div></nav>}
    </header>

    <section id="top" className="relative min-h-[760px] pt-20 lg:min-h-[820px]">
      <img src="/dergo24-courier.png" alt="Korrier Dergo24 duke transportuar një pako" className="absolute inset-0 size-full object-cover object-[68%_center]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#fbfaf7_0%,#fbfaf7_35%,rgba(251,250,247,.9)_48%,rgba(251,250,247,.1)_78%)]" />
      <div className="relative mx-auto grid max-w-7xl px-5 py-24 lg:grid-cols-2 lg:px-8 lg:py-28"><div className="max-w-2xl">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-primary shadow-sm backdrop-blur"><Sparkles className="size-3.5" /> Shqipëria në derën tënde</div>
        <h1 className="text-balance text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-[5rem]">Nga dora jote, <span className="text-primary">në çdo qytet.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">Transportojmë dokumente, pako dhe porosi biznesi në gjithë Shqipërinë — shpejt, sigurt dhe me gjurmim në çdo hap.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button className="h-14 rounded-xl px-7 text-base font-bold shadow-[0_12px_34px_rgba(215,45,40,.25)]" onClick={() => setBookingOpen(true)}>Rezervo një dërgesë <ArrowRight className="size-5" /></Button><Button variant="outline" className="h-14 rounded-xl border-black/10 bg-white/75 px-7 text-base font-bold backdrop-blur" onClick={goToTracking}><Search className="size-5" /> Gjurmo pakon</Button></div>
        <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold"><Trust>Pa kontratë</Trust><Trust>Pagesë në dorëzim</Trust><Trust>Mbështetje lokale</Trust></div>
      </div></div>
    </section>

    <section id="gjurmo" className="relative z-10 mx-auto -mt-28 max-w-6xl px-5 lg:px-8"><div className="rounded-3xl border border-black/5 bg-[#1d1d1b] p-5 text-white shadow-[0_24px_80px_rgba(25,25,23,.22)] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.4fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-white/50">Gjurmim në kohë reale</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Ku ndodhet pakoja ime?</h2></div><form onSubmit={trackShipment} className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><PackageCheck className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/35" /><Input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="P.sh. D24-26-AB12CD34" className="h-14 rounded-xl border-white/10 bg-white/8 pl-12 font-mono text-white placeholder:text-white/35" /></div><Button type="submit" disabled={trackingLoading} className="h-14 rounded-xl px-7 font-bold">{trackingLoading ? 'Duke kërkuar...' : 'Gjurmo dërgesën'} <Search /></Button></form></div>
      {trackingError && <p className="mt-5 rounded-xl bg-white/8 px-4 py-3 text-sm text-red-200">{trackingError}</p>}
      {tracking && <div className="mt-7 grid gap-5 border-t border-white/10 pt-7 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-sm text-white/50">{tracking.shipment.trackingCode}</p><p className="mt-2 text-2xl font-bold">{tracking.shipment.status}</p><p className="mt-2 flex items-center gap-2 text-sm text-white/60"><Route className="size-4" /> {tracking.shipment.pickupCity} → {tracking.shipment.deliveryCity}</p></div><div className="space-y-4">{tracking.events.map((item) => <div key={item.createdAt} className="flex gap-4"><span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-primary"><Check className="size-4" /></span><div><p className="font-semibold">{item.status} · {item.location}</p><p className="mt-1 text-sm text-white/55">{item.details}</p></div></div>)}</div></div>}
    </div></section>

    <section id="sherbimet" className="mx-auto max-w-7xl px-5 py-28 lg:px-8"><SectionTitle eyebrow="Shërbime pa komplikime" title="Një zgjidhje për çdo dërgesë." copy="Nga një dokument urgjent te porositë e përditshme të biznesit tuaj." /><div className="mt-12 grid gap-5 md:grid-cols-3">{[
      { icon: Box, title: 'Dërgesa standarde', copy: 'Dorëzim i sigurt në 24–48 orë, duke filluar nga 500 Lekë.', tag: 'Më e zgjedhura' },
      { icon: Clock3, title: 'Dërgesa Express', copy: 'Prioritet në marrje dhe dorëzim për pakot që nuk presin.', tag: 'Nga 800 Lekë' },
      { icon: Truck, title: 'Zgjidhje për biznes', copy: 'Marrje ditore, pagesë në dorëzim dhe raporte për çdo porosi.', tag: 'Sipas volumit' },
    ].map((service) => <article key={service.title} className="rounded-3xl border bg-white p-7 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><service.icon className="size-6" /></span><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">{service.tag}</span></div><h3 className="mt-8 text-xl font-bold">{service.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{service.copy}</p><button onClick={() => setBookingOpen(true)} className="mt-7 text-sm font-bold text-primary">Rezervo tani →</button></article>)}</div></section>

    <section id="si-funksionon" className="bg-[#1d1d1b] py-28 text-white"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid gap-10 lg:grid-cols-2 lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">E thjeshtë nga fillimi</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Ti rezervo. Ne bëjmë pjesën tjetër.</h2></div><p className="text-lg leading-8 text-white/55">Pa sportele dhe pa formularë letre. Rezervo online, korrieri vjen te adresa jote dhe ti e ndjek pakon deri në dorëzim.</p></div><div className="mt-16 grid gap-10 md:grid-cols-3">{[
      { no: '01', icon: MapPin, title: 'Trego adresat', copy: 'Zgjidh qytetin e nisjes, destinacionin dhe të dhënat e marrësit.' },
      { no: '02', icon: PackageCheck, title: 'Ne e marrim', copy: 'Korrieri të kontakton dhe e merr pakon në orarin e dakordësuar.' },
      { no: '03', icon: Route, title: 'Ndiqe deri në fund', copy: 'Kodi unik të tregon statusin e dërgesës në çdo moment.' },
    ].map((step) => <div key={step.no} className="relative border-t border-white/15 pt-7"><span className="absolute right-0 top-5 font-mono text-5xl font-black text-white/[.06]">{step.no}</span><step.icon className="size-7 text-primary" /><h3 className="mt-7 text-xl font-bold">{step.title}</h3><p className="mt-3 leading-7 text-white/50">{step.copy}</p></div>)}</div></div></section>

    <section id="mbulim" className="paper-grid py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="rounded-[2rem] border bg-white/90 p-7 shadow-sm md:p-12"><div className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center"><div><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-[.13em] text-primary"><MapPin className="size-3.5" /> Mbulim kombëtar</span><h2 className="mt-5 text-4xl font-black tracking-[-.04em] sm:text-5xl">Nga Vermoshi në Konispol.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Dergo24 lidh qytetet, bashkitë dhe zonat përreth me një rrjet korrierësh lokalë dhe linja të përditshme transporti.</p><div className="mt-8 flex flex-wrap gap-2">{cities.slice(0, 14).map((city) => <span key={city} className="rounded-full border bg-background px-3 py-1.5 text-sm font-semibold">{city}</span>)}<span className="rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-white">+ të gjitha qytetet</span></div></div><div className="grid grid-cols-2 gap-4"><Stat dark value="24–48h" label="Dorëzim standard" /><Stat value="61" label="Bashki të mbuluara" /><div className="col-span-2 flex items-center gap-4 rounded-2xl border bg-background p-6"><ShieldCheck className="size-10 text-primary" /><div><p className="font-bold">Çdo pako e trajtuar me kujdes</p><p className="mt-1 text-sm text-muted-foreground">Gjurmim dhe konfirmim në dorëzim.</p></div></div></div></div></div></div></section>

    <footer id="kontakt" className="bg-[#151513] py-14 text-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8"><div><Logo /><p className="mt-5 max-w-sm leading-7 text-white/45">Partneri yt për transport të shpejtë dhe të besueshëm në çdo qytet të Shqipërisë.</p></div><div><p className="font-bold">Na kontakto</p><div className="mt-4 space-y-3 text-sm text-white/50"><p>+355 69 24 24 024</p><p>info@dergo24.al</p><p>Tiranë, Shqipëri</p></div></div><div><p className="font-bold">Orari</p><div className="mt-4 space-y-3 text-sm text-white/50"><p>Hënë – Shtunë: 08:00 – 20:00</p><p className="flex items-center gap-2 text-white/70"><Headphones className="size-4 text-primary" /> Mbështetje për çdo dërgesë</p></div></div></div><div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 pt-7 text-xs text-white/30 sm:flex-row sm:justify-between lg:px-8"><p>© 2026 Dergo24. Të gjitha të drejtat të rezervuara.</p><p>Kushtet · Privatësia</p></div></footer>

    {bookingOpen && <BookingModal form={form} field={field} estimate={estimate} booking={booking} error={bookingError} loading={bookingLoading} onSubmit={bookShipment} onClose={() => { setBookingOpen(false); setBooking(null); }} onTrack={() => { setBookingOpen(false); setBooking(null); goToTracking(); }} />}
  </main>;
}

function BookingModal({ form, field, estimate, booking, error, loading, onSubmit, onClose, onTrack }: { form: typeof initialForm; field: (name: keyof typeof initialForm, value: string) => void; estimate: number; booking: BookingResult | null; error: string; loading: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void; onTrack: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-5 backdrop-blur sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-primary">Rezervim online</p><h2 className="mt-1 text-2xl font-black">Dërgo një pako</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-secondary" aria-label="Mbyll"><X className="size-5" /></button></div>
    {booking ? <div className="p-8 text-center sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-700"><Check className="size-8" /></span><h3 className="mt-6 text-3xl font-black">Dërgesa u rezervua!</h3><p className="mx-auto mt-3 max-w-md text-muted-foreground">Korrieri ynë do t’ju kontaktojë për të konfirmuar orarin e marrjes.</p><div className="mx-auto mt-7 max-w-sm rounded-2xl bg-secondary p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kodi i gjurmimit</p><p className="mt-2 font-mono text-xl font-bold">{booking.trackingCode}</p><p className="mt-3 text-sm">Çmimi: <strong>{booking.price} Lekë</strong></p></div><Button className="mt-7 h-12 px-6" onClick={onTrack}>Gjurmo dërgesën</Button></div> :
    <form onSubmit={onSubmit} className="p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><FormInput label="Emri i dërguesit" value={form.senderName} onChange={(v) => field('senderName', v)} placeholder="Emër Mbiemër" /><FormInput label="Telefoni i dërguesit" value={form.senderPhone} onChange={(v) => field('senderPhone', v)} placeholder="069 000 0000" type="tel" /><FormInput label="Emri i marrësit" value={form.recipientName} onChange={(v) => field('recipientName', v)} placeholder="Emër Mbiemër" /><FormInput label="Telefoni i marrësit" value={form.recipientPhone} onChange={(v) => field('recipientPhone', v)} placeholder="069 000 0000" type="tel" /><FormSelect label="Qyteti i nisjes" value={form.pickupCity} onChange={(v) => field('pickupCity', v)} options={cities} /><FormSelect label="Qyteti i destinacionit" value={form.deliveryCity} onChange={(v) => field('deliveryCity', v)} options={cities} /><div className="sm:col-span-2"><FormInput label="Adresa e dorëzimit" value={form.address} onChange={(v) => field('address', v)} placeholder="Rruga, numri, zona" /></div><FormSelect label="Lloji i pakos" value={form.packageType} onChange={(v) => field('packageType', v)} options={['Dokumente', 'Pako', 'E brishtë', 'Tjetër']} /><FormInput label="Pesha (kg)" value={form.weight} onChange={(v) => field('weight', v)} type="number" min="0.1" max="100" step="0.1" /></div><p className="mb-3 mt-6 text-sm font-bold">Shërbimi</p><div className="grid gap-3 sm:grid-cols-2">{[{ value: 'standard', name: 'Standard', copy: '24–48 orë · nga 500 Lekë' }, { value: 'express', name: 'Express', copy: 'Prioritet · nga 800 Lekë' }].map((s) => <button type="button" key={s.value} onClick={() => field('service', s.value)} className={`rounded-2xl border p-4 text-left ${form.service === s.value ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : ''}`}><span className="font-bold">{s.name}</span><span className="mt-1 block text-sm text-muted-foreground">{s.copy}</span></button>)}</div>{error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<div className="mt-7 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Çmimi i llogaritur</p><p className="mt-1 text-2xl font-black">{estimate} Lekë</p></div><Button type="submit" disabled={loading} className="h-12 rounded-xl px-7 font-bold">{loading ? 'Duke rezervuar...' : 'Konfirmo dërgesën'} <ArrowRight /></Button></div></form>}
  </div></div>;
}

function Logo() { return <><span className="grid size-10 place-items-center rounded-xl bg-primary text-white"><Box className="size-5" /></span><span className="text-xl font-black tracking-[-.04em]">DERGO<span className="text-primary">24</span></span></>; }
function Trust({ children }: { children: React.ReactNode }) { return <span className="flex items-center gap-2"><Check className="size-4 text-primary" />{children}</span>; }
function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</p><h2 className="mt-3 text-balance text-4xl font-black tracking-[-.04em] sm:text-5xl">{title}</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">{copy}</p></div>; }
function Stat({ dark, value, label }: { dark?: boolean; value: string; label: string }) { return <div className={`rounded-2xl p-6 text-white ${dark ? 'bg-[#1d1d1b]' : 'bg-primary'}`}><p className="text-4xl font-black">{value}</p><p className="mt-2 text-sm text-white/60">{label}</p></div>; }
function FormInput({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><Input required value={value} onChange={(event) => onChange(event.target.value)} className="h-11" {...props} /></label>; }
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><select required value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus:border-primary">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
