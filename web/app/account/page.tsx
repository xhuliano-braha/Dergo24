'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  KeyRound,
  LogOut,
  Mail,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Truck,
  UserRound,
} from 'lucide-react';
import { CopyTrackingButton } from '@/components/copy-tracking-button';

type Customer = { id: string; fullName: string; email: string; phone: string };
type TrackingEvent = {
  status: string;
  location: string;
  details: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};
type CustomerShipment = {
  id: string;
  tracking_code: string;
  recipient_name: string;
  pickup_city: string;
  delivery_city: string;
  delivery_address: string;
  package_type: string;
  weight_kg: number;
  service: string;
  status: string;
  quoted_price_all: number;
  cod_amount_all: number;
  cod_status: 'not_required' | 'pending' | 'collected' | 'settled';
  pickup_date: string | null;
  delivery_window: string;
  delivery_method: 'home' | 'pickup_point';
  pickup_points: { name: string; address: string; opening_hours: string } | null;
  created_at: string;
  tracking_events: TrackingEvent[];
  delivery_proofs: { recipient_name: string; delivered_at: string; cod_collected_all: number } | null;
  claims: Array<{ id: string; claim_type: string; description: string; requested_refund_all: number; approved_refund_all: number | null; status: string; staff_notes: string | null; created_at: string }>;
  delivery_ratings: { rating: number; comment: string | null } | null;
};
type AccountData = { customer: Customer; shipments: CustomerShipment[] };

async function apiRequest<T = Record<string, unknown>>(url: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...options, headers });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Veprimi dështoi.');
  return body as T;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AccountPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const filteredShipments = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data.shipments;
    return data.shipments.filter((shipment) =>
      [shipment.tracking_code, shipment.recipient_name, shipment.pickup_city, shipment.delivery_city, shipment.delivery_address, shipment.status]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [data, search]);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await apiRequest<AccountData>('/api/account/dashboard'));
    } catch (loadError) {
      setData(null);
      if (
        loadError instanceof Error &&
        !loadError.message.includes('Sesioni') &&
        !loadError.message.includes('skaduar') &&
        !loadError.message.includes('Dërgesat')
      )
        setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAccount(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAccount]);

  if (loading && !data)
    return (
      <main className="grid min-h-screen place-items-center bg-[#071b33] text-white">
        <RefreshCw className="size-8 animate-spin text-orange-400" />
      </main>
    );

  if (!data)
    return <CustomerAccess onSuccess={loadAccount} initialError={error} />;

  async function logout() {
    await apiRequest('/api/account/auth', { method: 'DELETE' });
    setData(null);
  }

  return (
    <main className="brand-canvas min-h-screen text-[#10233d]">
      <header className="premium-app-header">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Dërgo24, faqja kryesore"><Image src="/dergo24-logo-light.svg" alt="Dërgo24" width={175} height={40} className="h-9 w-auto" /></Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 px-3.5 py-1.5 text-right">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-black text-emerald-800">I identifikuar</p>
                <p className="text-xs font-bold text-slate-800">{data.customer.fullName}</p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"><LogOut className="size-4" /> Dil</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-sm font-black uppercase tracking-[0.18em] text-orange-500">Llogaria ime</p><h1 className="mt-2 text-4xl font-black tracking-tight">Përshëndetje, {data.customer.fullName.split(' ')[0]}</h1><p className="mt-2 text-slate-500">Këtu shfaqen automatikisht dërgesat që rezervoni kur jeni i identifikuar.</p></div>
          <Link href="/?book=1" className="flex w-fit items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-black text-white">Dërgo një pako <ArrowRight className="size-4" /></Link>
        </div>

        <div className="mb-7 grid gap-3 sm:grid-cols-3">
          <StatCard icon={Box} value={data.shipments.length} label="Gjithsej" />
          <StatCard icon={Truck} value={data.shipments.filter((shipment) => !['U dorëzua', 'U anulua'].includes(shipment.status)).length} label="Në proces" />
          <StatCard icon={PackageCheck} value={data.shipments.filter((shipment) => shipment.status === 'U dorëzua').length} label="Dorëzuar" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-2xl font-black">Dërgesat e mia</h2><label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 sm:w-72"><Search className="size-4 text-slate-400" /><input aria-label="Kërko dërgesat e mia" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Kod, qytet, marrës..." /></label></div>
            {filteredShipments.map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} onUpdated={loadAccount} />)}
            {!data.shipments.length && (
              <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><Box className="mx-auto mb-4 size-10 text-slate-300" /><h3 className="font-black">Ende nuk ka dërgesa</h3><p className="mt-2 text-sm text-slate-500">Hyni në llogari përpara rezervimit dhe pakoja do të shfaqet këtu.</p></div></div>
            )}
            {data.shipments.length > 0 && !filteredShipments.length && <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm font-bold text-slate-400">Nuk u gjet asnjë dërgesë.</div>}
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl bg-[#071b33] p-6 text-white"><UserRound className="mb-4 size-7 text-orange-400" /><h2 className="text-xl font-black">Të dhënat e mia</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-400">Emri</dt><dd className="font-bold">{data.customer.fullName}</dd></div><div><dt className="text-slate-400">Telefoni</dt><dd className="font-bold">{data.customer.phone}</dd></div><div><dt className="text-slate-400">Email</dt><dd className="break-all font-bold">{data.customer.email}</dd></div></dl></section>
            <PasswordCard onChanged={() => setData(null)} endpoint="/api/account/password" />
          </aside>
        </div>
      </section>
    </main>
  );
}

function CustomerAccess({ onSuccess, initialError }: { onSuccess: () => Promise<void>; initialError: string }) {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [notice, setNotice] = useState('');

  const activeError = error || initialError;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('access_token') || hash.includes('type=signup') || search.includes('confirmed=true')) {
      const timer = window.setTimeout(() => {
        setNotice('Email-i juaj u konfirmua me sukses! Vendosni fjalëkalimin për të hyrë në llogari.');
        setMode('login');
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') {
        await apiRequest('/api/account/auth', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        await onSuccess();
      } else if (mode === 'register') {
        await apiRequest('/api/account/register', {
          method: 'POST',
          body: JSON.stringify({ ...form, acceptedTerms }),
        });
        setMode('verify');
        setNotice(`Kemi dërguar kodin OTP dhe linkun e konfirmimit në ${form.email}. Vendosni kodin më poshtë ose klikoni linkun në email.`);
      } else if (mode === 'verify') {
        await apiRequest('/api/account/verify', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, token: verificationCode }),
        });
        try {
          await apiRequest('/api/account/auth', {
            method: 'POST',
            body: JSON.stringify({ email: form.email, password: form.password }),
          });
          await onSuccess();
          return;
        } catch {
          setMode('login');
          setNotice('Email-i u verifikua me sukses! Tani mund të hyni me fjalëkalimin tuaj.');
          setVerificationCode('');
        }
      }
    } catch (submitError) {
      const msg = submitError instanceof Error ? submitError.message : 'Veprimi dështoi.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function resendVerification() {
    if (!form.email) {
      setError('Ju lutem vendosni email-in tuaj.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/api/account/resend', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      });
      setNotice('Email-i me kodin e verifikimit dhe linkun u dërgua. Kontrolloni dhe dosjen Spam.');
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Ridërgimi dështoi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="brand-night grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
      <section className="brand-night-pattern hidden flex-col justify-between p-12 text-white lg:flex">
        <Link href="/" aria-label="Dërgo24, faqja kryesore">
          <Image src="/dergo24-logo-dark.svg" alt="Dërgo24" width={210} height={48} className="h-11 w-auto" />
        </Link>
        <div className="max-w-xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">Llogaria Dergo24</p>
          <h1 className="mt-5 text-6xl font-black leading-[1.02] tracking-tight">Pakoja jote.<br />Gjithmonë pranë.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">Rezervo dërgesa, shiko historikun dhe ndiq çdo ndryshim statusi nga një vend.</p>
        </div>
        <p className="text-sm text-slate-500">Transport në çdo qytet të Shqipërisë</p>
      </section>
      <section className="premium-auth-surface grid min-h-screen place-items-center px-5 py-10 lg:rounded-l-[3rem]">
        <form onSubmit={submit} className="premium-auth-card w-full max-w-md">
          <Link href="/" aria-label="Dërgo24, faqja kryesore" className="mb-10 block lg:hidden">
            <Image src="/dergo24-logo-light.svg" alt="Dërgo24" width={210} height={48} className="mx-auto h-11 w-auto" />
          </Link>

          {mode !== 'verify' && (
            <div className="mb-7 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setNotice(''); }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-black transition ${mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Hyr
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setNotice(''); }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-black transition ${mode === 'register' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Krijo llogari
              </button>
            </div>
          )}

          {mode === 'login' && (
            <>
              <h2 className="text-3xl font-black">Mirë se u ktheve</h2>
              <p className="mt-2 text-slate-500">Hyni me email dhe fjalëkalim për të parë dërgesat tuaja.</p>

              <Field id="customer-email" label="Email">
                <input id="customer-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="form-control" autoComplete="email" required />
              </Field>
              <Field id="customer-password" label="Fjalëkalimi">
                <input id="customer-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="form-control" autoComplete="current-password" minLength={8} required />
              </Field>

              {activeError && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <p>{activeError}</p>
                  {activeError.toLowerCase().includes('verifikuar') && (
                    <button
                      type="button"
                      onClick={() => { setMode('verify'); setError(''); }}
                      className="mt-2 block text-xs font-bold text-red-800 underline hover:text-red-950"
                    >
                      Kliko këtu për të vendosur kodin OTP të verifikimit →
                    </button>
                  )}
                </div>
              )}
              {notice && <output className="mt-4 block rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</output>}

              <button disabled={saving} className="premium-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black text-white disabled:opacity-60">
                {saving ? <RefreshCw className="size-5 animate-spin" /> : <>Hyr në llogari <ArrowRight className="size-5" /></>}
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              <h2 className="text-3xl font-black">Krijo llogarinë tënde</h2>
              <p className="mt-2 text-slate-500">Pas aplikimit do të merrni kodin OTP dhe linkun e konfirmimit në email.</p>

              <Field id="customer-name" label="Emri i plotë">
                <input id="customer-name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="form-control" required />
              </Field>
              <Field id="customer-phone" label="Telefoni">
                <input id="customer-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="form-control" placeholder="+355 69..." required />
              </Field>
              <Field id="customer-email" label="Email">
                <input id="customer-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="form-control" autoComplete="email" required />
              </Field>
              <Field id="customer-password" label="Fjalëkalimi">
                <input id="customer-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="form-control" autoComplete="new-password" minLength={8} required />
              </Field>

              <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 size-4 accent-orange-500" required />
                <span>Pranoj <Link href="/terms" target="_blank" className="font-black text-orange-600 underline">kushtet</Link> dhe <Link href="/privacy" target="_blank" className="font-black text-orange-600 underline">privatësinë</Link>.</span>
              </label>

              {activeError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{activeError}</p>}
              {notice && <output className="mt-4 block rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{notice}</output>}

              <button disabled={saving || !acceptedTerms} className="premium-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black text-white disabled:opacity-60">
                {saving ? <RefreshCw className="size-5 animate-spin" /> : <>Krijo llogari <ArrowRight className="size-5" /></>}
              </button>
            </>
          )}

          {mode === 'verify' && (
            <>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700">
                <Mail className="size-3.5" /> Verifikimi i Email-it
              </div>
              <h2 className="text-3xl font-black">Verifiko email-in tënd</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Kemi dërguar kodin e verifikimit (OTP) dhe linkun e konfirmimit në: <strong className="text-slate-900">{form.email}</strong>
              </p>

              <Field id="email-verification-code" label="Kodi OTP nga email-i (6–10 shifra)">
                <input
                  id="email-verification-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  className="form-control text-center text-xl font-mono font-bold tracking-widest"
                  placeholder="123456"
                  required
                />
              </Field>

              <p className="mt-2 text-xs text-slate-500">
                Vendosni kodin më lart, ose klikoni direkt linkun në email. Kontrolloni dhe dosjen Spam nëse nuk e shihni.
              </p>

              {activeError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{activeError}</p>}
              {notice && <output className="mt-4 block rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{notice}</output>}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={saving || !/^\d{6,10}$/.test(verificationCode)}
                  className="premium-button flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black text-white disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="size-5 animate-spin" /> : <>Verifiko & Hyr <CheckCircle2 className="size-5" /></>}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={resendVerification}
                    className="text-xs font-bold text-orange-600 hover:text-orange-800 disabled:opacity-50"
                  >
                    Ridërgo kodin në email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); setNotice(''); }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Kthehu te Hyrja
                  </button>
                </div>
              </div>
            </>
          )}

          <Link href="/" className="mt-8 block text-center text-sm font-bold text-slate-500 hover:text-slate-800">
            Kthehu te faqja kryesore
          </Link>
        </form>
      </section>
    </main>
  );
}

function ShipmentCard({ shipment, onUpdated }: { shipment: CustomerShipment; onUpdated: () => Promise<void> }) {
  const events = [...shipment.tracking_events].sort((first, second) => +new Date(second.created_at) - +new Date(first.created_at));
  const [claimOpen, setClaimOpen] = useState(false);
  const [claim, setClaim] = useState({ claimType: 'damaged', description: '', requestedRefund: '0' });
  const [rating, setRating] = useState(5);
  const comment = '';
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function submitClaim(event: SyntheticEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(''); try { await apiRequest('/api/account/claims', { method: 'POST', body: JSON.stringify({ shipmentId: shipment.id, claimType: claim.claimType, description: claim.description, requestedRefund: Number(claim.requestedRefund) }) }); setClaimOpen(false); setMessage('Ankesa u dërgua.'); await onUpdated(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Ankesa nuk u dërgua.'); } finally { setSaving(false); } }
  async function submitRating() { setSaving(true); setMessage(''); try { await apiRequest('/api/account/ratings', { method: 'POST', body: JSON.stringify({ shipmentId: shipment.id, rating, comment }) }); setMessage('Faleminderit për vlerësimin.'); await onUpdated(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Vlerësimi nuk u ruajt.'); } finally { setSaving(false); } }
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-start"><div><div className="flex items-center gap-2"><p className="font-mono text-xs font-black text-orange-600">{shipment.tracking_code}</p><CopyTrackingButton value={shipment.tracking_code} compact /></div><h3 className="mt-2 text-lg font-black">{shipment.pickup_city} <ArrowRight className="mx-1 inline size-4" /> {shipment.delivery_city}</h3><p className="mt-1 text-sm text-slate-500">Për {shipment.recipient_name} · {shipment.delivery_address}</p><p className="mt-2 text-xs font-bold text-slate-500">Marrja: {shipment.pickup_date ?? 'Për t’u konfirmuar'} · Dorëzimi: {shipment.delivery_window === 'anytime' ? 'gjatë ditës' : shipment.delivery_window}</p>{shipment.pickup_points && <p className="mt-1 text-xs font-black text-orange-600">Tërheqje te {shipment.pickup_points.name} · {shipment.pickup_points.opening_hours}</p>}{shipment.delivery_proofs && <p className="mt-2 text-xs font-black text-emerald-700">Marrë nga {shipment.delivery_proofs.recipient_name} më {formatDate(shipment.delivery_proofs.delivered_at)}</p>}</div><div className="sm:text-right"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-200">{shipment.status}</span><p className="mt-2 font-black">{shipment.quoted_price_all} Lekë</p>{shipment.cod_amount_all > 0 && <p className="mt-1 text-xs font-black text-orange-600">COD {shipment.cod_amount_all} Lekë · {shipment.cod_status}</p>}</div></div>
      <div className="border-t border-slate-100 p-5"><div className="flex flex-wrap gap-2"><button onClick={() => setClaimOpen((open) => !open)} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700"><ShieldAlert className="size-4" /> Raporto problem</button>{shipment.status === 'U dorëzua' && !shipment.delivery_ratings && <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRating(value)} aria-label={`${value} yje`}><Star className={`size-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}<button onClick={submitRating} disabled={saving} className="ml-2 text-xs font-black text-amber-800">Dërgo</button></div>}{shipment.delivery_ratings && <span className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700"><Star className="size-4 fill-current" /> {shipment.delivery_ratings.rating}/5</span>}</div>{shipment.claims.map((item) => <div key={item.id} className="mt-3 rounded-xl bg-red-50 p-3 text-xs"><p className="font-black text-red-800">Ankesa: {item.status} · {item.requested_refund_all} Lekë</p>{item.staff_notes && <p className="mt-1 text-red-700">Përgjigjja: {item.staff_notes}</p>}</div>)}{claimOpen && <form onSubmit={submitClaim} className="mt-4 grid gap-3"><select value={claim.claimType} onChange={(event) => setClaim({ ...claim, claimType: event.target.value })} className="form-control"><option value="damaged">Pako e dëmtuar</option><option value="lost">Pako e humbur</option><option value="delayed">Vonesë</option><option value="other">Tjetër</option></select><textarea value={claim.description} onChange={(event) => setClaim({ ...claim, description: event.target.value })} className="form-control min-h-24" placeholder="Përshkruani problemin..." minLength={10} required /><input type="number" min="0" value={claim.requestedRefund} onChange={(event) => setClaim({ ...claim, requestedRefund: event.target.value })} className="form-control" placeholder="Rimbursimi i kërkuar në Lekë" /><button disabled={saving} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">Dërgo ankesën</button></form>}{message && <p className="mt-3 text-xs font-bold text-slate-600">{message}</p>}</div>
      <div className="border-t border-slate-100 bg-slate-50 p-5">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Historiku</p>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={`${event.created_at}-${event.status}`} className="flex gap-3">
              <div className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full ${index === 0 ? 'bg-orange-500 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}>{index === 0 ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-3" />}</div>
              <div>
                <p className="text-sm font-black">{event.status} · {event.location}</p>
                <p className="mt-1 text-sm text-slate-500">{event.details}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(event.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function PasswordCard({ endpoint, onChanged }: { endpoint: string; onChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false);
  async function submit(event: SyntheticEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(''); try { await apiRequest(endpoint, { method: 'POST', body: JSON.stringify({ newPassword: password, currentPassword }) }); setMessage('Fjalëkalimi u ndryshua. Hyni përsëri.'); window.setTimeout(onChanged, 900); } catch (changeError) { setMessage(changeError instanceof Error ? changeError.message : 'Veprimi dështoi.'); } finally { setSaving(false); } }
  return <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><KeyRound className="mb-4 size-6 text-orange-500" /><h2 className="font-black">Ndrysho fjalëkalimin</h2><p className="mt-1 text-xs text-slate-500">Minimumi 8 karaktere.</p><label htmlFor="account-current-password" className="sr-only">Fjalëkalimi aktual</label><input id="account-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-control mt-4" placeholder="Fjalëkalimi aktual" maxLength={128} required /><label htmlFor="account-new-password" className="sr-only">Fjalëkalimi i ri</label><input id="account-new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-control mt-4" placeholder="Fjalëkalimi i ri" minLength={8} maxLength={128} required />{message && <p className="mt-3 text-xs font-semibold text-slate-600">{message}</p>}<button disabled={saving} className="mt-3 w-full rounded-xl bg-[#071b33] px-4 py-3 text-sm font-black text-white disabled:opacity-60">Ndrysho</button></form>;
}

function StatCard({ icon: Icon, value, label }: { icon: typeof Box; value: number; label: string }) { return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><Icon className="mb-4 size-6 text-orange-500" /><p className="text-3xl font-black">{value}</p><p className="text-sm font-semibold text-slate-500">{label}</p></article>; }
function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) { return <div className="mt-5"><label htmlFor={id} className="mb-2 block text-sm font-bold">{label}</label>{children}</div>; }
