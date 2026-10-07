'use client';

import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  MapPin,
  Menu,
  PackageCheck,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyTrackingButton } from '@/components/copy-tracking-button';

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
    service?: string;
    packageType?: string;
    weightKg?: number;
    deliveryMethod?: string;
    createdAt?: string;
  };
  events: Array<{
    status: string;
    location: string;
    details: string;
    latitude: number | null;
    longitude: number | null;
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
  codAmount: '0',
  pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  deliveryWindow: 'anytime',
  deliveryMethod: 'home',
  pickupPointId: '',
};
const initialQuote = {
  customerName: '',
  phone: '',
  pickupCity: 'Tiranë',
  deliveryCity: 'Durrës',
  itemType: 'Mobilje',
  description: '',
};

const TRACKING_MILESTONES = [
  { key: 'regjistruar', title: 'Regjistruar', desc: 'Porosia u regjistrua' },
  { key: 'pritje', title: 'Në pritje', desc: 'Përgatitje për marrje' },
  { key: 'mor', title: 'U mor', desc: 'Korrieri mori pakon' },
  { key: 'transport', title: 'Në transport', desc: 'Tranzit logjistik' },
  { key: 'shperndarje', title: 'Në shpërndarje', desc: 'Rrugës tek adresa' },
  { key: 'dorezuar', title: 'U dorëzua', desc: 'Dorëzimi u krye' },
];

function getStageIndex(status?: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('dorëz') || s.includes('dorez')) return 5;
  if (s.includes('shpërndarje') || s.includes('shperndarje')) return 4;
  if (s.includes('transport') || s.includes('tranzit')) return 3;
  if (s.includes('mor') || s.includes('marre') || s.includes('marrë')) return 2;
  if (s.includes('pritje')) return 1;
  return 0;
}

function formatTrackingTime(dateString?: string) {
  if (!dateString) return '';
  try {
    return new Intl.DateTimeFormat('sq-AL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function Dergo24App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; email: string; phone?: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/account/auth')
      .then(async (res) => (res.ok ? (res.json() as Promise<{ authenticated?: boolean; customer?: { id: string; fullName: string; email: string; phone?: string } }>) : null))
      .then((resData) => {
        if (active && resData?.authenticated && resData?.customer) {
          setCurrentUser(resData.customer);
          setForm((prev) => ({
            ...prev,
            senderName: prev.senderName || resData.customer?.fullName || '',
            senderPhone: prev.senderPhone || resData.customer?.phone || '',
          }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const estimate = useMemo(() => {
    const isTirana = (c?: string) =>
      (c ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase() === 'tirane';
    const isLocal = isTirana(form.pickupCity) && isTirana(form.deliveryCity);
    const base = isLocal ? 200 : 300;
    const extraWeight =
      Math.max(0, Math.ceil(Number(form.weight) || 1) - 2) * 50;
    const expressExtra = form.service === 'express' ? 100 : 0;
    return base + extraWeight + expressExtra;
  }, [form.pickupCity, form.deliveryCity, form.service, form.weight]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

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

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('book') !== '1') return;
    const timeout = window.setTimeout(() => setBookingOpen(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('tracking');
    if (!code) return;
    const timeout = window.setTimeout(async () => {
      setTrackingCode(code.toUpperCase());
      setTrackingLoading(true);
      setTrackingError('');
      try {
        const response = await fetch(
          `/api/shipments?tracking=${encodeURIComponent(code)}`,
        );
        const data = (await response.json()) as TrackingResult & {
          error?: string;
        };
        if (!response.ok) throw new Error(data.error);
        setTracking(data);
      } catch (lookupError) {
        setTrackingError(
          lookupError instanceof Error ? lookupError.message : 'Provo përsëri.',
        );
      } finally {
        setTrackingLoading(false);
        document.querySelector('#gjurmo')?.scrollIntoView();
      }
    }, 0);
    return () => window.clearTimeout(timeout);
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
      const payload = {
        ...form,
        senderName: form.senderName.trim(),
        senderPhone: form.senderPhone.trim(),
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        pickupCity: form.pickupCity.trim(),
        deliveryCity: form.deliveryCity.trim(),
        address: form.address.trim(),
        weight: Number(form.weight) || 1,
        codAmount: Number(form.codAmount) || 0,
        pickupPointId: form.pickupPointId || null,
      };
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <main className="brand-canvas min-h-screen overflow-hidden">
      <header className="premium-header fixed inset-x-0 top-0 z-40 transition-all duration-500">
        <div className={`premium-nav-shell mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 lg:px-7 ${scrolled ? 'h-15' : 'h-17'}`}>
          <a
            href="#top"
            className="flex items-center gap-2.5"
            aria-label="Dergo24, faqja kryesore"
          >
            <Logo />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            <a className="relative transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:text-primary hover:after:w-full" href="#sherbimet">Shërbimet</a>
            <a className="relative transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:text-primary hover:after:w-full" href="#si-funksionon">Si funksionon</a>
            <a className="relative transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:text-primary hover:after:w-full" href="#mbulim">Mbulimi</a>
            <a className="relative transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:text-primary hover:after:w-full" href="#kontakt">Kontakt</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {currentUser ? (
              <Link
                href="/account"
                className="flex h-11 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/90 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-500/50"
                title={`I identifikuar si ${currentUser.fullName}`}
              >
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600" />
                </span>
                <span className="max-w-[120px] truncate">{currentUser.fullName}</span>
                <span className="rounded bg-emerald-200/70 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900">Llogaria</span>
              </Link>
            ) : (
              <Link
                href="/account"
                className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-slate-100"
              >
                <UserRound className="size-4" /> Hyr / Llogaria
              </Link>
            )}
            <Button
              variant="ghost"
              className="h-11 px-4"
              onClick={goToTracking}
            >
              Gjurmo pakon
            </Button>
            <Button
              className="premium-button shine-button h-11 rounded-xl px-5 hover:-translate-y-0.5"
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
          <nav className="animate-in slide-in-from-top-3 border-t bg-white/95 px-5 py-5 shadow-2xl backdrop-blur-2xl duration-300 lg:hidden">
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
              {currentUser ? (
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>{currentUser.fullName}</span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Llogaria ime</span>
                </Link>
              ) : (
                <Link href="/account" onClick={() => setMenuOpen(false)}>
                  Hyr / Llogaria ime
                </Link>
              )}
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

      <section id="top" className="premium-hero relative pt-20 text-white">
        <div className="premium-grid pointer-events-none absolute inset-0" />
        <div className="premium-glow pointer-events-none absolute -left-40 top-20 size-[520px]" />
        <div className="mx-auto grid min-h-[760px] max-w-[1500px] lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex items-center px-5 py-20 lg:px-[max(2rem,calc((100vw-1280px)/2))] lg:pr-12">
            <div className="relative z-10 max-w-2xl" data-reveal="left">
              <div className="brand-kicker mb-7 text-xs font-bold uppercase tracking-[.14em]">
                Shpejt. Sigurt. Kudo.
              </div>
              <h1 className="brand-display text-balance text-5xl font-black leading-[.95] sm:text-6xl lg:text-[5.25rem]">
                Nga dera juaj,{' '}
                <em>në destinacion.</em>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65 sm:text-xl">
                Pako, dokumente, mobilje dhe ngarkesa biznesi në gjithë
                Shqipërinë — me kujdes në çdo kilometër.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="premium-button shine-button h-14 rounded-xl px-7 text-base font-bold hover:-translate-y-1"
                  onClick={() => setBookingOpen(true)}
                >
                  Dërgo një pako <ArrowRight className="size-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-14 rounded-xl border-white/20 bg-white/5 px-7 text-base font-bold text-white backdrop-blur-md hover:-translate-y-1 hover:border-white/35 hover:bg-white/10 hover:text-white"
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
          <div className="premium-frame relative min-h-[560px] overflow-hidden lg:my-6 lg:mr-6 lg:min-h-[710px] lg:rounded-[2rem]" data-reveal="right">
            <Image
              src="/dergo24-doorstep.jpeg"
              alt="Korrieri Dërgo24 dorëzon një pako në adresën e klientit"
              width={818}
              height={1280}
              className="hero-media absolute inset-0 size-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071b38]/75 via-transparent to-[#071b38]/10" />
            <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-[#071b38] to-transparent lg:block" />
            <div className="float-slow absolute bottom-10 left-5 right-5 rounded-2xl border border-white/20 bg-[#071b38]/75 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-8 sm:w-72">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-white"><Truck className="size-5" /></span>
                <div><p className="text-xs font-bold uppercase tracking-[.14em] text-white/50">Në lëvizje</p><p className="mt-1 font-black">Shqipëria, derë më derë.</p></div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-2 bg-primary" />
          </div>
        </div>
      </section>

      <section
        id="gjurmo"
        className="relative z-10 mx-auto -mt-16 max-w-6xl px-5 lg:px-8"
        data-reveal
      >
        <div className="glass-dark-panel relative overflow-hidden rounded-[2.5rem] border border-white/15 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="premium-glow pointer-events-none absolute -right-24 -top-32 size-96 opacity-70" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-primary/20 blur-3xl" />

          {/* Top Search Section */}
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  Gjurmim në kohë reale
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  Gjurmo dërgesën tënde
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Vendosni kodin e gjurmimit për të parë vendndodhjen, itinerarin dhe statusin live.
                </p>
              </div>

              <div className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 md:block">
                <span className="font-semibold text-white/50">Formati i kodit:</span>{' '}
                <span className="font-mono font-bold text-orange-400">D24-YY-XXXXXX</span>
              </div>
            </div>

            <form
              onSubmit={trackShipment}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <PackageCheck className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-orange-400" />
                <Input
                  value={trackingCode}
                  onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
                  placeholder="Vendosni kodin (p.sh. D24-26-AB12CD34)"
                  className="h-14 rounded-2xl border-white/15 bg-white/10 pl-12 pr-10 font-mono text-base font-bold uppercase tracking-wider text-white placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-white/40 focus:border-orange-400 focus:bg-white/15 focus:ring-4 focus:ring-orange-500/20"
                />
                {trackingCode && (
                  <button
                    type="button"
                    onClick={() => { setTrackingCode(''); setTracking(null); setTrackingError(''); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
                    aria-label="Pastro kodin"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                disabled={trackingLoading || !trackingCode.trim()}
                className="h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 text-base font-black text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02] hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
              >
                {trackingLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Duke kërkuar...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Gjurmo dërgesën <Search className="size-5" />
                  </span>
                )}
              </Button>
            </form>

            {trackingError && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
                <AlertCircle className="size-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-bold">{trackingError}</p>
                  <p className="text-xs text-red-300/80">Ju lutem kontrolloni kodin e dërgesës ose kontaktoni mbështetjen e klientit.</p>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE TRACKING RESULTS */}
          {tracking && (
            <div className="relative z-10 mt-8 space-y-6 border-t border-white/10 pt-8">
              {/* Shipment Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/50">Kodi i dërgesës</span>
                    <span className="font-mono text-base font-black tracking-wider text-orange-400">{tracking.shipment.trackingCode}</span>
                    <CopyTrackingButton value={tracking.shipment.trackingCode} compact dark />
                  </div>
                  {tracking.shipment.createdAt && (
                    <p className="text-xs text-white/60">
                      Regjistruar më: {formatTrackingTime(tracking.shipment.createdAt)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
                    tracking.shipment.status === 'U dorëzua'
                      ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : tracking.shipment.status === 'U anulua'
                      ? 'border border-red-500/40 bg-red-500/20 text-red-300'
                      : 'border border-orange-500/40 bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/20'
                  }`}>
                    {tracking.shipment.status === 'U dorëzua' ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : tracking.shipment.status === 'U anulua' ? (
                      <AlertCircle className="size-4 text-red-400" />
                    ) : (
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {tracking.shipment.status}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white/80">
                    <Zap className="size-3.5 text-amber-400" />
                    {tracking.shipment.service === 'express' ? 'Express (Prioritet)' : 'Standard (24–48h)'}
                  </span>
                </div>
              </div>

              {/* Visual 6-Step Milestone Stepper */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <p className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-white/50">
                  Ecuria e dërgesës
                </p>

                <div className="relative">
                  {/* Connecting Progress Bar */}
                  <div className="absolute top-5 left-4 right-4 hidden h-1 -translate-y-1/2 bg-white/10 sm:block">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(5, (getStageIndex(tracking.shipment.status) / (TRACKING_MILESTONES.length - 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  {/* Stepper Nodes */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 sm:gap-2">
                    {TRACKING_MILESTONES.map((milestone, idx) => {
                      const currentIdx = getStageIndex(tracking.shipment.status);
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={milestone.key}
                          className="relative flex flex-col items-center text-center group"
                        >
                          {/* Circle Icon */}
                          <div
                            className={`relative z-10 grid size-10 place-items-center rounded-full text-xs font-black transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                                : isCurrent
                                ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xl shadow-orange-500/50 ring-4 ring-orange-400/30 scale-110'
                                : 'border border-white/15 bg-white/5 text-white/40'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="size-5 stroke-[2.5]" />
                            ) : isCurrent ? (
                              <Truck className="size-5 text-white animate-pulse" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          {/* Titles */}
                          <p
                            className={`mt-3 text-xs font-black transition-colors ${
                              isCurrent
                                ? 'text-orange-400'
                                : isCompleted
                                ? 'text-white'
                                : 'text-white/40'
                            }`}
                          >
                            {milestone.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-white/50 hidden sm:block">
                            {isCompleted ? 'Përfunduar' : isCurrent ? 'Në proces' : 'Në pritje'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detail Cards Grid */}
              <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                {/* Left: Route & Package Specifications */}
                <div className="space-y-4">
                  {/* Route Visualizer Card */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Itinerari</p>
                    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          <MapPin className="size-5" />
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/50">Nisja</p>
                          <p className="font-black text-white sm:text-base">{tracking.shipment.pickupCity}</p>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col items-center px-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Direkt</span>
                        <div className="relative mt-1 flex w-full items-center">
                          <div className="h-0.5 w-full border-t border-dashed border-white/20" />
                          <Truck className="absolute left-1/2 size-4 -translate-x-1/2 text-orange-400 animate-pulse" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-white/50">Destinacioni</p>
                          <p className="font-black text-white sm:text-base">{tracking.shipment.deliveryCity}</p>
                        </div>
                        <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="size-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Package Metadata Card */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-white/50">
                        <Box className="size-4 text-orange-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Lloji i pakos</span>
                      </div>
                      <p className="mt-2 text-sm font-black text-white">{tracking.shipment.packageType || 'Pako standarde'}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-white/50">
                        <Zap className="size-4 text-orange-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Pesha</span>
                      </div>
                      <p className="mt-2 text-sm font-black text-white">{tracking.shipment.weightKg ? `${tracking.shipment.weightKg} kg` : 'Nën 2 kg'}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-white/50">
                        <Truck className="size-4 text-orange-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Dorëzimi</span>
                      </div>
                      <p className="mt-2 text-sm font-black text-white">
                        {tracking.shipment.deliveryMethod === 'pickup_point' ? 'Pikë Dergo24' : 'Derë më derë'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-white/50">
                        <ShieldCheck className="size-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Siguria</span>
                      </div>
                      <p className="mt-2 text-sm font-black text-emerald-300">Gjurmim i mbrojtur</p>
                    </div>
                  </div>
                </div>

                {/* Right: Detailed Tracking Events Log */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                      Historiku i detajuar
                    </p>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">
                      {tracking.events.length} ndryshime
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {tracking.events.map((item, index) => {
                      const isLatest = index === 0;

                      return (
                        <div
                          key={`${item.createdAt}-${item.status}-${index}`}
                          className={`relative rounded-xl border p-4 transition-all duration-200 ${
                            isLatest
                              ? 'border-orange-500/40 bg-orange-500/5 shadow-md shadow-orange-500/5'
                              : 'border-white/5 bg-white/2 hover:border-white/10'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`grid size-7 place-items-center rounded-lg text-xs font-black ${
                                  isLatest
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                                    : 'bg-white/10 text-white/50'
                                }`}
                              >
                                {isLatest ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-3.5" />}
                              </span>
                              <p className="text-sm font-black text-white">{item.status}</p>
                            </div>

                            {isLatest && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Më i fundit
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                            <span className="flex items-center gap-1 text-orange-300 font-semibold">
                              <MapPin className="size-3.5" /> {item.location}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-white/50">{formatTrackingTime(item.createdAt)}</span>
                          </div>

                          <p className="mt-2 text-xs leading-relaxed text-white/70">
                            {item.details}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE / MARKETING VALUE */}
          {!tracking && !trackingLoading && (
            <div className="relative z-10 mt-8 border-t border-white/10 pt-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-orange-500/30 hover:bg-white/10">
                  <div className="grid size-10 place-items-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Sparkles className="size-5" />
                  </div>
                  <h3 className="mt-3 font-black text-white">Gjurmim në Çdo Hap</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    Nga marrja në adresë deri te dorëzimi përfundimtar, shikoni statusin në sekondë.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-orange-500/30 hover:bg-white/10">
                  <div className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Truck className="size-5" />
                  </div>
                  <h3 className="mt-3 font-black text-white">Mbulim në 61 Bashki</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    Rrjet i gjerë në të gjithë territorin e Shqipërisë me dërgim të sigurt derë më derë.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-orange-500/30 hover:bg-white/10">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h3 className="mt-3 font-black text-white">Verifikim & Siguri</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    Konfirmim me nënshkrim dhe garanci për integritetin e çdo pakoe të dërguar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-4 pt-12 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Clock3, value: '24–48 orë', label: 'Dërgesa standarde' },
            { icon: MapPin, value: '61 bashki', label: 'Mbulim në Shqipëri' },
            { icon: PackageCheck, value: 'Online', label: 'Gjurmim i çdo pakoje' },
          ].map((stat, index) => (
            <div key={stat.label} data-reveal className={`brand-panel brand-metric premium-card stagger-${index + 1} flex items-center gap-4 rounded-2xl p-5`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-primary"><stat.icon className="size-5" /></span>
              <div><p className="text-lg font-black tracking-tight text-[#071b33]">{stat.value}</p><p className="mt-0.5 text-xs font-semibold text-slate-500">{stat.label}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="sherbimet" className="mx-auto max-w-7xl px-5 py-28 lg:px-8">
        <div data-reveal>
        <SectionTitle
          eyebrow="Jo vetëm pako"
          title="Transportojmë çdo gjë me kujdes."
          copy="Dy mënyra të qarta rezervimi: çmim i menjëhershëm për pako dhe ofertë e personalizuar për ngarkesa të mëdha."
        />
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article data-reveal="left" className="premium-card overflow-hidden rounded-3xl border bg-white">
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
          <article data-reveal="right" className="premium-card overflow-hidden rounded-3xl border border-white/5 bg-[#071b38] text-white">
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

      <section id="si-funksionon" className="relative overflow-hidden bg-[#071b38] py-28 text-white">
        <div className="premium-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="premium-glow pointer-events-none absolute -bottom-64 -right-48 size-[620px]" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-end" data-reveal>
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
          <div className="relative mt-16 grid gap-5 md:grid-cols-3">
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
                data-reveal
                className={`premium-card stagger-${Number(step.no)} relative rounded-3xl border border-white/10 bg-white/[.045] p-7 backdrop-blur-sm`}
              >
                <span className="absolute right-6 top-5 font-mono text-5xl font-black text-white/[.06]">
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
          <div data-reveal className="premium-card rounded-[2rem] border bg-white/90 p-7 md:p-12">
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
                      className="rounded-full border bg-background px-3 py-1.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    >
                      {city}
                    </span>
                  ))}
                  <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-white">
                    + të gjitha qytetet
                  </span>
                </div>
              </div>
              <div className="gallery-card relative overflow-hidden rounded-3xl bg-[#071b38]">
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

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal>
          <SectionTitle
            eyebrow="Ekipi Dergo24"
            title="Nga marrja deri te buzëqeshja."
            copy="Automjete dhe korrierë të identifikueshëm, kujdes në ngarkim dhe dorëzim direkt në adresë."
          />
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-[1.1fr_.9fr]">
            <div data-reveal="left" className="gallery-card group relative overflow-hidden rounded-3xl bg-[#071b33]">
              <Image src="/dergo24-loading.jpeg" alt="Ekipi Dërgo24 ngarkon porositë në automjet" width={1024} height={1280} className="h-[620px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071b33]/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">Marrje e kujdesshme</p><p className="mt-2 text-2xl font-black">Çdo pako nis e sigurt.</p></div>
            </div>
            <div data-reveal="right" className="gallery-card group relative overflow-hidden rounded-3xl bg-[#071b33] md:mt-16">
              <Image src="/dergo24-smile-delivery.jpeg" alt="Korrieri Dërgo24 dorëzon porosinë te klienti" width={1024} height={1280} className="h-[540px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071b33]/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">Dorëzim personal</p><p className="mt-2 text-2xl font-black">Deri në derën tuaj.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 pb-24 lg:px-8">
        <div data-reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white shadow-[0_30px_90px_rgba(244,90,10,.25)] md:px-12 md:py-14">
          <div className="premium-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">Gati kur jeni ju</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">Pakoja juaj meriton një udhëtim më të mirë.</h2>
            </div>
            <Button onClick={() => setBookingOpen(true)} className="shine-button h-14 shrink-0 rounded-xl bg-white px-7 text-base font-black text-[#071b33] shadow-xl hover:-translate-y-1 hover:bg-white/95">
              Rezervo dërgesën <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </section>

      <footer id="kontakt" className="bg-[#05152c] py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Logo dark />
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
          <div className="flex flex-wrap gap-4"><Link href="/terms" className="hover:text-white">Kushtet</Link><Link href="/privacy" className="hover:text-white">Privatësia</Link><Link href="/claims-policy" className="hover:text-white">Ankesat</Link></div>
        </div>
      </footer>

      {bookingOpen && (
        <BookingModal
          currentUser={currentUser}
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
  currentUser,
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
  currentUser: { id: string; fullName: string; email: string; phone?: string } | null;
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
  const [pickupPoints, setPickupPoints] = useState<Array<{ id: string; name: string; city: string; address: string; opening_hours: string }>>([]);
  const [addressMessage, setAddressMessage] = useState('');
  const [addressValid, setAddressValid] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    void fetch('/api/pickup-points').then(async (response) => {
      if (!response.ok) return;
      const body = await response.json() as { points: typeof pickupPoints };
      setPickupPoints(body.points);
    });
  }, []);

  async function validateAddress() {
    if (!form.address.trim()) {
      setAddressValid(false);
      setAddressMessage('Shkruani adresën para se ta verifikoni.');
      return;
    }

    setAddressValid(false);
    setAddressMessage('Duke verifikuar adresën...');
    try {
      const response = await fetch('/api/address/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: form.deliveryCity, address: form.address }),
      });
      const body = await response.json() as {
        valid?: boolean;
        city?: string;
        address?: string;
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || body.message || 'Adresa nuk mund të verifikohej.');

      setAddressValid(Boolean(body.valid));
      setAddressMessage(body.message || 'Adresa u verifikua.');
      if (body.valid) {
        if (body.city) field('deliveryCity', body.city);
        if (body.address) field('address', body.address);
      }
    } catch (error) {
      setAddressMessage(error instanceof Error ? error.message : 'Adresa nuk mund të verifikohej.');
    }
  }

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
        {currentUser && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/80 px-6 py-2.5 sm:px-8">
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              I identifikuar: {currentUser.fullName} ({currentUser.email})
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Porosia lidhet automatikisht me llogarinë tuaj</span>
          </div>
        )}
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
              <CopyTrackingButton value={booking.trackingCode} className="mt-3" />
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
                <div className="mt-2 flex items-center justify-between gap-3"><p className={`text-xs font-bold ${addressValid ? 'text-emerald-600' : 'text-slate-500'}`}>{addressMessage || 'Kontrolloni adresën para rezervimit.'}</p><button type="button" onClick={validateAddress} className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">Verifiko adresën</button></div>
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
              <FormInput
                label="Pagesë në dorëzim (Lekë)"
                value={form.codAmount}
                onChange={(v) => field('codAmount', v)}
                type="number"
                min="0"
                max="1000000"
                step="1"
                placeholder="0"
              />
              <FormInput label="Data e marrjes" value={form.pickupDate} onChange={(v) => field('pickupDate', v)} type="date" min={new Date().toISOString().slice(0, 10)} />
            </div>
            <p className="mb-3 mt-6 text-sm font-bold">Mënyra e dorëzimit</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[['home', 'Në adresën e marrësit'], ['pickup_point', 'Në një pikë Dergo24']].map(([value, label]) => <button type="button" key={value} onClick={() => { field('deliveryMethod', value); if (value === 'home') field('pickupPointId', ''); }} className={`rounded-2xl border p-4 text-left font-bold ${form.deliveryMethod === value ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : ''}`}>{label}</button>)}
            </div>
            {form.deliveryMethod === 'pickup_point' && <div className="mt-4"><FormSelect label="Pika e tërheqjes" value={form.pickupPointId} onChange={(value) => { field('pickupPointId', value); const point = pickupPoints.find((item) => item.id === value); if (point) { field('deliveryCity', point.city); field('address', point.address); setAddressValid(true); setAddressMessage('Adresa e pikës Dergo24 është e verifikuar.'); } }} options={pickupPoints.map((point) => point.id)} optionLabels={Object.fromEntries(pickupPoints.map((point) => [point.id, `${point.name} · ${point.city}`]))} /></div>}
            <p className="mb-3 mt-6 text-sm font-bold">Shërbimi</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: 'standard',
                  name: 'Standard',
                  copy: '24–48 orë · 200 L Tiranë / 300 L rrethe',
                },
                {
                  value: 'express',
                  name: 'Express',
                  copy: 'Prioritet brenda ditës (+100 Lekë)',
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
            <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 size-4 accent-orange-500" required />
              <span>Pranoj <Link href="/terms" target="_blank" className="font-black text-orange-600 underline">kushtet e shërbimit</Link>, <Link href="/privacy" target="_blank" className="font-black text-orange-600 underline">politikën e privatësisë</Link> dhe <Link href="/claims-policy" target="_blank" className="font-black text-orange-600 underline">rregullat e ankesave</Link>.</span>
            </label>
            <div className="mt-7 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Çmimi i llogaritur
                </p>
                <p className="mt-1 text-2xl font-black">{estimate} Lekë</p>
              </div>
              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
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

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Image
      src={dark ? '/dergo24-logo-dark.svg' : '/dergo24-logo-light.svg'}
      alt="Dërgo24"
      width={210}
      height={48}
      className="h-10 w-auto"
      priority
    />
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
  optionLabels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
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
        {!value && <option value="">Zgjidhni...</option>}
        {options.map((option) => (
          <option key={option} value={option}>{optionLabels?.[option] ?? option}</option>
        ))}
      </select>
    </label>
  );
}
