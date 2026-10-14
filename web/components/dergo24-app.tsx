'use client';

import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Box,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Globe,
  Headphones,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyTrackingButton } from '@/components/copy-tracking-button';


const homeFaqs = [
  {
    question: 'Sa kushton dërgimi i një pakoje në Tiranë dhe në rrethe?',
    answer: 'Brenda qytetit të Tiranës tarifa është vetëm 200 Lekë për pako deri në 2 kg. Për dërgesat midis Tiranës dhe të gjitha rretheve të Shqipërisë (ose midis rretheve) çmimi është fiks 300 Lekë. Çdo kg shtesë mbi 2 kg llogaritet me +50 Lekë/kg.',
  },
  {
    question: 'Si funksionon shërbimi i Pagesës në Dorëzim (COD) për shitësit?',
    answer: 'Korrieri ynë merr paratë në dorëzim nga blerësi (cash ose POS) dhe ato transferohen automatikisht në llogarinë tuaj bankare brenda 24-48 orëve me faturë dhe raportim të plotë dixhital.',
  },
  {
    question: 'A vjen korrieri te dera ime apo duhet ta dërgoj vetë?',
    answer: 'Marrja e pakos në adresën tuaj (shtëpi, dyqan, zyrë apo magazinë) është plotësisht FALAS për çdo rezervim online në të gjithë Shqipërinë. Gjithashtu, mund ta sillni ose tërhiqni vetë pakon direkt pranë Terminalit tonë Qendror te Casa Italia në Tiranë.',
  },
  {
    question: 'Sa vonon dërgesa deri në mbërritje?',
    answer: 'Në Tiranë dërgesat dorëzohen brenda ditës ose maksimalisht 24 orë. Në 61 bashkitë e Shqipërisë dorëzimi realizohet brenda 24 deri në 48 orë.',
  },
  {
    question: 'A ofroni zbritje dhe marrëveshje për dyqanet online me volum?',
    answer: 'Po! Dyqanet online dhe bizneset që dërgojnë rregullisht përfitojnë zbritje deri në 30%, likujdim të përshpejtuar COD, menaxher llogarie dhe integrim API me platformat e tyre.',
  },
];

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [calcPickup, setCalcPickup] = useState('Tiranë');
  const [calcDelivery, setCalcDelivery] = useState('Durrës');
  const [calcWeight, setCalcWeight] = useState('1');
  const [calcService, setCalcService] = useState<'standard' | 'express'>('standard');

  const quickEstimate = useMemo(() => {
    const isTirana = (c?: string) =>
      (c ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase() === 'tirane';
    const isLocal = isTirana(calcPickup) && isTirana(calcDelivery);
    const base = isLocal ? 200 : 300;
    const extraWeight = Math.max(0, Math.ceil(Number(calcWeight) || 1) - 2) * 50;
    const expressExtra = calcService === 'express' ? 100 : 0;
    return base + extraWeight + expressExtra;
  }, [calcPickup, calcDelivery, calcWeight, calcService]);

  const handleQuickBook = () => {
    setForm((prev) => ({
      ...prev,
      pickupCity: calcPickup,
      deliveryCity: calcDelivery,
      weight: calcWeight,
      service: calcService,
    }));
    setBookingOpen(true);
  };

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
        <div className="border-b border-white/10 bg-[#040e1e] px-4 py-1.5 text-xs text-white/80 hidden sm:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Sparkles className="size-3.5" /> 1,840+ dërgesa këtë javë
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-white/60">
                <Star className="size-3.5 fill-amber-400 text-amber-400" /> 4.9/5 nga 12,000+ klientë
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="size-3.5" /> Likujdim COD brenda 24h
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-white/70">
              <Link href="/pikat" className="hover:text-white transition-colors">📍 Casa Italia, Tiranë</Link>
              <span className="text-white/20">·</span>
              <a href="tel:+355698012388" className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors">
                <Phone className="size-3" /> +355 69 801 2388
              </a>
            </div>
          </div>
        </div>
        <div className={`premium-nav-shell mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 lg:px-7 ${scrolled ? 'h-15' : 'h-17'}`}>
          <a
            href="#top"
            className="flex items-center gap-2.5"
            aria-label="Dergo24, faqja kryesore"
          >
            <Logo />
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
            <a className="relative transition-colors hover:text-primary" href="#sherbimet">Shërbimet</a>
            <a className="relative transition-colors hover:text-primary" href="#kalkulatori">Kalkulatori</a>
            <a className="relative transition-colors hover:text-primary" href="#flota">Flota</a>
            <a className="relative transition-colors hover:text-primary" href="#biznes">Për Biznese</a>
            <a className="relative transition-colors hover:text-primary" href="#harta">Pikat & Harta</a>
            <a className="relative transition-colors hover:text-primary" href="#faq">FAQ</a>
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
              <a href="#kalkulatori" onClick={() => setMenuOpen(false)}>
                Llogaritësi i Çmimit
              </a>
              <a href="#flota" onClick={() => setMenuOpen(false)}>
                Flota & Terminali
              </a>
              <a href="#biznes" onClick={() => setMenuOpen(false)}>
                Dërgo24 për Biznese (B2B)
              </a>
              <a href="#harta" onClick={() => setMenuOpen(false)}>
                Harta & Qendrat
              </a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>
                Pyetje të Shpeshta
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

      {/* QUICK RATE ESTIMATOR WIDGET */}
      <section id="kalkulatori" className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div data-reveal className="relative overflow-hidden rounded-[2.5rem] border border-orange-500/20 bg-gradient-to-br from-[#071b38] to-[#040e1e] p-7 text-white shadow-2xl sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-orange-400">
                <Zap className="size-3.5" /> Llogaritësi i menjëhershëm
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Shiko çmimin e saktë para se të porosisësh.
              </h2>
              <p className="mt-3 text-sm text-white/70 leading-relaxed max-w-lg">
                Zgjidhni qytetin e nisjes dhe destinacionin për të parë tarifën fikse pa asnjë komision të fshehur.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xl font-black text-orange-400">200 L</p>
                  <p className="text-[11px] text-white/60 font-semibold">Tiranë e brendshme</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xl font-black text-amber-400">300 L</p>
                  <p className="text-[11px] text-white/60 font-semibold">Tiranë ↔ Durrës</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xl font-black text-white">300 L</p>
                  <p className="text-[11px] text-white/60 font-semibold">61 Bashki Rrethe</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xl font-black text-emerald-400">FALAS</p>
                  <p className="text-[11px] text-white/60 font-semibold">Marrja te dera</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl sm:p-8">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70">Qyteti i nisjes</span>
                    <select
                      value={calcPickup}
                      onChange={(e) => setCalcPickup(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-[#071b33] px-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c} className="bg-[#071b33] text-white">{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70">Destinacioni</span>
                    <select
                      value={calcDelivery}
                      onChange={(e) => setCalcDelivery(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-[#071b33] px-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c} className="bg-[#071b33] text-white">{c}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70">Pesha e përafërt</span>
                    <select
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/20 bg-[#071b33] px-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="1">Deri 2 kg (Standard)</option>
                      <option value="3">3 kg (+50 Lekë)</option>
                      <option value="5">5 kg (+150 Lekë)</option>
                      <option value="10">10 kg (+400 Lekë)</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70">Shpejtësia</span>
                    <select
                      value={calcService}
                      onChange={(e) => setCalcService(e.target.value as 'standard' | 'express')}
                      className="h-12 w-full rounded-xl border border-white/20 bg-[#071b33] px-3 text-sm font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="standard">Standard (24–48 orë)</option>
                      <option value="express">Express brenda ditës (+100 L)</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 rounded-2xl bg-white/10 p-5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase font-bold text-white/60">Tarifa e Llogaritur</p>
                    <p className="text-3xl font-black text-orange-400">{quickEstimate} Lekë</p>
                  </div>
                  <Button
                    onClick={handleQuickBook}
                    className="h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 font-black text-white shadow-lg hover:scale-105 transition"
                  >
                    Dërgo Tani <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
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

      {/* FLEET SHOWCASE */}
      <section id="flota" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div data-reveal>
          <SectionTitle
            eyebrow="Infrastruktura & Logjistika"
            title="Flotë moderne. Terminal qendror në Tiranë."
            copy="Mbi 45 furgonë modernë të pajisur me GPS telematikë dhe një qendër e dedikuar logjistike për shpërndarje pa vonesa në çdo cep të Shqipërisë."
          />
        </div>

        <div className="mt-12 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl lg:grid lg:grid-cols-[1.2fr_.8fr]">
          <div className="relative min-h-[380px] lg:min-h-[500px]">
            <Image
              src="/dergo24-fleet.jpg"
              alt="Flota e furgonëve Dërgo24 te Terminali Qendror Logjistik në Tiranë"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-6 left-6 rounded-xl border border-white/20 bg-[#071b38]/85 px-4 py-2.5 backdrop-blur-md text-white lg:hidden">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Terminali Qendror</p>
              <p className="text-sm font-black">Tiranë — Rrjeti Kombëtar</p>
            </div>
          </div>

          <div className="flex flex-col justify-between p-8 sm:p-12 bg-slate-50/70">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase text-orange-800">
                <Truck className="size-3.5 text-orange-600" /> Flota Dërgo24
              </span>
              <h3 className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl">
                Nisje të përditshme me orare fikse.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Furgonët tanë nisen çdo mëngjes drejt të gjitha akseve kombëtare: Veri (Shkodër, Lezhë, Kukës), Qendër (Durrës, Elbasan) dhe Jug (Fier, Vlorë, Berat, Korçë, Gjirokastër, Sarandë).
              </p>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-600 font-bold text-sm">01</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Monitorim Satelitor GPS</h4>
                    <p className="text-xs text-slate-500">Çdo mjet gjurmohet në kohë reale për saktësi maksimale të orarit të mbërritjes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-600 font-bold text-sm">02</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Kondicionim & Kujdes për Mallrat</h4>
                    <p className="text-xs text-slate-500">Hapësirë e pastër, izolim termik dhe rafte të posaçme për dërgesa të brishta.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-600 font-bold text-sm">03</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Dorëzim me Telefonatë Paraprake</h4>
                    <p className="text-xs text-slate-500">Korrieri njofton marrësin 15–30 minuta para mbërritjes për dorëzim të qetë.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">Koha mesatare e dorëzimit</p>
                <p className="text-lg font-black text-slate-900">18.4 Orë në Shqipëri</p>
              </div>
              <Button onClick={() => setBookingOpen(true)} className="h-11 px-5 font-bold">
                Rezervo dërgesë <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* B2B SHOWCASE */}
      <section id="biznes" className="bg-[#05152c] py-24 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-1/4 size-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
        
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <div data-reveal="left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-black uppercase text-orange-400">
                <Building2 className="size-3.5" /> Dërgo24 për Biznese & E-Commerce
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Partneri numër 1 për shitjet online në Shqipëri.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/65">
                Shisni në Instagram, TikTok apo në dyqan online? Ne marrim përsipër të gjithë zinxhirin e dërgesave: nga marrja falas në dyqanin tuaj deri te likujdimi i menjëhershëm i pagesave COD në llogarinë bankare.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="grid size-10 place-items-center rounded-xl bg-orange-500/20 text-orange-400">
                    <CreditCard className="size-5" />
                  </div>
                  <h4 className="mt-3 font-black text-white">Likujdim COD 24h</h4>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Paratë e mbledhura në dorëzim transferohen automatikisht në llogari bankare brenda 24-48 orëve.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Truck className="size-5" />
                  </div>
                  <h4 className="mt-3 font-black text-white">Marrje Falas</h4>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Korrieri vjen çdo ditë në orar fiks te magazina ose dyqani juaj pa asnjë pagesë shtesë.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Award className="size-5" />
                  </div>
                  <h4 className="mt-3 font-black text-white">Tarifa me Zbritje</h4>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Çmime me zbritje volumi deri në 30% për shitësit e rregullt dhe faturë tatimore mujore.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Globe className="size-5" />
                  </div>
                  <h4 className="mt-3 font-black text-white">API & Integrim</h4>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">
                    Lidhje e lehtë me WooCommerce, Shopify apo sistemin tuaj për krijim automatik fletë-dërgesash.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button onClick={() => setQuoteOpen(true)} className="h-12 rounded-xl bg-primary px-6 font-bold hover:bg-orange-600">
                  Kërko marrëveshje biznesi <ArrowRight />
                </Button>
                <Link href="/b2b" className="inline-flex h-12 items-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-bold text-white hover:bg-white/10 transition">
                  Mëso më shumë rreth B2B
                </Link>
              </div>
            </div>

            <div data-reveal="right" className="relative">
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl">
                <Image
                  src="/dergo24-b2b.jpg"
                  alt="Korrieri Dërgo24 dorëzon porosi në dyqan mode në Tiranë"
                  width={1024}
                  height={768}
                  className="h-[520px] w-full object-cover"
                />
                <div className="p-6 bg-[#071b38]/90 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Klientë të lumtur</p>
                    <p className="text-base font-black text-white">Mbi 450 dyqane online i besojnë Dërgo24</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                    98.6% Sukses Dorëzimi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SORTING HUB & TEAM GALLERY */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal>
            <SectionTitle
              eyebrow="Teknologji & Ekipi"
              title="Qendra e sortimit dhe kujdesi në çdo hap."
              copy="Nga skanimi automatik me barkod te përzgjedhja e kujdesshme dhe dorëzimi personal në adresë."
            />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div data-reveal className="gallery-card group relative overflow-hidden rounded-3xl bg-[#071b33]">
              <Image src="/dergo24-hub.jpg" alt="Qendra moderne e sortimit dhe trajtimit të pakove Dërgo24" width={1024} height={768} className="h-[460px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071b33]/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">Hapi 1</span>
                <p className="mt-2 text-xl font-black">Sortim & Skanim Automatik</p>
                <p className="mt-1 text-xs text-white/60">Skanim i menjëhershëm me barkod për transparencë totale.</p>
              </div>
            </div>

            <div data-reveal className="gallery-card group relative overflow-hidden rounded-3xl bg-[#071b33]">
              <Image src="/dergo24-loading.jpeg" alt="Ekipi Dërgo24 ngarkon porositë në automjet" width={1024} height={1280} className="h-[460px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071b33]/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">Hapi 2</span>
                <p className="mt-2 text-xl font-black">Ngarkim i Kujdesshëm</p>
                <p className="mt-1 text-xs text-white/60">Sigurim i paketimit dhe rafte të posaçme për dërgesa të brishta.</p>
              </div>
            </div>

            <div data-reveal className="gallery-card group relative overflow-hidden rounded-3xl bg-[#071b33]">
              <Image src="/dergo24-smile-delivery.jpeg" alt="Korrieri Dërgo24 dorëzon porosinë te klienti" width={1024} height={1280} className="h-[460px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071b33]/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">Hapi 3</span>
                <p className="mt-2 text-xl font-black">Dorëzim Personal</p>
                <p className="mt-1 text-xs text-white/60">Deri në derën tuaj me konfirmim dixhital dhe buzëqeshje.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION HUBS & MAP SECTION */}
      <section id="harta" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 bg-slate-50/70 border-y border-slate-200">
        <div data-reveal>
          <SectionTitle
            eyebrow="Vendndodhja & Harta"
            title="Terminali Qendror — Casa Italia, Tiranë."
            copy="Pika jonë kryesore operacionale në Tiranë për marrje pakosh, drop-off ekspres dhe shërbim të menjëhershëm. Nga ky terminal mbulojmë me dërgesa derë më derë të gjithë Shqipërinë!"
          />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Hub Info Card on Left */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                  HQ · Pika e Vetme Operacionale
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Hapur sot deri në 20:00
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black text-slate-900">
                Terminali Qendror — Casa Italia
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-700 flex items-start gap-2">
                <span className="text-orange-500 text-base">📍</span>
                <span>Rruga Mikel Maruli, pranë Casa Italia, Tiranë</span>
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">🕒 Oraret:</span>
                  <span>Hënë – Shtunë: 08:00 – 20:00 · Diel: 09:00 – 15:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">📞 Telefon:</span>
                  <a href="tel:+355698012388" className="font-bold text-orange-600 hover:underline">
                    +355 69 801 2388
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">✉️ Email:</span>
                  <a href="mailto:info@dergo24.com" className="hover:underline font-medium">
                    info@dergo24.com
                  </a>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                  Shërbimet e disponueshme në pikë:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Tërheqje & Dorëzim Pakosh',
                    'Drop-off E-Commerce',
                    'Pagesa POS & CASH',
                    'Shërbim Express 24h',
                    'Paketim i Sigurt',
                  ].map((srv) => (
                    <span
                      key={srv}
                      className="rounded-lg bg-orange-50 border border-orange-200/80 px-2.5 py-1 text-xs font-semibold text-orange-900"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Nationwide Delivery Notice */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#071b38] to-[#0c2e5c] p-5 text-white">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    Mbulim Kombëtar në 61 Bashki
                  </p>
                  <p className="mt-1 text-xs text-white/80 leading-relaxed">
                    Edhe pse pika jonë pritëse për momentin ndodhet te Casa Italia në Tiranë, korrierët tanë vijnë direkt te dera juaj për marrje dhe dorëzim në çdo qytet brenda 24 orëve!
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-black text-white hover:bg-orange-600 transition shadow"
                    >
                      Rezervo Marrje te Dera <ArrowRight className="size-3.5" />
                    </button>
                    <a
                      href="tel:+355698012388"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
                    >
                      <Phone className="size-3" /> 069 801 2388
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map on Right */}
          <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Hapur sot deri në 20:00
                </span>
                <h3 className="mt-2 text-xl font-black text-slate-900">
                  Terminali Qendror — Casa Italia, Tiranë
                </h3>
              </div>
              <a
                href="https://maps.google.com/?q=Casa+Italia,+Tirana,+Albania"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-orange-600 transition"
              >
                Merr Udhëzimet <ArrowUpRight className="size-4" />
              </a>
            </div>

            {/* Map Frame */}
            <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl border border-slate-200 min-h-[380px] bg-slate-100">
              <iframe
                src="https://maps.google.com/maps?q=Casa+Italia,+Tirana,+Albania&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                className="size-full min-h-[380px] border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Harta Terminali Qendror Casa Italia Tirane"
              />
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-[#071b38]/90 px-3.5 py-2 text-white text-xs backdrop-blur-md border border-white/20">
                <p className="font-black">Dërgo24 — Casa Italia, Tiranë</p>
                <p className="text-white/70 text-[11px]">Rruga Mikel Maruli, pranë Casa Italia</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <a href="tel:+355698012388" className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-orange-600">
                <Headphones className="size-3.5 text-orange-500" /> Asistencë në pikë: +355 69 801 2388
              </a>
              <Link href="/pikat" className="font-bold text-orange-600 hover:underline">
                Më shumë mbi pikën tonë ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
        <div data-reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Pyetje të Shpeshta</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
            Gjithçka që duhet të dini për dërgesën.
          </h2>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            Keni një pyetje para se të rezervoni? Këtu gjeni përgjigjet kryesore rreth tarifave, orareve dhe pagesave.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {homeFaqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-black text-slate-900"
                >
                  <span className="text-base sm:text-lg">{faq.question}</span>
                  <ChevronDown className={`size-5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 p-5 pt-3 text-sm leading-relaxed text-slate-600 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 transition"
          >
            Shiko qendrën e plotë të ndihmës & FAQ <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-white px-5 pb-24 lg:px-8">
        <div data-reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-12 text-white shadow-[0_30px_90px_rgba(244,90,10,.25)] md:px-12 md:py-14">
          <div className="premium-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/80">Gati kur jeni ju</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">Pakoja juaj meriton një udhëtim më të mirë.</h2>
              <p className="mt-3 text-sm text-white/80">Rezervoni online brenda 60 sekondave. Korrieri vjen te dera juaj.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setBookingOpen(true)} className="shine-button h-14 shrink-0 rounded-xl bg-white px-7 text-base font-black text-[#071b33] shadow-xl hover:-translate-y-1 hover:bg-white/95">
                Dërgo një pako <ArrowRight className="size-5" />
              </Button>
              <Button onClick={() => setQuoteOpen(true)} variant="outline" className="h-14 shrink-0 rounded-xl border-white/30 bg-white/10 px-7 text-base font-black text-white hover:bg-white/20">
                Kërko Ofertë Biznesi
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE HIGH-END FOOTER */}
      <footer id="kontakt" className="bg-[#040e1e] pt-20 pb-12 text-white border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 pb-16 border-b border-white/10">
            {/* Col 1: Brand & Certification */}
            <div className="lg:col-span-2 pr-4">
              <Logo dark />
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55">
                Dërgo24 është platforma kryesore shqiptare e shërbimeve postare dhe korrierit ekspres. Mbulim në 61 bashki me marrje falas te dera dhe likujdim automatik COD brenda 24 orëve.
              </p>

              {/* License Badge */}
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 max-w-md">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-500/20 text-orange-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Shërbim Postar i Licencuar</p>
                  <p className="text-[11px] text-white/50">Në përputhje me Ligjin nr. 46/2015 dhe rregullat e AKEP.</p>
                </div>
              </div>

              {/* Accepted Payments */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5">
                  Mënyrat e Pagesës
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">Cash në dorëzim (COD)</span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">Visa</span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">Mastercard</span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">Transfertë Bankare</span>
                </div>
              </div>
            </div>

            {/* Col 2: Shërbimet */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
                Shërbimet
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                <li><button type="button" onClick={() => setBookingOpen(true)} className="hover:text-white transition">Dërgesa Standarde (24-48h)</button></li>
                <li><button type="button" onClick={() => setBookingOpen(true)} className="hover:text-white transition">Dërgesa Express (Brenda Ditës)</button></li>
                <li><button type="button" onClick={() => setQuoteOpen(true)} className="hover:text-white transition">Mobilje & Ngarkesa të Mëdha</button></li>
                <li><Link href="/b2b" className="hover:text-white transition">Pagesa në Dorëzim (COD)</Link></li>
                <li><Link href="/b2b" className="hover:text-white transition">Zgjidhje për E-Commerce</Link></li>
                <li><Link href="/tarifat" className="hover:text-white transition">Sigurimi i Pakove</Link></li>
              </ul>
            </div>

            {/* Col 3: Kompania */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
                Kompania
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                <li><Link href="/rreth-nesh" className="hover:text-white transition">Rreth Dërgo24</Link></li>
                <li><Link href="/tarifat" className="hover:text-white transition">Tarifat & Çmimet</Link></li>
                <li><Link href="/pikat" className="hover:text-white transition">Pikat & Qendrat Logjistike</Link></li>
                <li><Link href="/b2b" className="hover:text-white transition">Partneritete Tregtare</Link></li>
                <li><Link href="/courier" className="hover:text-white transition">Bëhu Korrier (Punësim)</Link></li>
                <li><Link href="/account" className="hover:text-white transition">Portali i Klientit</Link></li>
                <li><Link href="/staff" className="hover:text-white transition">Hyrja e Stafit</Link></li>
              </ul>
            </div>

            {/* Col 4: Kontakt & Suport */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">
                Kontakt & Suport
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/60">
                <p className="font-semibold text-white">📍 Terminali Qendror (HQ):</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Rruga Mikel Maruli, pranë Casa Italia, Tiranë, Shqipëri
                </p>

                <p className="font-semibold text-white pt-2">📞 Telefon & WhatsApp:</p>
                <p><a href="tel:+355698012388" className="font-bold text-orange-400 hover:underline">+355 69 801 2388</a></p>

                <p className="font-semibold text-white pt-2">✉️ Email zyrtar:</p>
                <p><a href="mailto:info@dergo24.com" className="hover:text-white transition">info@dergo24.com</a></p>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/50">Orari i Operacioneve:</p>
                  <p className="text-xs text-white/80 mt-0.5">Hënë – Shtunë: 08:00 – 20:00</p>
                  <p className="text-xs text-white/80">E Diel: 09:00 – 15:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-footer bottom bar */}
          <div className="mt-8 flex flex-col gap-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Dërgo24 Sh.p.k. Të gjitha të drejtat të rezervuara.</p>
            <div className="flex flex-wrap gap-5 font-medium">
              <Link href="/terms" className="hover:text-white transition">Kushtet e Shërbimit</Link>
              <Link href="/privacy" className="hover:text-white transition">Politika e Privatësisë</Link>
              <Link href="/claims-policy" className="hover:text-white transition">Politika e Ankesave</Link>
              <Link href="/faq" className="hover:text-white transition">FAQ</Link>
              <a href="#top" className="hover:text-orange-400 transition font-bold">Kthehu në krye ↑</a>
            </div>
          </div>
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

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
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <dialog
        open
        aria-labelledby="booking-dialog-title"
        className="relative m-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200 sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.13em] text-primary">
              Rezervim online
            </p>
            <h2 id="booking-dialog-title" className="mt-1 text-2xl font-black">
              Dërgo një pako
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none"
            aria-label="Mbyll"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
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
    </div>
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <dialog
        open
        aria-labelledby="quote-dialog-title"
        className="relative m-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200 sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.13em] text-primary">
              Transport i dedikuar
            </p>
            <h2 id="quote-dialog-title" className="mt-1 text-2xl font-black">
              Kërko ofertë
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none"
            aria-label="Mbyll"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
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
    </div>
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
