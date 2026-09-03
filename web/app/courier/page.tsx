'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PointerEvent as ReactPointerEvent, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, Check, ChevronRight, CircleUserRound, Clock3, LocateFixed, LogOut, MapPin, MessageCircle, Navigation, PackageCheck, Phone, RefreshCw, Route, Truck, X } from 'lucide-react';
import { CopyTrackingButton } from '@/components/copy-tracking-button';

type Staff = { id: string; fullName: string; email: string; role: 'admin' | 'dispatcher' | 'support' | 'courier' };
type Shipment = {
  id: string; tracking_code: string; sender_name: string; sender_phone: string; recipient_name: string; recipient_phone: string;
  pickup_city: string; delivery_city: string; delivery_address: string; package_type: string; weight_kg: number;
  service: 'standard' | 'express'; status: string; cod_amount_all: number; cod_status: 'not_required' | 'pending' | 'collected' | 'settled';
  driver_id: string | null; pickup_date: string | null; delivery_window: string; delivery_method: 'home' | 'pickup_point';
  route_order: number | null; pickup_points: { name: string; address: string } | null;
  delivery_proofs: { recipient_name: string; delivered_at: string; cod_collected_all: number } | null;
};
type Dashboard = { staff: Staff; shipments: Shipment[] };

const completedStatuses = ['U dorëzua', 'U anulua'];

async function apiRequest<T>(url: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  if (!(options?.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...options, headers });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Veprimi dështoi.');
  return body;
}

export default function CourierPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'active' | 'completed'>('active');
  const [proofShipment, setProofShipment] = useState<Shipment | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await apiRequest<Dashboard>('/api/staff/dashboard')); }
    catch (loadError) { setData(null); if (loadError instanceof Error && !loadError.message.includes('Sesioni')) setError(loadError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timeout = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timeout); }, [load]);

  const shipments = useMemo(() => [...(data?.shipments ?? [])].sort((first, second) =>
    (first.route_order ?? 9999) - (second.route_order ?? 9999) || first.delivery_window.localeCompare(second.delivery_window),
  ), [data?.shipments]);
  const active = shipments.filter((shipment) => !completedStatuses.includes(shipment.status));
  const completed = shipments.filter((shipment) => completedStatuses.includes(shipment.status));
  const codTotal = active.reduce((sum, shipment) => sum + (shipment.cod_status === 'pending' ? shipment.cod_amount_all : 0), 0);

  async function logout() { await apiRequest('/api/staff/auth', { method: 'DELETE' }); setData(null); }

  if (loading && !data) return <main className="grid min-h-screen place-items-center bg-[#071b33] text-white"><div className="text-center"><RefreshCw className="mx-auto size-9 animate-spin text-orange-400" /><p className="mt-4 font-bold">Po ngarkojmë itinerarin...</p></div></main>;
  if (!data) return <CourierLogin onLogin={load} initialError={error} />;
  if (data.staff.role !== 'courier') return <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><CircleUserRound className="mx-auto size-12 text-orange-500" /><h1 className="mt-4 text-2xl font-black">Panel vetëm për korrierë</h1><p className="mt-3 text-slate-500">Llogaria juaj përdor panelin e plotë të stafit.</p><Link href="/staff" className="mt-6 inline-flex rounded-xl bg-[#071b33] px-5 py-3 font-black text-white">Hap panelin e stafit</Link></div></main>;

  return (
    <main className="min-h-screen bg-[#eef2f6] pb-28 text-[#10233d]">
      <header className="sticky top-0 z-30 bg-[#071b33] px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-white shadow-xl">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between"><Image src="/dergo24-logo-dark.svg" alt="Dergo24" width={160} height={38} className="h-8 w-auto" /><div className="flex gap-2"><button onClick={load} aria-label="Rifresko" className="grid size-10 place-items-center rounded-xl bg-white/10"><RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={logout} aria-label="Dil" className="grid size-10 place-items-center rounded-xl bg-white/10"><LogOut className="size-5" /></button></div></div>
          <div className="mt-5"><p className="text-sm text-slate-400">Mirë se erdhe,</p><h1 className="text-2xl font-black">{data.staff.fullName}</h1></div>
          <div className="mt-5 grid grid-cols-3 gap-2"><Metric icon={Route} value={active.length} label="Ndalesa" /><Metric icon={PackageCheck} value={completed.filter((item) => item.status === 'U dorëzua').length} label="Mbaruar" /><Metric icon={Banknote} value={codTotal} label="COD Lekë" /></div>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-5">
        {error && <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm"><button onClick={() => setView('active')} className={`rounded-xl py-3 text-sm font-black ${view === 'active' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Itinerari sot ({active.length})</button><button onClick={() => setView('completed')} className={`rounded-xl py-3 text-sm font-black ${view === 'completed' ? 'bg-[#071b33] text-white' : 'text-slate-500'}`}>Të përfunduara ({completed.length})</button></div>
        <div className="space-y-4">{(view === 'active' ? active : completed).map((shipment) => <StopCard key={shipment.id} shipment={shipment} onUpdated={load} onProof={() => setProofShipment(shipment)} />)}{!(view === 'active' ? active : completed).length && <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center"><Check className="mx-auto size-12 text-emerald-500" /><h2 className="mt-4 text-xl font-black">Asnjë ndalesë këtu</h2><p className="mt-2 text-sm text-slate-500">Itinerari përditësohet nga dispeçeri.</p></div>}</div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><div className="mx-auto grid max-w-xl grid-cols-3 px-5 text-center text-xs font-black"><button onClick={() => setView('active')} className="grid justify-items-center gap-1 text-orange-600"><Truck className="size-6" />Itinerari</button><button onClick={load} className="grid justify-items-center gap-1 text-slate-500"><RefreshCw className="size-6" />Rifresko</button><Link href="/staff" className="grid justify-items-center gap-1 text-slate-500"><CircleUserRound className="size-6" />Paneli</Link></div></nav>
      {proofShipment && <DeliveryProof shipment={proofShipment} onClose={() => setProofShipment(null)} onSaved={async () => { setProofShipment(null); await load(); }} />}
    </main>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Route; value: number; label: string }) { return <div className="rounded-2xl bg-white/10 p-3"><Icon className="size-4 text-orange-400" /><p className="mt-2 text-xl font-black">{value}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p></div>; }

function StopCard({ shipment, onUpdated, onProof }: { shipment: Shipment; onUpdated: () => Promise<void>; onProof: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const address = shipment.pickup_points?.address ?? shipment.delivery_address;
  const destination = encodeURIComponent(`${address}, ${shipment.delivery_city}, Albania`);
  const whatsappPhone = shipment.recipient_phone.replace(/\D/g, '').replace(/^0/, '355');
  const nextStatus = shipment.status === 'Porosia u regjistrua' || shipment.status === 'Në pritje të marrjes' ? 'U mor nga korrieri' : shipment.status === 'U mor nga korrieri' ? 'Në transport' : 'Në shpërndarje';
  async function advance() {
    setSaving(true); setError('');
    try {
      await apiRequest(`/api/staff/shipments/${shipment.id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, driverId: shipment.driver_id, location: shipment.delivery_city, details: `Dërgesa u përditësua nga korrieri: ${nextStatus}.`, latitude: null, longitude: null, codStatus: shipment.cod_status }) });
      await onUpdated();
    } catch (advanceError) { setError(advanceError instanceof Error ? advanceError.message : 'Statusi nuk u ruajt.'); }
    finally { setSaving(false); }
  }
  return <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"><div className="border-b border-slate-100 p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#071b33] text-lg font-black text-white">{shipment.route_order ?? '—'}</span><div><div className="flex items-center gap-1"><p className="font-mono text-xs font-black text-orange-600">{shipment.tracking_code}</p><CopyTrackingButton value={shipment.tracking_code} compact /></div><p className="mt-1 text-xs font-bold text-slate-500">{shipment.service.toUpperCase()} · {shipment.weight_kg} kg</p></div></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{shipment.status}</span></div><h2 className="mt-5 text-xl font-black">{shipment.recipient_name}</h2><p className="mt-2 flex gap-2 text-sm leading-6 text-slate-600"><MapPin className="mt-0.5 size-5 shrink-0 text-orange-500" />{address}, {shipment.delivery_city}</p><p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500"><Clock3 className="size-4" />{shipment.delivery_window === 'anytime' ? 'Gjatë ditës' : shipment.delivery_window}</p>{shipment.cod_amount_all > 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-black text-amber-800">Mblidh {shipment.cod_amount_all} Lekë në dorëzim</p>}</div><div className="grid grid-cols-3 gap-2 p-4"><a href={`tel:${shipment.recipient_phone}`} className="grid place-items-center gap-1 rounded-2xl bg-slate-100 px-2 py-3 text-xs font-black"><Phone className="size-5" />Telefono</a><a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="grid place-items-center gap-1 rounded-2xl bg-emerald-50 px-2 py-3 text-xs font-black text-emerald-700"><MessageCircle className="size-5" />WhatsApp</a><a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`} target="_blank" rel="noreferrer" className="grid place-items-center gap-1 rounded-2xl bg-blue-50 px-2 py-3 text-xs font-black text-blue-700"><Navigation className="size-5" />Navigo</a></div>{!completedStatuses.includes(shipment.status) && <div className="grid gap-2 border-t border-slate-100 p-4"><button onClick={advance} disabled={saving || shipment.status === 'Në shpërndarje'} className="flex items-center justify-between rounded-2xl bg-[#071b33] px-5 py-4 text-sm font-black text-white disabled:opacity-40"><span>{saving ? 'Duke ruajtur...' : shipment.status === 'Në shpërndarje' ? 'Gati për dorëzim' : `Kalo në: ${nextStatus}`}</span><ChevronRight className="size-5" /></button><button onClick={onProof} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-white"><PackageCheck className="size-5" />Konfirmo dorëzimin</button>{error && <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}</div>}</article>;
}

function DeliveryProof({ shipment, onClose, onSaved }: { shipment: Shipment; onClose: () => void; onSaved: () => Promise<void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const drawing = useRef(false);
  const [recipientName, setRecipientName] = useState(shipment.recipient_name); const [photo, setPhoto] = useState<File | null>(null); const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null); const [longitude, setLongitude] = useState<number | null>(null); const [signed, setSigned] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  function point(event: ReactPointerEvent<HTMLCanvasElement>) { const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width), y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height) }; }
  function start(event: ReactPointerEvent<HTMLCanvasElement>) { drawing.current = true; const context = event.currentTarget.getContext('2d'); const next = point(event); context?.beginPath(); context?.moveTo(next.x, next.y); event.currentTarget.setPointerCapture(event.pointerId); }
  function draw(event: ReactPointerEvent<HTMLCanvasElement>) { if (!drawing.current) return; const context = event.currentTarget.getContext('2d'); const next = point(event); if (context) { context.strokeStyle = '#071b33'; context.lineWidth = 3; context.lineCap = 'round'; context.lineTo(next.x, next.y); context.stroke(); setSigned(true); } }
  function clear() { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); setSigned(false); }
  function locate() { setError(''); navigator.geolocation.getCurrentPosition((position) => { setLatitude(position.coords.latitude); setLongitude(position.coords.longitude); }, () => setError('Lejoni GPS-in në shfletues dhe provoni përsëri.'), { enableHighAccuracy: true, timeout: 12000 }); }
  async function submit(event: SyntheticEvent<HTMLFormElement>) { event.preventDefault(); if (!signed || !canvasRef.current) { setError('Marrësi duhet të firmosë.'); return; } setSaving(true); setError(''); const form = new FormData(); form.set('recipientName', recipientName); form.set('signatureData', canvasRef.current.toDataURL('image/png')); form.set('notes', notes); form.set('codCollected', String(shipment.cod_amount_all)); if (photo) form.set('photo', photo); if (latitude !== null) form.set('latitude', String(latitude)); if (longitude !== null) form.set('longitude', String(longitude)); try { await apiRequest(`/api/staff/shipments/${shipment.id}/proof`, { method: 'POST', body: form }); await onSaved(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Dorëzimi nuk u ruajt.'); } finally { setSaving(false); } }
  return <div className="fixed inset-0 z-50 flex items-end bg-[#071b33]/75 backdrop-blur-sm"><dialog open className="m-0 max-h-[96vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 text-[#10233d]"><div className="mx-auto max-w-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-orange-600">Prova e dorëzimit</p><h2 className="mt-1 text-2xl font-black">{shipment.recipient_name}</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-slate-100"><X className="size-5" /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-black">Emri i marrësit<input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="form-control mt-2" minLength={2} required /></label><div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-black">Firma e marrësit</p><button type="button" onClick={clear} className="text-xs font-black text-orange-600">Pastro</button></div><canvas ref={canvasRef} width={700} height={230} onPointerDown={start} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} className="h-36 w-full touch-none rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50" /></div><label className="block text-sm font-black">Foto e dorëzimit<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl bg-slate-100 p-3 text-sm" /></label><button type="button" onClick={locate} className="flex w-full items-center justify-between rounded-2xl bg-blue-50 p-4 text-left"><span><strong className="block text-sm">Pozicioni GPS</strong><span className="text-xs text-blue-700">{latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Prek për të regjistruar vendndodhjen'}</span></span><LocateFixed className="size-6 text-blue-600" /></button><label className="block text-sm font-black">Shënim opsional<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="form-control mt-2 min-h-20" /></label>{shipment.cod_amount_all > 0 && <p className="rounded-2xl bg-amber-50 p-4 text-sm font-black text-amber-900">Konfirmoni mbledhjen e {shipment.cod_amount_all} Lekë COD.</p>}{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-60">{saving ? <RefreshCw className="size-5 animate-spin" /> : <><PackageCheck className="size-5" />Ruaj dorëzimin</>}</button></form></div></dialog></div>;
}

function CourierLogin({ onLogin, initialError }: { onLogin: () => Promise<void>; initialError: string }) {
  const [login, setLogin] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(initialError); const [saving, setSaving] = useState(false);
  async function submit(event: SyntheticEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); try { await apiRequest('/api/staff/auth', { method: 'POST', body: JSON.stringify({ login, password }) }); await onLogin(); } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Hyrja dështoi.'); } finally { setSaving(false); } }
  return <main className="grid min-h-screen place-items-center bg-[#071b33] px-5 py-10"><form onSubmit={submit} className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl"><Image src="/dergo24-logo-light.svg" alt="Dergo24" width={180} height={42} className="mx-auto h-10 w-auto" /><p className="mt-8 text-center text-xs font-black uppercase tracking-[0.18em] text-orange-500">Paneli i korrierit</p><h1 className="mt-2 text-center text-3xl font-black text-[#10233d]">Itinerari në xhep</h1><label className="mt-7 block text-sm font-black">Përdoruesi<input value={login} onChange={(event) => setLogin(event.target.value)} className="form-control mt-2" autoComplete="username" required /></label><label className="mt-4 block text-sm font-black">Fjalëkalimi<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-control mt-2" autoComplete="current-password" minLength={8} required /></label>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<button disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 p-4 font-black text-white disabled:opacity-60">{saving ? <RefreshCw className="size-5 animate-spin" /> : <><Truck className="size-5" />Hap itinerarin</>}</button><Link href="/" className="mt-5 block text-center text-sm font-bold text-slate-500">Kthehu te faqja</Link></form></main>;
}
