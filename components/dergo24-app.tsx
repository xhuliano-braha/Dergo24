'use client';

import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Box,
  Check,
  Headphones,
  MapPin,
  Menu,
  PackageCheck,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const cities = [
  'Tiranë',
  'Durrës',
  'Shkodër',
  'Vlorë',
  'Elbasan',
  'Fier',
  'Korçë',
  'Berat',
  'Lushnjë',
  'Pogradec',
  'Kavajë',
  'Gjirokastër',
  'Sarandë',
  'Lezhë',
  'Kukës',
  'Peshkopi',
  'Krujë',
  'Laç',
  'Patos',
  'Librazhd',
  'Kuçovë',
  'Burrel',
  'Cërrik',
  'Gramsh',
  'Bulqizë',
  'Përmet',
  'Ballsh',
  'Rrëshen',
  'Tepelenë',
  'Ersekë',
  'Peqin',
  'Bajram Curri',
  'Divjakë',
  'Himarë',
  'Pukë',
  'Maliq',
  'Roskovec',
  'Belsh',
  'Fushë-Arrëz',
  'Konispol',
  'Koplik',
  'Memaliaj',
  'Poliçan',
  'Delvinë',
  'Vorë',
  'Kamëz',
  'Selenicë',
  'Orikum',
  'Shijak',
  'Ura Vajgurore',
  'Rrogozhinë',
];

type TrackingResult = {
  shipment: {
    trackingCode: string;
    pickupCity: string;
    deliveryCity: string;
    status: string;
  };
  events: Array<{
    status: string;
    location: string;
    details: string;
    createdAt: string;
  }>;
};
type BookingResult = { trackingCode: string; price: number; status: string };
type QuoteResult = { referenceCode: string };

const initialForm = {
  senderName: '',
  senderPhone: '',
  recipientName: '',
  recipientPhone: '',
  pickupCity: 'Tiranë',
  deliveryCity: 'Durrës',
  address: '',
  packageType: 'Pako',
  weight: '1',
  service: 'standard',
};
const initialQuote = {
  customerName: '',
  phone: '',
  pickupCity: 'Tiranë',
  deliveryCity: 'Durrës',
  itemType: 'Mobilje',
  description: '',
};

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
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState(initialQuote);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);

  const estimate = useMemo(
    () =>
      (form.service === 'express' ? 800 : 500) +
      Math.max(0, Math.ceil(Number(form.weight) || 1) - 1) * 100,
    [form.service, form.weight],
  );

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    void context.registerTool(
      {
        name: 'start_shipment_booking',
        title: 'Start shipment booking',
        description: 'Open the Dergo24 shipment booking form.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => {
          setBookingOpen(true);
          return { opened: true };
        },
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, []);

  async function trackShipment(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trackingCode.trim()) return;
    setTrackingLoading(true);
    setTrackingError('');
    setTracking(null);
    try {
      const response = await fetch(
        `/api/shipments?tracking=${encodeURIComponent(trackingCode)}`,
      );
      const data = (await response.json()) as TrackingResult & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error);
      setTracking(data);
    } catch (error) {
      setTrackingError(
        error instanceof Error ? error.message : 'Ndodhi një gabim.',
      );
    } finally {
      setTrackingLoading(false);
    }
  }

  async function bookShipment(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, weight: Number(form.weight) }),
      });
      const data = (await response.json()) as BookingResult & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error);
      setBooking(data);
      setTrackingCode(data.trackingCode);
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : 'Ndodhi një gabim.',
      );
    } finally {
      setBookingLoading(false);
    }
  }

  async function requestQuote(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuoteLoading(true);
    setQuoteError('');
    try {
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      });
      const data = (await response.json()) as QuoteResult & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setQuoteResult(data);
    } catch (error) {
      setQuoteError(
        error instanceof Error ? error.message : 'Ndodhi një gabim.',
      );
    } finally {
      setQuoteLoading(false);
    }
  }

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  function quoteField(name: keyof typeof initialQuote, value: string) {
    setQuote((current) => ({ ...current, [name]: value }));
  }
  function goToTracking() {
    document.querySelector('#gjurmo')?.scrollIntoView();
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a
            href="#top"
            className="flex items-center gap-2.5"
            aria-label="Dergo24, faqja kryesore"
          >
            <Logo />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            <a href="#sherbimet">Shërbimet</a>
            <a href="#si-funksionon">Si funksionon</a>
            <a href="#mbulim">Mbulimi</a>
            <a href="#kontakt">Kontakt</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              variant="ghost"
              className="h-11 px-4"
              onClick={goToTracking}
            >
              Gjurmo pakon
            </Button>
            <Button
              className="h-11 rounded-xl px-5 shadow-[0_8px_24px_rgba(215,45,40,.2)]"
              onClick={() => setBookingOpen(true)}
            >
              Dërgo tani <ArrowRight />
            </Button>
          </div>
          <button
            className="grid size-10 place-items-center lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Hap menunë"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t bg-white px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4 font-semibold">
              <a href="#sherbimet" onClick={() => setMenuOpen(false)}>
                Shërbimet
              </a>
              <a href="#si-funksionon" onClick={() => setMenuOpen(false)}>
                Si funksionon
              </a>
              <a href="#mbulim" onClick={() => setMenuOpen(false)}>
                Mbulimi
              </a>
              <Button
                className="mt-2 h-11"
                onClick={() => setBookingOpen(true)}
              >
                Dërgo tani
              </Button>
            </div>
          </nav>
        )}
      </header>

      <section id="top" className="relative bg-[#071b38] pt-20 text-white">
        <div className="mx-auto grid min-h-[760px] max-w-[1500px] lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex items-center px-5 py-20 lg:px-[max(2rem,calc((100vw-1280px)/2))] lg:pr-12">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-primary">
                <Sparkles className="size-3.5" /> Shpejt. Sigurt. Kudo.
              </div>
              <h1 className="text-balance text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-[5rem]">
                Nga dera juaj,{' '}
                <span className="text-primary">në destinacion.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65 sm:text-xl">
                Pako, dokumente, mobilje dhe ngarkesa biznesi në gjithë
                Shqipërinë — me kujdes në çdo kilometër.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-14 rounded-xl px-7 text-base font-bold shadow-[0_12px_34px_rgba(247,91,18,.28)]"
                  onClick={() => setBookingOpen(true)}
                >
                  Dërgo një pako <ArrowRight className="size-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-14 rounded-xl border-white/20 bg-white/5 px-7 text-base font-bold text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setQuoteOpen(true)}
                >
                  Kërko ofertë transporti
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/75">
                <Trust>Gjurmim online</Trust>
                <Trust>Marrje në adresë</Trust>
                <Trust>Mbulim kombëtar</Trust>
              </div>
            </div>
          </div>
          <div className="relative min-h-[560px] overflow-hidden lg:min-h-full">
            <Image
              src="/dergo24-doorstep.jpeg"
              alt="Korrieri Dërgo24 dorëzon një pako në adresën e klientit"
              width={818}
              height={1280}
              className="absolute inset-0 size-full object-cover object-top"
            />
            <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-[#071b38] to-transparent lg:block" />
            <div className="absolute inset-x-0 bottom-0 h-2 bg-primary" />
          </div>
        </div>
      </section>

      <section
        id="gjurmo"
        className="relative z-10 mx-auto -mt-16 max-w-6xl px-5 lg:px-8"
      >
        <div className="rounded-3xl border border-white/10 bg-[#071b38] p-5 text-white shadow-[0_24px_80px_rgba(7,27,56,.25)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.4fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-white/50">
                Gjurmim në kohë reale
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Ku ndodhet pakoja ime?
              </h2>
            </div>
            <form
              onSubmit={trackShipment}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <PackageCheck className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/35" />
                <Input
                  value={trackingCode}
                  onChange={(event) => setTrackingCode(event.target.value)}
                  placeholder="P.sh. D24-26-AB12CD34"
                  className="h-14 rounded-xl border-white/10 bg-white/8 pl-12 font-mono text-white placeholder:text-white/35"
                />
              </div>
              <Button
                type="submit"
                disabled={trackingLoading}
                className="h-14 rounded-xl px-7 font-bold"
              >
                {trackingLoading ? 'Duke kërkuar...' : 'Gjurmo dërgesën'}{' '}
                <Search />
              </Button>
            </form>
          </div>
          {trackingError && (
            <p className="mt-5 rounded-xl bg-white/8 px-4 py-3 text-sm text-red-200">
              {trackingError}
            </p>
          )}
          {tracking && (
            <div className="mt-7 grid gap-5 border-t border-white/10 pt-7 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="font-mono text-sm text-white/50">
                  {tracking.shipment.trackingCode}
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {tracking.shipment.status}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
                  <Route className="size-4" /> {tracking.shipment.pickupCity} →{' '}
                  {tracking.shipment.deliveryCity}
                </p>
              </div>
              <div className="space-y-4">
                {tracking.events.map((item) => (
                  <div key={item.createdAt} className="flex gap-4">
                    <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-primary">
                      <Check className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold">
                        {item.status} · {item.location}
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        {item.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="sherbimet" className="mx-auto max-w-7xl px-5 py-28 lg:px-8">
        <SectionTitle
          eyebrow="Jo vetëm pako"
          title="Transportojmë çdo gjë me kujdes."
          copy="Dy mënyra të qarta rezervimi: çmim i menjëhershëm për pako dhe ofertë e personalizuar për ngarkesa të mëdha."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="grid sm:grid-cols-[.9fr_1.1fr]">
              <Image
                src="/dergo24-fragile.jpeg"
                alt="Transport i sigurt për dërgesa të brishta"
                width={1024}
                height={1280}
                className="h-72 w-full object-cover object-top sm:h-full"
              />
              <div className="p-7 sm:p-9">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  Pako & dokumente
                </span>
                <h3 className="mt-5 text-3xl font-black tracking-tight">
                  Rezervo dhe merr çmimin tani.
                </h3>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Dokumente, pako të vogla, produkte dhe dërgesa të brishta me
                  gjurmim online.
                </p>
                <div className="mt-6 space-y-2 text-sm font-semibold">
                  <Trust>Standard 24–48 orë</Trust>
                  <Trust>Express me prioritet</Trust>
                  <Trust>Kod unik gjurmimi</Trust>
                </div>
                <Button
                  className="mt-7 h-11 px-5"
                  onClick={() => setBookingOpen(true)}
                >
                  Dërgo një pako <ArrowRight />
                </Button>
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl bg-[#071b38] text-white shadow-sm">
            <div className="grid sm:grid-cols-[.9fr_1.1fr]">
              <Image
                src="/dergo24-large-items.jpeg"
                alt="Transport Dërgo24 për mobilje dhe sende të mëdha"
                width={818}
                height={1280}
                className="h-72 w-full object-cover object-top sm:h-full"
              />
              <div className="p-7 sm:p-9">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  Transport i dedikuar
                </span>
                <h3 className="mt-5 text-3xl font-black tracking-tight">
                  Mobilje, pajisje dhe ngarkesa.
                </h3>
                <p className="mt-4 leading-7 text-white/60">
                  Na përshkruaj sendet dhe itinerarin. Ekipi ynë përgatit
                  ofertën e saktë sipas volumit dhe transportit.
                </p>
                <div className="mt-6 space-y-2 text-sm font-semibold text-white/80">
                  <Trust>Mobilje dhe elektroshtëpiake</Trust>
                  <Trust>Paleta dhe mallra biznesi</Trust>
                  <Trust>Marrje në adresë</Trust>
                </div>
                <Button
                  className="mt-7 h-11 px-5"
                  onClick={() => setQuoteOpen(true)}
                >
                  Kërko ofertë <ArrowRight />
                </Button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="si-funksionon" className="bg-[#071b38] py-28 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                E thjeshtë nga fillimi
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
                Ti rezervo. Ne bëjmë pjesën tjetër.
              </h2>
            </div>
            <p className="text-lg leading-8 text-white/55">
              Pa sportele dhe pa formularë letre. Rezervo online, korrieri vjen
              te adresa jote dhe ti e ndjek pakon deri në dorëzim.
            </p>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              {
                no: '01',
                icon: MapPin,
                title: 'Trego adresat',
                copy: 'Zgjidh qytetin e nisjes, destinacionin dhe të dhënat e marrësit.',
              },
              {
                no: '02',
                icon: PackageCheck,
                title: 'Ne e marrim',
                copy: 'Korrieri të kontakton dhe e merr pakon në orarin e dakordësuar.',
              },
              {
                no: '03',
                icon: Route,
                title: 'Ndiqe deri në fund',
                copy: 'Kodi unik të tregon statusin e dërgesës në çdo moment.',
              },
            ].map((step) => (
              <div
                key={step.no}
                className="relative border-t border-white/15 pt-7"
              >
                <span className="absolute right-0 top-5 font-mono text-5xl font-black text-white/[.06]">
                  {step.no}
                </span>
                <step.icon className="size-7 text-primary" />
                <h3 className="mt-7 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-white/50">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="mbulim" className="paper-grid py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="rounded-[2rem] border bg-white/90 p-7 shadow-sm md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-[.13em] text-primary">
                  <MapPin className="size-3.5" /> Mbulim kombëtar
                </span>
                <h2 className="mt-5 text-4xl font-black tracking-[-.04em] sm:text-5xl">
                  Nga Vermoshi në Konispol.
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                  Dergo24 lidh qytetet, bashkitë dhe zonat përreth me një rrjet
                  korrierësh lokalë dhe linja të përditshme transporti.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {cities.slice(0, 14).map((city) => (
                    <span
                      key={city}
                      className="rounded-full border bg-background px-3 py-1.5 text-sm font-semibold"
                    >
                      {city}
                    </span>
                  ))}
                  <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-white">
                    + të gjitha qytetet
                  </span>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-[#071b38]">
                <Image
                  src="/dergo24-albania.jpeg"
                  alt="Dërgo24 transporton në çdo qytet të Shqipërisë"
                  width={818}
                  height={1280}
                  className="h-[520px] w-full object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071b38] to-transparent p-7 pt-24 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-black">61 bashki</p>
                      <p className="mt-1 text-sm text-white/65">
                        Një rrjet kombëtar dërgesash
                      </p>
                    </div>
                    <ShieldCheck className="size-10 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="kontakt" className="bg-[#05152c] py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm leading-7 text-white/45">
              Partneri yt për transport të shpejtë dhe të besueshëm në çdo qytet
              të Shqipërisë.
            </p>
          </div>
          <div>
            <p className="font-bold">Na kontakto</p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <p>Rruga Mikel Maruli</p>
              <p>Pranë Cassa Italia</p>
              <p>Tiranë, Shqipëri</p>
            </div>
          </div>
          <div>
            <p className="font-bold">Orari</p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <p>Hënë – Shtunë: 08:00 – 20:00</p>
              <p className="flex items-center gap-2 text-white/70">
                <Headphones className="size-4 text-primary" /> Mbështetje për
                çdo dërgesë
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 pt-7 text-xs text-white/30 sm:flex-row sm:justify-between lg:px-8">
          <p>© 2026 Dergo24. Të gjitha të drejtat të rezervuara.</p>
          <p>Kushtet · Privatësia</p>
        </div>
      </footer>

      {bookingOpen && (
        <BookingModal
          form={form}
          field={field}
          estimate={estimate}
          booking={booking}
          error={bookingError}
          loading={bookingLoading}
          onSubmit={bookShipment}
          onClose={() => {
            setBookingOpen(false);
            setBooking(null);
          }}
          onTrack={() => {
            setBookingOpen(false);
            setBooking(null);
            goToTracking();
          }}
        />
      )}
      {quoteOpen && (
        <QuoteModal
          form={quote}
          field={quoteField}
          result={quoteResult}
          error={quoteError}
          loading={quoteLoading}
          onSubmit={requestQuote}
          onClose={() => {
            setQuoteOpen(false);
            setQuoteResult(null);
          }}
        />
      )}
    </main>
  );
}

function BookingModal({
  form,
  field,
  estimate,
  booking,
  error,
  loading,
  onSubmit,
  onClose,
  onTrack,
}: {
  form: typeof initialForm;
  field: (name: keyof typeof initialForm, value: string) => void;
  estimate: number;
  booking: BookingResult | null;
  error: string;
  loading: boolean;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onTrack: () => void;
}) {
  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5"
    >
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.13em] text-primary">
              Rezervim online
            </p>
            <h2 className="mt-1 text-2xl font-black">Dërgo një pako</h2>
          </div>
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-secondary"
            aria-label="Mbyll"
          >
            <X className="size-5" />
          </button>
        </div>
        {booking ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-700">
              <Check className="size-8" />
            </span>
            <h3 className="mt-6 text-3xl font-black">Dërgesa u rezervua!</h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Korrieri ynë do t’ju kontaktojë për të konfirmuar orarin e
              marrjes.
            </p>
            <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-secondary p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Kodi i gjurmimit
              </p>
              <p className="mt-2 font-mono text-xl font-bold">
                {booking.trackingCode}
              </p>
              <p className="mt-3 text-sm">
                Çmimi: <strong>{booking.price} Lekë</strong>
              </p>
            </div>
            <Button className="mt-7 h-12 px-6" onClick={onTrack}>
              Gjurmo dërgesën
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Emri i dërguesit"
                value={form.senderName}
                onChange={(v) => field('senderName', v)}
                placeholder="Emër Mbiemër"
              />
              <FormInput
                label="Telefoni i dërguesit"
                value={form.senderPhone}
                onChange={(v) => field('senderPhone', v)}
                placeholder="069 000 0000"
                type="tel"
              />
              <FormInput
                label="Emri i marrësit"
                value={form.recipientName}
                onChange={(v) => field('recipientName', v)}
                placeholder="Emër Mbiemër"
              />
              <FormInput
                label="Telefoni i marrësit"
                value={form.recipientPhone}
                onChange={(v) => field('recipientPhone', v)}
                placeholder="069 000 0000"
                type="tel"
              />
              <FormSelect
                label="Qyteti i nisjes"
                value={form.pickupCity}
                onChange={(v) => field('pickupCity', v)}
                options={cities}
              />
              <FormSelect
                label="Qyteti i destinacionit"
                value={form.deliveryCity}
                onChange={(v) => field('deliveryCity', v)}
                options={cities}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Adresa e dorëzimit"
                  value={form.address}
                  onChange={(v) => field('address', v)}
                  placeholder="Rruga, numri, zona"
                />
              </div>
              <FormSelect
                label="Lloji i pakos"
                value={form.packageType}
                onChange={(v) => field('packageType', v)}
                options={['Dokumente', 'Pako', 'E brishtë', 'Tjetër']}
              />
              <FormInput
                label="Pesha (kg)"
                value={form.weight}
                onChange={(v) => field('weight', v)}
                type="number"
                min="0.1"
                max="100"
                step="0.1"
              />
            </div>
            <p className="mb-3 mt-6 text-sm font-bold">Shërbimi</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: 'standard',
                  name: 'Standard',
                  copy: '24–48 orë · nga 500 Lekë',
                },
                {
                  value: 'express',
                  name: 'Express',
                  copy: 'Prioritet · nga 800 Lekë',
                },
              ].map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => field('service', s.value)}
                  className={`rounded-2xl border p-4 text-left ${form.service === s.value ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : ''}`}
                >
                  <span className="font-bold">{s.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {s.copy}
                  </span>
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-7 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Çmimi i llogaritur
                </p>
                <p className="mt-1 text-2xl font-black">{estimate} Lekë</p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl px-7 font-bold"
              >
                {loading ? 'Duke rezervuar...' : 'Konfirmo dërgesën'}{' '}
                <ArrowRight />
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

function QuoteModal({
  form,
  field,
  result,
  error,
  loading,
  onSubmit,
  onClose,
}: {
  form: typeof initialQuote;
  field: (name: keyof typeof initialQuote, value: string) => void;
  result: QuoteResult | null;
  error: string;
  loading: boolean;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-5"
      aria-label="Kërko ofertë transporti"
    >
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.13em] text-primary">
              Transport i dedikuar
            </p>
            <h2 className="mt-1 text-2xl font-black">Kërko ofertë</h2>
          </div>
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-secondary"
            aria-label="Mbyll"
          >
            <X className="size-5" />
          </button>
        </div>
        {result ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-700">
              <Check className="size-8" />
            </span>
            <h3 className="mt-6 text-3xl font-black">Kërkesa u dërgua!</h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Ekipi Dërgo24 do t’ju kontaktojë për detajet, çmimin dhe orarin e
              transportit.
            </p>
            <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-secondary p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Referenca
              </p>
              <p className="mt-2 font-mono text-xl font-bold">
                {result.referenceCode}
              </p>
            </div>
            <Button className="mt-7 h-11 px-6" onClick={onClose}>
              Mbyll
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Emri dhe mbiemri"
                value={form.customerName}
                onChange={(value) => field('customerName', value)}
                placeholder="Emër Mbiemër"
              />
              <FormInput
                label="Telefoni"
                value={form.phone}
                onChange={(value) => field('phone', value)}
                placeholder="069 000 0000"
                type="tel"
              />
              <FormSelect
                label="Qyteti i nisjes"
                value={form.pickupCity}
                onChange={(value) => field('pickupCity', value)}
                options={cities}
              />
              <FormSelect
                label="Destinacioni"
                value={form.deliveryCity}
                onChange={(value) => field('deliveryCity', value)}
                options={cities}
              />
              <div className="sm:col-span-2">
                <FormSelect
                  label="Çfarë do të transportoni?"
                  value={form.itemType}
                  onChange={(value) => field('itemType', value)}
                  options={[
                    'Mobilje',
                    'Elektroshtëpiake',
                    'Paletë',
                    'Ngarkesë biznesi',
                    'Tjetër',
                  ]}
                />
              </div>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold">Përshkrimi</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={800}
                  value={form.description}
                  onChange={(event) => field('description', event.target.value)}
                  placeholder="Përshkruani sendet, sasinë, përmasat dhe katin nëse ka..."
                  className="min-h-32 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            {error && (
              <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-7 flex items-center justify-between border-t pt-6">
              <p className="max-w-xs text-sm text-muted-foreground">
                Oferta llogaritet pas konfirmimit të volumit dhe itinerarit.
              </p>
              <Button type="submit" disabled={loading} className="h-12 px-6">
                {loading ? 'Duke dërguar...' : 'Dërgo kërkesën'} <ArrowRight />
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

function Logo() {
  return (
    <>
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-white">
        <Box className="size-5" />
      </span>
      <span className="text-xl font-black tracking-[-.04em]">
        DËRGO<span className="text-primary">24</span>
      </span>
    </>
  );
}
function Trust({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Check className="size-4 text-primary" />
      {children}
    </span>
  );
}
function SectionTitle({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-4xl font-black tracking-[-.04em] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy}</p>
    </div>
  );
}
function FormInput({
  label,
  value,
  onChange,
  ...props
}: { label: string; value: string; onChange: (value: string) => void } & Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange'
>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <Input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11"
        {...props}
      />
    </label>
  );
}
function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
