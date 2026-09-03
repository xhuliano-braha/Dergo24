'use client';

import { PointerEvent as ReactPointerEvent, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Box,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  LocateFixed,
  Menu,
  MessageCircle,
  PenLine,
  PackageCheck,
  Printer,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Star,
  Truck,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  StaffAccount,
  StaffSettingsPanel,
} from '@/components/staff-settings-panel';
import { CopyTrackingButton } from '@/components/copy-tracking-button';

type Staff = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'support' | 'courier';
};

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  status: 'available' | 'assigned' | 'off_duty';
  active: boolean;
  staff_id: string | null;
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
  cod_amount_all: number;
  cod_status: 'not_required' | 'pending' | 'collected' | 'settled';
  driver_id: string | null;
  pickup_date: string | null;
  delivery_window: string;
  delivery_method: 'home' | 'pickup_point';
  pickup_point_id: string | null;
  address_validated: boolean;
  route_order: number | null;
  created_at: string;
  drivers: { full_name: string } | null;
  pickup_points: { name: string; address: string } | null;
  delivery_proofs: { recipient_name: string; delivered_at: string; cod_collected_all: number } | null;
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

type Claim = {
  id: string;
  shipment_id: string;
  claim_type: 'damaged' | 'lost' | 'delayed' | 'other';
  description: string;
  requested_refund_all: number;
  approved_refund_all: number | null;
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'refunded';
  staff_notes: string | null;
  created_at: string;
  shipments: { tracking_code: string; recipient_name: string } | null;
};

type Rating = {
  id: string;
  driver_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  drivers: { full_name: string } | null;
  shipments: { tracking_code: string } | null;
};

type PickupPoint = { id: string; name: string; city: string; address: string; opening_hours: string; active: boolean };

type DashboardData = {
  staff: Staff;
  shipments: Shipment[];
  quotes: Quote[];
  drivers: Driver[];
  staffAccounts: StaffAccount[];
  claims: Claim[];
  ratings: Rating[];
  pickupPoints: PickupPoint[];
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
    'shipments' | 'quotes' | 'drivers' | 'operations' | 'claims' | 'reports' | 'settings'
  >('shipments');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [proofShipment, setProofShipment] = useState<Shipment | null>(null);

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
    { id: 'operations' as const, label: 'Planifikimi', icon: CalendarDays, count: data.shipments.filter((shipment) => shipment.pickup_date === new Date().toISOString().slice(0, 10)).length },
    { id: 'claims' as const, label: 'Ankesat', icon: ShieldAlert, count: data.claims.filter((claim) => ['new', 'reviewing'].includes(claim.status)).length },
    { id: 'reports' as const, label: 'Raportet', icon: BarChart3, count: data.shipments.filter((shipment) => shipment.cod_status === 'collected').length },
    { id: 'settings' as const, label: 'Stafi & siguria', icon: Settings, count: data.staffAccounts.filter((account) => account.active).length },
  ].filter((item) => data.staff.role !== 'courier' || item.id === 'shipments');

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
            <Link href="/" aria-label="Dërgo24, faqja kryesore"><Image src="/dergo24-logo-light.svg" alt="Dërgo24" width={175} height={40} className="h-9 w-auto" /></Link>
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
            <DriversPanel drivers={data.drivers} staff={data.staff} accounts={data.staffAccounts} onUpdated={loadDashboard} />
          )}
          {tab === 'operations' && <OperationsPanel data={data} onUpdated={loadDashboard} />}
          {tab === 'claims' && <ClaimsPanel claims={data.claims} onUpdated={loadDashboard} />}
          {tab === 'reports' && <ReportsPanel shipments={data.shipments} ratings={data.ratings} onUpdated={loadDashboard} />}
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
          staff={data.staff}
          onClose={() => setSelectedShipment(null)}
          onUpdated={async () => { setSelectedShipment(null); await loadDashboard(); }}
          onProof={() => { setProofShipment(selectedShipment); setSelectedShipment(null); }}
        />
      )}
      {proofShipment && (
        <ProofDialog
          shipment={proofShipment}
          onClose={() => setProofShipment(null)}
          onUpdated={async () => { setProofShipment(null); await loadDashboard(); }}
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
        <Link href="/" aria-label="Dërgo24, faqja kryesore"><Image src="/dergo24-logo-dark.svg" alt="Dërgo24" width={210} height={48} className="h-11 w-auto" /></Link>
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Qendra operative</p>
          <h1 className="text-6xl font-black leading-[1.02] tracking-tight">Çdo dërgesë.<br />Një pamje e qartë.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Menaxho porositë, korrierët dhe ofertat e transportit nga një panel i vetëm.</p>
        </div>
        <p className="text-sm text-slate-500">Rruga Mikel Maruli, pranë Cassa Italia, Tiranë</p>
      </section>
      <section className="grid min-h-screen place-items-center bg-white px-5 py-12 lg:rounded-l-[2.5rem]">
        <form onSubmit={submit} className="w-full max-w-md">
          <Link href="/" aria-label="Dërgo24, faqja kryesore" className="mb-12 block lg:hidden"><Image src="/dergo24-logo-light.svg" alt="Dërgo24" width={210} height={48} className="mx-auto h-11 w-auto" /></Link>
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
    return shipments.filter((shipment) => [shipment.id, shipment.tracking_code, shipment.sender_name, shipment.sender_phone, shipment.recipient_name, shipment.recipient_phone, shipment.pickup_city, shipment.delivery_city, shipment.delivery_address, shipment.status].some((value) => value.toLowerCase().includes(query)));
  }, [search, shipments]);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <PanelHeader eyebrow="Fluksi i dërgesave" title={`${filtered.length} dërgesa`}>
        <label className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 md:w-80">
          <Search className="size-4 text-slate-400" />
          <input aria-label="Kërko dërgesa" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Kod, ID, telefon, adresë..." />
        </label>
      </PanelHeader>
      <div className="space-y-3">
        {filtered.map((shipment) => (
          <button aria-label={`Menaxho dërgesën ${shipment.tracking_code}`} key={shipment.id} onClick={() => onSelect(shipment)} className="grid w-full gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-orange-300 hover:shadow-md md:grid-cols-[1.2fr_1.2fr_1fr_auto] md:items-center">
            <div><div className="flex items-center gap-2">{shipment.route_order && <span className="grid size-7 place-items-center rounded-full bg-[#071b33] text-xs font-black text-white">{shipment.route_order}</span>}<p className="font-mono text-xs font-black text-orange-600">{shipment.tracking_code}</p></div><p className="mt-1 font-bold">{shipment.sender_name}</p><p className="text-xs text-slate-500">{shipment.pickup_date ?? formatDate(shipment.created_at)} · {shipment.delivery_window}</p></div>
            <div><p className="text-sm font-bold">{shipment.pickup_city} <ArrowRight className="mx-1 inline size-3" /> {shipment.delivery_city}</p><p className="mt-1 text-xs text-slate-500">Për: {shipment.recipient_name}</p></div>
            <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(shipment.status)}`}>{shipment.status}</span><p className="mt-2 text-xs text-slate-500">{shipment.drivers?.full_name ?? 'Pa korrier'}</p></div>
            <div className="flex items-center justify-between gap-5 md:block md:text-right"><p className="font-black">{shipment.quoted_price_all} Lekë</p><p className="text-xs uppercase text-slate-500">{shipment.service}</p>{shipment.cod_amount_all > 0 && <p className="mt-1 text-xs font-black text-orange-600">COD {shipment.cod_amount_all} · {shipment.cod_status}</p>}</div>
          </button>
        ))}
        {!filtered.length && <EmptyState text="Nuk u gjet asnjë dërgesë." />}
      </div>
    </article>
  );
}

function ShipmentDialog({ shipment, drivers, staff, onClose, onUpdated, onProof }: { shipment: Shipment; drivers: Driver[]; staff: Staff; onClose: () => void; onUpdated: () => Promise<void>; onProof: () => void }) {
  const [status, setStatus] = useState(shipment.status);
  const [driverId, setDriverId] = useState(shipment.driver_id ?? '');
  const [location, setLocation] = useState(shipment.delivery_city);
  const [details, setDetails] = useState('Statusi i dërgesës u përditësua nga stafi i Dergo24.');
  const [codStatus, setCodStatus] = useState(shipment.cod_status);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await apiRequest(`/api/staff/shipments/${shipment.id}`, { method: 'PATCH', body: JSON.stringify({ status, driverId: driverId || null, location, details, latitude, longitude, codStatus }) });
      await onUpdated();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Veprimi dështoi.'); }
    finally { setSaving(false); }
  }

  function captureLocation() {
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('Vendndodhja nuk u lexua. Lejoni aksesin GPS në shfletues.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const whatsappPhone = shipment.recipient_phone.replace(/\D/g, '').replace(/^0/, '355');
  const whatsappText = encodeURIComponent(
    `Përshëndetje ${shipment.recipient_name}, dërgesa juaj ${shipment.tracking_code} është: ${status}. Ndiqeni këtu: https://dergo24-albania.traveleuro6.chatgpt.site/?tracking=${shipment.tracking_code}`,
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#071b33]/70 p-0 backdrop-blur-sm md:place-items-center md:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <dialog open aria-labelledby="shipment-dialog-title" className="relative m-0 max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-[#10233d] md:m-auto md:max-w-2xl md:rounded-3xl md:p-7">
        <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><p className="font-mono text-sm font-black text-orange-600">{shipment.tracking_code}</p><CopyTrackingButton value={shipment.tracking_code} compact /></div><h2 id="shipment-dialog-title" className="mt-1 text-2xl font-black">Menaxho dërgesën</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-slate-100" aria-label="Mbyll"><X className="size-5" /></button></div>
        <div className="my-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Dërguesi:</span><br /><strong>{shipment.sender_name}</strong> · {shipment.sender_phone}</p><p><span className="text-slate-500">Marrësi:</span><br /><strong>{shipment.recipient_name}</strong> · {shipment.recipient_phone}</p><p><span className="text-slate-500">Itinerari:</span><br /><strong>{shipment.pickup_city} → {shipment.delivery_city}</strong></p><p><span className="text-slate-500">Adresa:</span><br /><strong>{shipment.pickup_points?.name ?? shipment.delivery_address}</strong></p><p><span className="text-slate-500">Marrja:</span><br /><strong>{shipment.pickup_date ?? 'Për t’u konfirmuar'}</strong></p><p><span className="text-slate-500">Orari:</span><br /><strong>{shipment.delivery_window === 'anytime' ? 'Gjatë ditës' : shipment.delivery_window}</strong></p></div>
        <form onSubmit={save} className="space-y-4">
          <FormField label="Statusi"><select value={status} onChange={(event) => setStatus(event.target.value)} className="form-control">{shipmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          <FormField label="Korrieri"><select disabled={staff.role === 'courier'} value={driverId} onChange={(event) => setDriverId(event.target.value)} className="form-control disabled:opacity-60"><option value="">Pa korrier</option>{drivers.filter((driver) => driver.active).map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name} · {driver.phone}</option>)}</select></FormField>
          {shipment.cod_amount_all > 0 && <FormField label={`Pagesa në dorëzim · ${shipment.cod_amount_all} Lekë`}><select disabled={staff.role === 'courier'} value={codStatus} onChange={(event) => setCodStatus(event.target.value as Shipment['cod_status'])} className="form-control disabled:opacity-60"><option value="pending">Në pritje</option><option value="collected">U mblodh</option><option value="settled">U mbyll në arkë</option></select></FormField>}
          <FormField label="Vendndodhja"><input value={location} onChange={(event) => setLocation(event.target.value)} className="form-control" required /></FormField>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><p className="text-sm font-black">Pozicioni GPS</p><p className="mt-1 text-xs text-slate-500">{latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Ende pa koordinata'}</p></div>
              <button type="button" onClick={captureLocation} disabled={locating} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black ring-1 ring-slate-200"><LocateFixed className="size-4" /> {locating ? 'Duke lexuar...' : 'Përdor vendndodhjen'}</button>
            </div>
          </div>
          <FormField label="Shënimi që sheh klienti"><textarea value={details} onChange={(event) => setDetails(event.target.value)} className="form-control min-h-24 resize-y" required /></FormField>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black text-white hover:bg-orange-600 disabled:opacity-60">{saving ? <RefreshCw className="size-5 animate-spin" /> : <><CheckCircle2 className="size-5" /> Ruaj dhe njofto gjurmimin</>}</button>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href={`/staff/labels/${shipment.id}`} target="_blank" className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 font-black text-[#071b33]"><Printer className="size-5" /> Printo etiketën</Link>
            <button type="button" onClick={onProof} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-black text-white"><PenLine className="size-5" /> {shipment.delivery_proofs ? 'Shiko provën' : 'Konfirmo dorëzimin'}</button>
          </div>
          <a href={`https://wa.me/${whatsappPhone}?text=${whatsappText}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20b85a] px-5 py-3.5 font-black text-white"><MessageCircle className="size-5" /> Njofto marrësin në WhatsApp</a>
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
  const whatsappPhone = quote.phone.replace(/\D/g, '').replace(/^0/, '355');
  const whatsappText = encodeURIComponent(
    `Përshëndetje ${quote.customer_name}, kërkesa juaj ${quote.reference_code} për transport nga ${quote.pickup_city} në ${quote.delivery_city}${price ? ` ka ofertën ${price} Lekë` : ' po shqyrtohet nga Dergo24'}.`,
  );
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-black text-orange-600">{quote.reference_code}</p><h3 className="mt-1 text-lg font-black">{quote.customer_name}</h3><a href={`tel:${quote.phone}`} className="text-sm font-bold text-blue-600">{quote.phone}</a></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(quote.status)}`}>{quoteStatuses.find(([value]) => value === quote.status)?.[1]}</span></div>
      <p className="mt-4 text-sm font-bold">{quote.pickup_city} <ArrowRight className="mx-1 inline size-3" /> {quote.delivery_city} · {quote.item_type}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{quote.description}</p>
      <p className="mt-2 text-xs text-slate-400">{formatDate(quote.created_at)}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={status} onChange={(event) => setStatus(event.target.value as Quote['status'])} className="form-control">{quoteStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} className="form-control" placeholder="Çmimi në Lekë" /></div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <button onClick={save} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b33] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? <RefreshCw className="size-4 animate-spin" /> : 'Ruaj ofertën'}</button>
      <a href={`https://wa.me/${whatsappPhone}?text=${whatsappText}`} target="_blank" rel="noreferrer" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#20b85a] px-4 py-3 text-sm font-black text-white"><MessageCircle className="size-4" /> Dërgo në WhatsApp</a>
    </section>
  );
}

function DriversPanel({ drivers, staff, accounts, onUpdated }: { drivers: Driver[]; staff: Staff; accounts: StaffAccount[]; onUpdated: () => Promise<void> }) {
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
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6"><PanelHeader eyebrow="Ekipi në terren" title={`${drivers.length} korrierë`} /><div className="space-y-3">{drivers.map((driver) => <DriverRow key={driver.id} driver={driver} courierAccounts={accounts.filter((account) => account.role === 'courier' && account.active)} canManage={canManage} onUpdated={onUpdated} />)}{!drivers.length && <EmptyState text="Nuk ka korrierë të regjistruar." />}</div></article>
      {canManage && <form onSubmit={create} className="h-fit rounded-2xl bg-[#071b33] p-6 text-white"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-orange-500"><UserPlus className="size-5" /></div><h2 className="text-xl font-black">Shto korrier</h2><p className="mt-1 text-sm text-slate-400">Regjistro një anëtar të ri të ekipit.</p><label htmlFor="driver-name" className="mt-6 block text-sm font-bold">Emri i plotë</label><input id="driver-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-orange-400" required /><label htmlFor="driver-phone" className="mt-4 block text-sm font-bold">Telefoni</label><input id="driver-phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-orange-400" placeholder="+355 69..." required />{error && <p className="mt-3 text-sm font-semibold text-red-300">{error}</p>}<button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black disabled:opacity-60">{saving ? <RefreshCw className="size-4 animate-spin" /> : 'Shto në ekip'}</button></form>}
    </div>
  );
}

function DriverRow({ driver, courierAccounts, canManage, onUpdated }: { driver: Driver; courierAccounts: StaffAccount[]; canManage: boolean; onUpdated: () => Promise<void> }) {
  const [status, setStatus] = useState(driver.status);
  const [active, setActive] = useState(driver.active);
  const [staffId, setStaffId] = useState(driver.staff_id ?? '');
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); try { await apiRequest(`/api/staff/drivers/${driver.id}`, { method: 'PATCH', body: JSON.stringify({ status, active, staffId: staffId || null }) }); await onUpdated(); } finally { setSaving(false); } }
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 xl:grid-cols-[1fr_160px_210px_auto] xl:items-center"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-orange-100 font-black text-orange-600">{driver.full_name.charAt(0)}</div><div><p className="font-black">{driver.full_name}</p><a href={`tel:${driver.phone}`} className="text-sm text-slate-500">{driver.phone}</a></div></div><select disabled={!canManage} value={status} onChange={(event) => setStatus(event.target.value as Driver['status'])} className="form-control disabled:opacity-60">{driverStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label={`Llogaria e ${driver.full_name}`} disabled={!canManage} value={staffId} onChange={(event) => setStaffId(event.target.value)} className="form-control disabled:opacity-60"><option value="">Pa llogari aplikacioni</option>{courierAccounts.map((account) => <option key={account.id} value={account.id}>{account.full_name}</option>)}</select>{canManage && <div className="flex gap-2"><button onClick={() => setActive((value) => !value)} className={`rounded-xl px-3 py-2 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Aktiv' : 'Joaktiv'}</button><button onClick={save} disabled={saving || (status === driver.status && active === driver.active && staffId === (driver.staff_id ?? ''))} className="rounded-xl bg-[#071b33] px-3 py-2 text-xs font-black text-white disabled:opacity-30">Ruaj</button></div>}</div>
  );
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += character;
  }
  values.push(value.trim());
  return values;
}

function OperationsPanel({ data, onUpdated }: { data: DashboardData; onUpdated: () => Promise<void> }) {
  const [driverId, setDriverId] = useState(data.drivers[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [stops, setStops] = useState<Array<{ id: string; tracking_code: string; delivery_city: string; delivery_address: string; delivery_window: string; routeOrder: number }>>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [point, setPoint] = useState({ name: '', city: '', address: '', openingHours: '' });

  async function optimize() {
    setLoading(true); setMessage('');
    try {
      const result = await apiRequest<{ stops: typeof stops }>('/api/staff/routes/optimize', { method: 'POST', body: JSON.stringify({ driverId, pickupDate: date }) });
      setStops(result.stops); setMessage(`${result.stops.length} ndalesa u organizuan.`); await onUpdated();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Planifikimi dështoi.'); }
    finally { setLoading(false); }
  }

  async function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setMessage('');
    try {
      const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, parseCsvLine(line)[index] ?? ''])));
      const payload = rows.map((row) => ({
        ...row,
        weight: Number(row.weight),
        codAmount: Number(row.codAmount || 0),
        pickupPointId: row.pickupPointId || null,
        deliveryWindow: row.deliveryWindow || 'anytime',
        deliveryMethod: row.deliveryMethod || 'home',
      }));
      const result = await apiRequest<{ imported: number }>('/api/staff/shipments/import', { method: 'POST', body: JSON.stringify(payload) });
      setMessage(`${result.imported} dërgesa u importuan me sukses.`); await onUpdated();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Importi dështoi.'); }
    finally { setLoading(false); event.target.value = ''; }
  }

  function downloadTemplate() {
    const headers = 'senderName,senderPhone,recipientName,recipientPhone,pickupCity,deliveryCity,address,packageType,weight,service,codAmount,pickupDate,deliveryWindow,deliveryMethod,pickupPointId';
    const example = `Biznes Test,0690000000,Klient Test,0691111111,Tiranë,Durrës,"Rruga Kryesore, Nr. 10",Pako,1,standard,0,${date},anytime,home,`;
    const url = URL.createObjectURL(new Blob([`${headers}\n${example}\n`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'dergo24-import-template.csv'; link.click(); URL.revokeObjectURL(url);
  }

  async function createPoint(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('');
    try { await apiRequest('/api/pickup-points', { method: 'POST', body: JSON.stringify(point) }); setPoint({ name: '', city: '', address: '', openingHours: '' }); setMessage('Pika u shtua.'); await onUpdated(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Pika nuk u ruajt.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><PanelHeader eyebrow="Rruga ditore" title="Organizo ndalesat" /><div className="grid gap-3 sm:grid-cols-2"><FormField label="Korrieri"><select value={driverId} onChange={(event) => setDriverId(event.target.value)} className="form-control"><option value="">Zgjidhni...</option>{data.drivers.filter((driver) => driver.active).map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}</option>)}</select></FormField><FormField label="Data"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="form-control" /></FormField></div><button onClick={optimize} disabled={!driverId || loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-white disabled:opacity-50"><CalendarDays className="size-5" /> Organizo rrugën</button>{stops.length > 0 && <div className="mt-5 space-y-2">{stops.map((stop) => <div key={stop.id} className="flex gap-3 rounded-xl bg-slate-50 p-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#071b33] text-xs font-black text-white">{stop.routeOrder}</span><div><p className="font-mono text-xs font-black text-orange-600">{stop.tracking_code}</p><p className="text-sm font-bold">{stop.delivery_city} · {stop.delivery_address}</p><p className="text-xs text-slate-500">{stop.delivery_window}</p></div></div>)}</div>}</article>
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><PanelHeader eyebrow="Biznes" title="Importo dërgesa nga CSV" /><p className="text-sm leading-6 text-slate-500">Përdorni modelin e Dergo24 për të krijuar deri në 200 dërgesa njëherësh.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={downloadTemplate} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black">Shkarko modelin CSV</button><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#071b33] px-4 py-3 text-sm font-black text-white"><Upload className="size-4" /> Zgjidh CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" /></label></div></article>
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><PanelHeader eyebrow="Pika tërheqjeje" title={`${data.pickupPoints.length} pika aktive`} /><div className="space-y-3">{data.pickupPoints.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.address}, {item.city}</p><p className="mt-1 text-xs font-bold text-orange-600">{item.opening_hours}</p></div>)}</div></article>
      {data.staff.role === 'admin' && <form onSubmit={createPoint} className="rounded-2xl bg-[#071b33] p-5 text-white"><PanelHeader eyebrow="Rrjeti Dergo24" title="Shto pikë të re" /><div className="grid gap-3 sm:grid-cols-2"><input value={point.name} onChange={(event) => setPoint({ ...point, name: event.target.value })} className="staff-dark-control" placeholder="Emri i pikës" required /><input value={point.city} onChange={(event) => setPoint({ ...point, city: event.target.value })} className="staff-dark-control" placeholder="Qyteti" required /><input value={point.address} onChange={(event) => setPoint({ ...point, address: event.target.value })} className="staff-dark-control sm:col-span-2" placeholder="Adresa" required /><input value={point.openingHours} onChange={(event) => setPoint({ ...point, openingHours: event.target.value })} className="staff-dark-control sm:col-span-2" placeholder="Orari" required /></div><button disabled={loading} className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-black">Shto pikën</button></form>}
      {message && <p className="rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-700 xl:col-span-2">{message}</p>}
    </div>
  );
}

function ClaimsPanel({ claims, onUpdated }: { claims: Claim[]; onUpdated: () => Promise<void> }) {
  return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><PanelHeader eyebrow="Mbrojtja e klientit" title={`${claims.length} ankesa dhe rimbursime`} /><div className="grid gap-4 xl:grid-cols-2">{claims.map((claim) => <ClaimCard key={claim.id} claim={claim} onUpdated={onUpdated} />)}{!claims.length && <EmptyState text="Nuk ka ankesa të regjistruara." />}</div></article>;
}

function ClaimCard({ claim, onUpdated }: { claim: Claim; onUpdated: () => Promise<void> }) {
  const [status, setStatus] = useState(claim.status);
  const [refund, setRefund] = useState(claim.approved_refund_all?.toString() ?? '');
  const [notes, setNotes] = useState(claim.staff_notes ?? '');
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); try { await apiRequest(`/api/staff/claims/${claim.id}`, { method: 'PATCH', body: JSON.stringify({ status, approvedRefund: refund ? Number(refund) : null, staffNotes: notes }) }); await onUpdated(); } finally { setSaving(false); } }
  return <section className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-black text-orange-600">{claim.shipments?.tracking_code}</p><p className="mt-1 font-black">{claim.shipments?.recipient_name}</p></div><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-700">{claim.status}</span></div><p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">{claim.claim_type} · kërkuar {claim.requested_refund_all} Lekë</p><p className="mt-2 text-sm leading-6 text-slate-600">{claim.description}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={status} onChange={(event) => setStatus(event.target.value as Claim['status'])} className="form-control"><option value="new">E re</option><option value="reviewing">Në shqyrtim</option><option value="approved">Miratuar</option><option value="rejected">Refuzuar</option><option value="refunded">Rimbursuar</option></select><input type="number" min="0" value={refund} onChange={(event) => setRefund(event.target.value)} className="form-control" placeholder="Rimbursimi i miratuar" /></div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="form-control mt-3 min-h-20" placeholder="Shënim për klientin" /><button onClick={save} disabled={saving} className="mt-3 w-full rounded-xl bg-[#071b33] px-4 py-3 text-sm font-black text-white disabled:opacity-50">Ruaj vendimin</button></section>;
}

function ReportsPanel({ shipments, ratings, onUpdated }: { shipments: Shipment[]; ratings: Rating[]; onUpdated: () => Promise<void> }) {
  const [savingId, setSavingId] = useState('');
  const delivered = shipments.filter((shipment) => shipment.status === 'U dorëzua');
  const collected = shipments.filter((shipment) => shipment.cod_status === 'collected');
  const metrics = [
    { label: 'Të ardhura nga transporti', value: `${delivered.reduce((total, shipment) => total + shipment.quoted_price_all, 0)} Lekë`, tone: 'bg-blue-600' },
    { label: 'COD për t’u mbledhur', value: `${shipments.filter((shipment) => shipment.cod_status === 'pending').reduce((total, shipment) => total + shipment.cod_amount_all, 0)} Lekë`, tone: 'bg-orange-500' },
    { label: 'COD në dorën e korrierëve', value: `${collected.reduce((total, shipment) => total + shipment.cod_amount_all, 0)} Lekë`, tone: 'bg-emerald-600' },
    { label: 'COD i mbyllur', value: `${shipments.filter((shipment) => shipment.cod_status === 'settled').reduce((total, shipment) => total + shipment.cod_amount_all, 0)} Lekë`, tone: 'bg-violet-600' },
  ];
  const driverScores = Array.from(new Set(ratings.map((rating) => rating.driver_id))).map((driverId) => {
    const entries = ratings.filter((rating) => rating.driver_id === driverId);
    return { driverId, name: entries[0]?.drivers?.full_name ?? 'Korrier', average: entries.reduce((total, entry) => total + entry.rating, 0) / entries.length, count: entries.length };
  }).sort((first, second) => second.average - first.average);
  async function settle(shipmentId: string) {
    setSavingId(shipmentId);
    try {
      await apiRequest(`/api/staff/shipments/${shipmentId}/cod`, { method: 'PATCH', body: JSON.stringify({ status: 'settled' }) });
      await onUpdated();
    } finally { setSavingId(''); }
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><span className={`mb-4 grid size-10 place-items-center rounded-xl text-white ${metric.tone}`}><Banknote className="size-5" /></span><p className="text-2xl font-black">{metric.value}</p><p className="mt-1 text-xs font-bold text-slate-500">{metric.label}</p></article>)}</div>
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <PanelHeader eyebrow="Arka COD" title={`${collected.length} arkëtime për t’u mbyllur`} />
        <div className="space-y-3">{collected.map((shipment) => <div key={shipment.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div><p className="font-mono text-xs font-black text-orange-600">{shipment.tracking_code}</p><p className="mt-1 font-black">{shipment.recipient_name} · {shipment.delivery_city}</p><p className="text-xs text-slate-500">Korrieri: {shipment.drivers?.full_name ?? 'Pa korrier'}</p></div><div className="flex items-center gap-4"><p className="text-xl font-black">{shipment.cod_amount_all} Lekë</p><button onClick={() => settle(shipment.id)} disabled={savingId === shipment.id} className="rounded-xl bg-[#071b33] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{savingId === shipment.id ? 'Duke mbyllur...' : 'Mbyll në arkë'}</button></div></div>)}{!collected.length && <EmptyState text="Nuk ka arkëtime të hapura nga korrierët." />}</div>
      </article>
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6"><PanelHeader eyebrow="Cilësia e shërbimit" title="Performanca e korrierëve" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{driverScores.map((driver) => <div key={driver.driverId} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between"><p className="font-black">{driver.name}</p><span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-700"><Star className="size-4 fill-current" /> {driver.average.toFixed(1)}</span></div><p className="mt-2 text-xs font-bold text-slate-500">{driver.count} vlerësime klientësh</p></div>)}{!driverScores.length && <EmptyState text="Ende nuk ka vlerësime për korrierët." />}</div></article>
    </div>
  );
}

type DeliveryProof = {
  recipient_name: string;
  signature_data: string;
  photoUrl: string | null;
  notes: string | null;
  cod_collected_all: number;
  latitude: number | null;
  longitude: number | null;
  delivered_at: string;
};

function ProofDialog({ shipment, onClose, onUpdated }: { shipment: Shipment; onClose: () => void; onUpdated: () => Promise<void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [existing, setExisting] = useState<DeliveryProof | null>(null);
  const [loading, setLoading] = useState(Boolean(shipment.delivery_proofs));
  const [recipientName, setRecipientName] = useState(shipment.recipient_name);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [signed, setSigned] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shipment.delivery_proofs) return;
    void (async () => {
      try {
        const response = await fetch(`/api/staff/shipments/${shipment.id}/proof`);
        const body = await response.json() as { proof?: DeliveryProof; error?: string };
        if (body.error) setError(body.error);
        else setExisting(body.proof ?? null);
      } finally { setLoading(false); }
    })();
  }, [shipment.delivery_proofs, shipment.id]);

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  }
  function startSignature(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const point = canvasPoint(event);
    const context = canvas.getContext('2d')!;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.strokeStyle = '#071b33';
    setSigned(true);
  }
  function drawSignature(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const point = canvasPoint(event);
    const context = canvasRef.current!.getContext('2d')!;
    context.lineTo(point.x, point.y);
    context.stroke();
  }
  function clearSignature() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  }
  function captureLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => { setLatitude(position.coords.latitude); setLongitude(position.coords.longitude); },
      () => setError('Vendndodhja nuk u lexua. Lejoni aksesin GPS.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signed || !canvasRef.current) return setError('Marrësi duhet të firmosë para konfirmimit.');
    setSaving(true); setError('');
    const form = new FormData();
    form.set('recipientName', recipientName);
    form.set('signatureData', canvasRef.current.toDataURL('image/png'));
    form.set('notes', notes);
    form.set('codCollected', String(shipment.cod_amount_all));
    if (latitude !== null) form.set('latitude', String(latitude));
    if (longitude !== null) form.set('longitude', String(longitude));
    if (photo) form.set('photo', photo);
    try {
      const response = await fetch(`/api/staff/shipments/${shipment.id}/proof`, { method: 'POST', body: form });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Dorëzimi nuk u ruajt.');
      await onUpdated();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Dorëzimi nuk u ruajt.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#071b33]/75 backdrop-blur-sm md:place-items-center md:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <dialog open className="m-0 max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 text-[#10233d] md:m-auto md:max-w-2xl md:rounded-3xl md:p-7">
        <div className="flex items-start justify-between"><div><p className="font-mono text-xs font-black text-orange-600">{shipment.tracking_code}</p><h2 className="mt-1 text-2xl font-black">Prova e dorëzimit</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-slate-100" aria-label="Mbyll"><X className="size-5" /></button></div>
        {loading ? <p className="py-16 text-center font-bold text-slate-500">Duke ngarkuar...</p> : existing ? (
          <div className="mt-6 space-y-5"><div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900"><p className="text-xs font-black uppercase tracking-widest">Dorëzuar</p><p className="mt-2 text-xl font-black">Marrë nga {existing.recipient_name}</p><p className="mt-1 text-sm">{formatDate(existing.delivered_at)}</p></div>{existing.photoUrl && <Image src={existing.photoUrl} alt="Foto e dorëzimit" width={900} height={600} unoptimized className="max-h-72 w-full rounded-2xl object-cover" />}<div><p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Firma</p><Image src={existing.signature_data} alt={`Firma e ${existing.recipient_name}`} width={640} height={220} unoptimized className="h-36 w-full rounded-xl border bg-white object-contain" /></div>{existing.notes && <p className="rounded-xl bg-slate-50 p-4 text-sm">{existing.notes}</p>}{existing.cod_collected_all > 0 && <p className="font-black text-emerald-700">U mblodhën {existing.cod_collected_all} Lekë COD</p>}</div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <FormField label="Emri i personit që merr pakon"><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="form-control" required /></FormField>
            <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold">Firma e marrësit</p><button type="button" onClick={clearSignature} className="text-xs font-black text-orange-600">Pastro</button></div><canvas ref={canvasRef} width={640} height={220} onPointerDown={startSignature} onPointerMove={drawSignature} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} className="h-44 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-slate-50" /></div>
            <FormField label="Foto në derë (opsionale)"><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="form-control" /></FormField>
            <FormField label="Shënim (opsional)"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="form-control min-h-20" /></FormField>
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-black">GPS i dorëzimit</p><p className="text-xs text-slate-500">{latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Ende pa koordinata'}</p></div><button type="button" onClick={captureLocation} className="rounded-xl bg-white px-4 py-2 text-sm font-black ring-1 ring-slate-200">Merr GPS</button></div>
            {shipment.cod_amount_all > 0 && <div className="rounded-xl bg-orange-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-orange-600">Për t’u mbledhur</p><p className="mt-1 text-2xl font-black text-orange-800">{shipment.cod_amount_all} Lekë</p></div>}
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-60">{saving ? <RefreshCw className="size-5 animate-spin" /> : <><CheckCircle2 className="size-5" /> Konfirmo dorëzimin</>}</button>
          </form>
        )}
      </dialog>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span>{children}</label>; }
function EmptyState({ text }: { text: string }) { return <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 text-center text-sm font-semibold text-slate-400">{text}</div>; }
