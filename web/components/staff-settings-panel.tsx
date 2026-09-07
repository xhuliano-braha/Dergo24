'use client';

import { SyntheticEvent, useState } from 'react';
import { KeyRound, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';

export type StaffAccount = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'support' | 'courier';
  active: boolean;
  created_at: string;
};

type CurrentStaff = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'support' | 'courier';
};

async function apiRequest(url: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...options, headers });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Veprimi dështoi.');
  return body;
}

export function StaffSettingsPanel({
  currentStaff,
  accounts,
  onUpdated,
  onPasswordChanged,
}: {
  currentStaff: CurrentStaff;
  accounts: StaffAccount[];
  onUpdated: () => Promise<void>;
  onPasswordChanged: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Aksesi i ekipit</p>
        <h2 className="mt-1 text-2xl font-black">Stafi dhe rolet</h2>
        <p className="mt-2 text-sm text-slate-500">Administratorët menaxhojnë gjithçka, dispeçerët operacionet, suporti klientët, ndërsa korrierët shohin vetëm dërgesat e tyre.</p>
        <div className="mt-6 space-y-3">
          {accounts.map((account) => (
            <StaffAccountRow
              key={account.id}
              account={account}
              currentStaff={currentStaff}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      </section>
      <aside className="space-y-5">
        {currentStaff.role === 'admin' && <CreateStaffCard onCreated={onUpdated} />}
        <ChangePasswordCard onChanged={onPasswordChanged} />
      </aside>
    </div>
  );
}

function StaffAccountRow({
  account,
  currentStaff,
  onUpdated,
}: {
  account: StaffAccount;
  currentStaff: CurrentStaff;
  onUpdated: () => Promise<void>;
}) {
  const [role, setRole] = useState(account.role);
  const [active, setActive] = useState(account.active);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const canManage = currentStaff.role === 'admin';
  const login = account.email.endsWith('@staff.dergo24.al')
    ? account.email.replace('@staff.dergo24.al', '')
    : account.email;

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      await apiRequest(`/api/staff/accounts/${account.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role,
          active,
          newPassword: newPassword || undefined,
        }),
      });
      setNewPassword('');
      setMessage('U ruajt.');
      await onUpdated();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Veprimi dështoi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-slate-100 font-black text-slate-600">{account.full_name.charAt(0)}</div>
          <div><p className="font-black">{account.full_name}</p><p className="text-sm text-slate-500">Hyrja: <strong>{login}</strong></p></div>
        </div>
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Aktiv' : 'Joaktiv'}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto_auto]">
        <select aria-label={`Roli për ${account.full_name}`} disabled={!canManage} value={role} onChange={(event) => setRole(event.target.value as StaffAccount['role'])} className="form-control disabled:opacity-60"><option value="admin">Administrator</option><option value="dispatcher">Dispeçer</option><option value="support">Suport</option><option value="courier">Korrier</option></select>
        <input aria-label={`Fjalëkalim i ri për ${account.full_name}`} disabled={!canManage} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="form-control disabled:opacity-60" placeholder="Fjalëkalim i ri (opsional)" minLength={8} />
        {canManage && <button onClick={() => setActive((value) => !value)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black">{active ? 'Çaktivizo' : 'Aktivizo'}</button>}
        {canManage && <button onClick={save} disabled={saving} className="rounded-xl bg-[#071b33] px-4 py-2 text-xs font-black text-white disabled:opacity-60">{saving ? 'Duke ruajtur...' : 'Ruaj'}</button>}
      </div>
      {message && <p className="mt-3 text-xs font-semibold text-slate-500">{message}</p>}
    </article>
  );
}

function CreateStaffCard({ onCreated }: { onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({ fullName: '', login: '', password: '', role: 'dispatcher' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      await apiRequest('/api/staff/accounts', { method: 'POST', body: JSON.stringify(form) });
      setForm({ fullName: '', login: '', password: '', role: 'dispatcher' });
      setMessage('Llogaria u krijua.');
      await onCreated();
    } catch (createError) { setMessage(createError instanceof Error ? createError.message : 'Veprimi dështoi.'); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-[#071b33] p-6 text-white">
      <div className="mb-4 grid size-11 place-items-center rounded-xl bg-orange-500"><UserPlus className="size-5" /></div>
      <h2 className="text-xl font-black">Shto staf</h2>
      <p className="mt-1 text-sm text-slate-400">Përdorues ose email, rol dhe fjalëkalim fillestar.</p>
      <label htmlFor="new-staff-name" className="mt-5 block text-sm font-bold">Emri</label><input id="new-staff-name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="staff-dark-control" required />
      <label htmlFor="new-staff-login" className="mt-4 block text-sm font-bold">Përdoruesi</label><input id="new-staff-login" value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} className="staff-dark-control" placeholder="p.sh. dispecer1" required />
      <label htmlFor="new-staff-role" className="mt-4 block text-sm font-bold">Roli</label><select id="new-staff-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="staff-dark-control"><option value="dispatcher">Dispeçer</option><option value="support">Suport</option><option value="courier">Korrier</option><option value="admin">Administrator</option></select>
      <label htmlFor="new-staff-password" className="mt-4 block text-sm font-bold">Fjalëkalimi</label><input id="new-staff-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="staff-dark-control" minLength={8} required />
      {message && <p className="mt-3 text-xs font-semibold text-slate-300">{message}</p>}
      <button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black disabled:opacity-60">{saving ? <RefreshCw className="size-4 animate-spin" /> : 'Krijo llogarinë'}</button>
    </form>
  );
}

function ChangePasswordCard({ onChanged }: { onChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      await apiRequest('/api/staff/password', { method: 'POST', body: JSON.stringify({ newPassword: password, currentPassword }) });
      setMessage('U ndryshua. Hyni përsëri.');
      window.setTimeout(onChanged, 900);
    } catch (changeError) { setMessage(changeError instanceof Error ? changeError.message : 'Veprimi dështoi.'); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <KeyRound className="mb-4 size-6 text-orange-500" /><h2 className="font-black">Fjalëkalimi im</h2><p className="mt-1 text-xs text-slate-500">Pas ndryshimit duhet të hyni përsëri.</p>
      <label htmlFor="staff-current-password" className="sr-only">Fjalëkalimi aktual</label><input id="staff-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-control mt-4" placeholder="Fjalëkalimi aktual" maxLength={128} required />
      <label htmlFor="staff-own-password" className="sr-only">Fjalëkalimi i ri</label><input id="staff-own-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-control mt-4" placeholder="Minimumi 8 karaktere" minLength={8} maxLength={128} required />
      {message && <p className="mt-3 text-xs font-semibold text-slate-500">{message}</p>}
      <button disabled={saving} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b33] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? <RefreshCw className="size-4 animate-spin" /> : <><ShieldCheck className="size-4" /> Ndrysho</>}</button>
    </form>
  );
}
