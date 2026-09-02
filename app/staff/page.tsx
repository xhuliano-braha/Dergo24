'use client';

import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  LogOut,
  Menu,
  PackageCheck,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  StaffAccount,
  StaffSettingsPanel,
} from '@/components/staff-settings-panel';

type Staff = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'support';
};

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  status: 'available' | 'assigned' | 'off_duty';
  active: boolean;
  created_at: string;
};

type Shipment = {
  id: string;
  tracking_code: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  pickup_city: string;
  delivery_city: string;
  delivery_address: string;
  package_type: string;
  weight_kg: number;
  service: 'standard' | 'express';
  status: string;
  quoted_price_all: number;
  driver_id: string | null;
  created_at: string;
  drivers: { full_name: string } | null;
};

type Quote = {
  id: string;
  reference_code: string;
  customer_name: string;
  phone: string;
  pickup_city: string;
  delivery_city: string;
  item_type: string;
  description: string;
  status: 'new' | 'contacted' | 'quoted' | 'accepted' | 'declined';
  quoted_price_all: number | null;
  created_at: string;
};

type DashboardData = {
  staff: Staff;
  shipments: Shipment[];
  quotes: Quote[];
  drivers: Driver[];
  staffAccounts: StaffAccount[];
};

const shipmentStatuses = [
  'Porosia u regjistrua',
  'Në pritje të marrjes',
  'U mor nga korrieri',
  'Në transport',
  'Në shpërndarje',
  'U dorëzua',
  'U anulua',
] as const;

const quoteStatuses = [
  ['new', 'E re'],
  ['contacted', 'U kontaktua'],
  ['quoted', 'Ofertë dërguar'],
  ['accepted', 'Pranuar'],
  ['declined', 'Refuzuar'],
] as const;

const driverStatuses = [
  ['available', 'I lirë'],
  ['assigned', 'Në dërgesë'],
  ['off_duty', 'Jashtë orarit'],
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('sq-AL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === 'U dorëzua' || status === 'accepted')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'U anulua' || status === 'declined')
    return 'bg-red-50 text-red-700 ring-red-200';
  if (status === 'Në transport' || status === 'Në shpërndarje')
    return 'bg-blue-50 text-blue-700 ring-blue-200';
  return 'bg-orange-50 text-orange-700 ring-orange-200';
}

async function apiRequest<T = Record<string, unknown>>(url: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(url, {
    ...options,
    headers,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Veprimi dështoi.');
  return body as T;
}

export default function StaffPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<
    'shipments' | 'quotes' | 'drivers' | 'settings'
  >('shipments');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextData = await apiRequest<DashboardData>('/api/staff/dashboard');
      setData(nextData);
    } catch (loadError) {
      setData(null);
      if (loadError instanceof Error && !loadError.message.includes('Sesioni'))
        setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  if (loading && !data)
    return (
      <main className="grid min-h-screen place-items-center bg-[#071b33] text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 size-8 animate-spin text-orange-400" />
          <p>Po hapim panelin...</p>
        </div>
      </main>
    );

  if (!data)
    return <LoginScreen onLogin={loadDashboard} initialError={error} />;

  const navItems = [
    { id: 'shipments' as const, label: 'Dërgesat', icon: Box, count: data.shipments.length },
    { id: 'quotes' as const, label: 'Ofertat', icon: Clock3, count: data.quotes.filter((quote) => quote.status === 'new').length },
    { id: 'drivers' as const, label: 'Korrierët', icon: Users, count: data.drivers.filter((driver) => driver.active).length },
    { id: 'settings' as const, label: 'Stafi & siguria', icon: Settings, count: data.staffAccounts.filter((account) => account.active).length },
  ];

  async function logout() {
    await apiRequest('/api/staff/auth', { method: 'DELETE' });
    setData(null);
  }

  return (
    <main className="min-h-screen bg-[#f3f6fa] text-[#10233d]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-[1500px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="grid size-10 place-items-center rounded-xl border border-slate-200 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Hap menunë"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/" className="text-xl font-black tracking-tight text-[#071b33]">
              DËRGO<span className="text-orange-500">24</span>
            </Link>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 sm:inline">
              PANELI I STAFIT
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{data.staff.fullName}</p>
              <p className="text-xs capitalize text-slate-500">{data.staff.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Dil</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside
          className={`${menuOpen ? 'fixed inset-x-4 top-22 z-40 flex shadow-2xl' : 'hidden'} h-fit flex-col rounded-2xl bg-[#071b33] p-3 text-white lg:sticky lg:top-22 lg:mx-6 lg:mt-6 lg:flex lg:w-64 lg:shrink-0`}
        >
          <div className="mb-2 flex items-center justify-between px-3 py-2 lg:hidden">
            <span className="font-bold">Navigimi</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Mbyll menunë"><X className="size-5" /></button>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${tab === item.id ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              <item.icon className="size-5" />
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{item.count}</span>
            </button>
          ))}
          <div className="mt-4 border-t border-white/10 p-3 text-xs leading-5 text-slate-400">
            <ShieldCheck className="mb-2 size-5 text-emerald-400" />
            Lidhje e sigurt me Supabase. Veprimet regjistrohen me llogarinë tuaj.
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-4 lg:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-[0.16em] text-orange-500">Operacionet sot</p>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Mirë se erdhe, {data.staff.fullName.split(' ')[0]}</h1>
            </div>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Rifresko
            </button>
          </div>

          <Stats data={data} />
          {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

          {tab === 'shipments' && (
            <ShipmentsPanel
              shipments={data.shipments}
              search={search}
              setSearch={setSearch}
              onSelect={setSelectedShipment}
            />
          )}
          {tab === 'quotes' && <QuotesPanel quotes={data.quotes} onUpdated={loadDashboard} />}
          {tab === 'drivers' && (
            <DriversPanel drivers={data.drivers} staff={data.staff} onUpdated={loadDashboard} />
          )}
          {tab === 'settings' && (
            <StaffSettingsPanel
              currentStaff={data.staff}
              accounts={data.staffAccounts}
              onUpdated={loadDashboard}
              onPasswordChanged={() => setData(null)}
            />
          )}
        </section>
      </div>

      {selectedShipment && (
        <ShipmentDialog
          shipment={selectedShipment}
          drivers={data.drivers}
          onClose={() => setSelectedShipment(null)}
          onUpdated={async () => { setSelectedShipment(null); await loadDashboard(); }}
        />
      )}
    </main>
  );
}

function LoginScreen({ onLogin, initialError }: { onLogin: () => Promise<void>; initialError: string }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/staff/auth', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });
      await onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Hyrja dështoi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#071b33] lg:grid-cols-2">
      <section className="hidden min-h-screen flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <Link href="/" className="text-2xl font-black">DËRGO<span className="text-orange-500">24</span></Link>
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Qendra operative</p>
          <h1 className="text-6xl font-black leading-[1.02] tracking-tight">Çdo dërgesë.<br />Një pamje e qartë.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Menaxho porositë, korrierët dhe ofertat e transportit nga një panel i vetëm.</p>
        </div>
        <p className="text-sm text-slate-500">Rruga Mikel Maruli, pranë Cassa Italia, Tiranë</p>
      </section>
      <section className="grid min-h-screen place-items-center bg-white px-5 py-12 lg:rounded-l-[2.5rem]">
        <form onSubmit={submit} className="w-full max-w-md">
          <Link href="/" className="mb-12 block text-center text-2xl font-black text-[#071b33] lg:hidden">DËRGO<span className="text-orange-500">24</span></Link>
          <div className="mb-8 grid size-14 place-items-center rounded-2xl bg-orange-500 text-white"><ShieldCheck className="size-7" /></div>
          <h2 className="text-3xl font-black tracking-tight">Hyr në panel</h2>
          <p className="mt-2 text-slate-500">Vetëm për stafin e autorizuar të Dergo24.</p>
          <label htmlFor="staff-login" className="mt-8 block text-sm font-bold">Përdoruesi</label>
          <input
            id="staff-login"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="username"
            required
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            placeholder="admin"
          />
          <label htmlFor="staff-password" className="mt-5 block text-sm font-bold">Fjalëkalimi</label>
          <input
            id="staff-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            minLength={8}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            placeholder="••••••••"
          />
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white hover:bg-orange-600 disabled:opacity-60">
            {submitting ? <RefreshCw className="size-5 animate-spin" /> : <>Hyr në panel <ArrowRight className="size-5" /></>}
          </button>
          <Link href="/" className="mt-6 block text-center text-sm font-bold text-slate-500 hover:text-[#071b33]">Kthehu te faqja kryesore</Link>
        </form>
      </section>
    </main>
  );
}

function Stats({ data }: { data: DashboardData }) {
  const cards = [
    { label: 'Dërgesa aktive', value: data.shipments.filter((item) => !['U dorëzua', 'U anulua'].includes(item.status)).length, icon: Truck, tone: 'bg-blue-600' },
    { label: 'Për t’u marrë', value: data.shipments.filter((item) => ['Porosia u regjistrua', 'Në pritje të marrjes'].includes(item.status)).length, icon: Box, tone: 'bg-orange-500' },
    { label: 'Dorëzuar', value: data.shipments.filter((item) => item.status === 'U dorëzua').length, icon: PackageCheck, tone: 'bg-emerald-600' },
    { label: 'Oferta të reja', value: data.quotes.filter((item) => item.status === 'new').length, icon: Clock3, tone: 'bg-violet-600' },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
          <div className={`mb-4 grid size-10 place-items-center rounded-xl text-white ${card.tone}`}><card.icon className="size-5" /></div>
          <p className="text-3xl font-black">{card.value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{card.label}</p>
        </article>
      ))}
    </div>
  );
}

function PanelHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">{eyebrow}</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div>
      {children}
    </div>
  );
}

function ShipmentsPanel({ shipments, search, setSearch, onSelect }: { shipments: Shipment[]; search: string; setSearch: (value: string) => void; onSelect: (shipment: Shipment) => void }) {
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return shipments;
    return shipments.filter((shipment) => [shipment.tracking_code, shipment.sender_name, shipment.recipient_name, shipment.pickup_city, shipment.delivery_city, shipment.status].some((value) => value.toLowerCase().includes(query)));
  }, [search, shipments]);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <PanelHeader eyebrow="Fluksi i dërgesave" title={`${filtered.length} dërgesa`}>
        <label className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 md:w-80">
          <Search className="size-4 text-slate-400" />
          <input aria-label="Kërko dërgesa" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Kod, klient, qytet..." />
        </label>
      </PanelHeader>
      <div className="space-y-3">
        {filtered.map((shipment) => (
          <button aria-label={`Menaxho dërgesën ${shipment.tracking_code}`} key={shipment.id} onClick={() => onSelect(shipment)} className="grid w-full gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-orange-300 hover:shadow-md md:grid-cols-[1.2fr_1.2fr_1fr_auto] md:items-center">
            <div><p className="font-mono text-xs font-black text-orange-600">{shipment.tracking_code}</p><p className="mt-1 font-bold">{shipment.sender_name}</p><p className="text-xs text-slate-500">{formatDate(shipment.created_at)}</p></div>
            <div><p className="text-sm font-bold">{shipment.pickup_city} <ArrowRight className="mx-1 inline size-3" /> {shipment.delivery_city}</p><p className="mt-1 text-xs text-slate-500">Për: {shipment.recipient_name}</p></div>
            <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(shipment.status)}`}>{shipment.status}</span><p className="mt-2 text-xs text-slate-500">{shipment.drivers?.full_name ?? 'Pa korrier'}</p></div>
            <div className="flex items-center justify-between gap-5 md:block md:text-right"><p className="font-black">{shipment.quoted_price_all} Lekë</p><p className="text-xs uppercase text-slate-500">{shipment.service}</p></div>
          </button>
        ))}
        {!filtered.length && <EmptyState text="Nuk u gjet asnjë dërgesë." />}
      </div>
    </article>
  );
}

function ShipmentDialog({ shipment, drivers, onClose, onUpdated }: { shipment: Shipment; drivers: Driver[]; onClose: () => void; onUpdated: () => Promise<void> }) {
  const [status, setStatus] = useState(shipment.status);
  const [driverId, setDriverId] = useState(shipment.driver_id ?? '');
  const [location, setLocation] = useState(shipment.delivery_city);
  const [details, setDetails] = useState('Statusi i dërgesës u përditësua nga stafi i Dergo24.');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await apiRequest(`/api/staff/shipments/${shipment.id}`, { method: 'PATCH', body: JSON.stringify({ status, driverId: driverId || null, location, details }) });
      await onUpdated();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Veprimi dështoi.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#071b33]/70 p-0 backdrop-blur-sm md:place-items-center md:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <dialog open aria-labelledby="shipment-dialog-title" className="relative m-0 max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-[#10233d] md:m-auto md:max-w-2xl md:rounded-3xl md:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-sm font-black text-orange-600">{shipment.tracking_code}</p><h2 id="shipment-dialog-title" className="mt-1 text-2xl font-black">Menaxho dërgesën</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-slate-100" aria-label="Mbyll"><X className="size-5" /></button></div>
        <div className="my-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Dërguesi:</span><br /><strong>{shipment.sender_name}</strong> · {shipment.sender_phone}</p><p><span className="text-slate-500">Marrësi:</span><br /><strong>{shipment.recipient_name}</strong> · {shipment.recipient_phone}</p><p><span className="text-slate-500">Itinerari:</span><br /><strong>{shipment.pickup_city} → {shipment.delivery_city}</strong></p><p><span className="text-slate-500">Adresa:</span><br /><strong>{shipment.delivery_address}</strong></p></div>
        <form onSubmit={save} className="space-y-4">
          <FormField label="Statusi"><select value={status} onChange={(event) => setStatus(event.target.value)} className="form-control">{shipmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          <FormField label="Korrieri"><select value={driverId} onChange={(event) => setDriverId(event.target.value)} className="form-control"><option value="">Pa korrier</option>{drivers.filter((driver) => driver.active).map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name} · {driver.phone}</option>)}</select></FormField>
          <FormField label="Vendndodhja"><input value={location} onChange={(event) => setLocation(event.target.value)} className="form-control" required /></FormField>
          <FormField label="Shënimi që sheh klienti"><textarea value={details} onChange={(event) => setDetails(event.target.value)} className="form-control min-h-24 resize-y" required /></FormField>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white hover:bg-orange-600 disabled:opacity-60">{saving ? <RefreshCw className="size-5 animate-spin" /> : <><CheckCircle2 className="size-5" /> Ruaj dhe njofto gjurmimin</>}</button>
        </form>
      </dialog>
    </div>
  );
}

function QuotesPanel({ quotes, onUpdated }: { quotes: Quote[]; onUpdated: () => Promise<void> }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <PanelHeader eyebrow="Transport i dedikuar" title={`${quotes.length} kërkesa për ofertë`} />
      <div className="grid gap-4 xl:grid-cols-2">
        {quotes.map((quote) => <QuoteCard key={quote.id} quote={quote} onUpdated={onUpdated} />)}
        {!quotes.length && <EmptyState text="Nuk ka kërkesa për ofertë." />}
      </div>
    </article>
  );
}

function QuoteCard({ quote, onUpdated }: { quote: Quote; onUpdated: () => Promise<void> }) {
  const [status, setStatus] = useState(quote.status);
  const [price, setPrice] = useState(quote.quoted_price_all?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setSaving(true); setError('');
    try { await apiRequest(`/api/staff/quotes/${quote.id}`, { method: 'PATCH', body: JSON.stringify({ status, quotedPrice: price ? Number(price) : null }) }); await onUpdated(); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Veprimi dështoi.'); }
    finally { setSaving(false); }
  }
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-black text-orange-600">{quote.reference_code}</p><h3 className="mt-1 text-lg font-black">{quote.customer_name}</h3><a href={`tel:${quote.phone}`} className="text-sm font-bold text-blue-600">{quote.phone}</a></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(quote.status)}`}>{quoteStatuses.find(([value]) => value === quote.status)?.[1]}</span></div>
      <p className="mt-4 text-sm font-bold">{quote.pickup_city} <ArrowRight className="mx-1 inline size-3" /> {quote.delivery_city} · {quote.item_type}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{quote.description}</p>
      <p className="mt-2 text-xs text-slate-400">{formatDate(quote.created_at)}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={status} onChange={(event) => setStatus(event.target.value as Quote['status'])} className="form-control">{quoteStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} className="form-control" placeholder="Çmimi në Lekë" /></div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <button onClick={save} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b33] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? <RefreshCw className="size-4 animate-spin" /> : 'Ruaj ofertën'}</button>
    </section>
  );
}

function DriversPanel({ drivers, staff, onUpdated }: { drivers: Driver[]; staff: Staff; onUpdated: () => Promise<void> }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canManage = staff.role !== 'support';
  async function create(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try { await apiRequest('/api/staff/drivers', { method: 'POST', body: JSON.stringify({ fullName, phone }) }); setFullName(''); setPhone(''); await onUpdated(); }
    catch (createError) { setError(createError instanceof Error ? createError.message : 'Veprimi dështoi.'); }
    finally { setSaving(false); }
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6"><PanelHeader eyebrow="Ekipi në terren" title={`${drivers.length} korrierë`} /><div className="space-y-3">{drivers.map((driver) => <DriverRow key={driver.id} driver={driver} canManage={canManage} onUpdated={onUpdated} />)}{!drivers.length && <EmptyState text="Nuk ka korrierë të regjistruar." />}</div></article>
      {canManage && <form onSubmit={create} className="h-fit rounded-2xl bg-[#071b33] p-6 text-white"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-orange-500"><UserPlus className="size-5" /></div><h2 className="text-xl font-black">Shto korrier</h2><p className="mt-1 text-sm text-slate-400">Regjistro një anëtar të ri të ekipit.</p><label htmlFor="driver-name" className="mt-6 block text-sm font-bold">Emri i plotë</label><input id="driver-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-orange-400" required /><label htmlFor="driver-phone" className="mt-4 block text-sm font-bold">Telefoni</label><input id="driver-phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-orange-400" placeholder="+355 69..." required />{error && <p className="mt-3 text-sm font-semibold text-red-300">{error}</p>}<button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black disabled:opacity-60">{saving ? <RefreshCw className="size-4 animate-spin" /> : 'Shto në ekip'}</button></form>}
    </div>
  );
}

function DriverRow({ driver, canManage, onUpdated }: { driver: Driver; canManage: boolean; onUpdated: () => Promise<void> }) {
  const [status, setStatus] = useState(driver.status);
  const [active, setActive] = useState(driver.active);
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); try { await apiRequest(`/api/staff/drivers/${driver.id}`, { method: 'PATCH', body: JSON.stringify({ status, active }) }); await onUpdated(); } finally { setSaving(false); } }
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_180px_auto] md:items-center"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-orange-100 font-black text-orange-600">{driver.full_name.charAt(0)}</div><div><p className="font-black">{driver.full_name}</p><a href={`tel:${driver.phone}`} className="text-sm text-slate-500">{driver.phone}</a></div></div><select disabled={!canManage} value={status} onChange={(event) => setStatus(event.target.value as Driver['status'])} className="form-control disabled:opacity-60">{driverStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{canManage && <div className="flex gap-2"><button onClick={() => setActive((value) => !value)} className={`rounded-xl px-3 py-2 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Aktiv' : 'Joaktiv'}</button><button onClick={save} disabled={saving || (status === driver.status && active === driver.active)} className="rounded-xl bg-[#071b33] px-3 py-2 text-xs font-black text-white disabled:opacity-30">Ruaj</button></div>}</div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span>{children}</label>; }
function EmptyState({ text }: { text: string }) { return <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 text-center text-sm font-semibold text-slate-400">{text}</div>; }
