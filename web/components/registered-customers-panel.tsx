'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';

export type RegisteredCustomer = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  active: boolean;
  created_at: string;
  is_verified: boolean;
};

async function apiRequest<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit,
) {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...options, headers });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Veprimi dështoi.');
  return body as T;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('sq-AL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function RegisteredCustomersPanel({
  customers,
  onUpdated,
}: {
  customers: RegisteredCustomer[];
  onUpdated: () => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    otp?: string;
    link?: string;
    email?: string;
  } | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        customer.full_name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filter === 'unverified') return !customer.is_verified;
      if (filter === 'verified') return customer.is_verified;
      return true;
    });
  }, [customers, search, filter]);

  const verifiedCount = useMemo(
    () => customers.filter((c) => c.is_verified).length,
    [customers],
  );
  const unverifiedCount = useMemo(
    () => customers.filter((c) => !c.is_verified).length,
    [customers],
  );

  async function handleVerify(customerId: string) {
    setActionLoading(customerId);
    setFeedback(null);
    try {
      const res = await apiRequest<{ success?: boolean; message?: string }>(
        '/api/staff/customers',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'verify', customerId }),
        },
      );
      setFeedback({
        type: 'success',
        message: res.message || 'Klienti u verifikua me sukses!',
      });
      await onUpdated();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Verifikimi dështoi.',
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResend(customerId: string, email: string) {
    setActionLoading(customerId);
    setFeedback(null);
    try {
      const res = await apiRequest<{
        success?: boolean;
        message?: string;
        otp?: string;
        actionLink?: string;
      }>('/api/staff/customers', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend', customerId }),
      });
      setFeedback({
        type: 'success',
        message: res.message || 'Email-i i verifikimit u dërgua me sukses.',
        otp: res.otp,
        link: res.actionLink,
        email,
      });
      await onUpdated();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ridërgimi dështoi.',
      });
    } finally {
      setActionLoading(null);
    }
  }

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedOtp(text);
    setTimeout(() => setCopiedOtp(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Gjithsej Klientë
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {customers.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Llogari të regjistruara në sistem
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Të Verifikuar
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700">
            {verifiedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Email i konfirmuar · Gati për hyrje
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600">
              Në Pritje Verifikimi
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <UserX className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-amber-600">
            {unverifiedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Kërkojnë verifikim me OTP ose link
          </p>
        </div>
      </div>

      {/* Banner / Feedback */}
      {feedback && (
        <div
          className={`rounded-2xl p-5 border transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
              : 'border-red-200 bg-red-50/90 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldCheck className="size-5 shrink-0 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-black">{feedback.message}</p>
              {feedback.otp && (
                <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300 bg-white p-3.5 shadow-sm">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Kodi OTP i gjeneruar për {feedback.email}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-black tracking-widest text-orange-600">
                      {feedback.otp}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(feedback.otp || '')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Copy className="size-3.5" />
                      {copiedOtp === feedback.otp ? 'U kopjua!' : 'Kopjo kodin'}
                    </button>
                    {feedback.link && (
                      <a
                        href={feedback.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
                      >
                        <ExternalLink className="size-3.5" />
                        Hap linkun e konfirmimit
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2.5 sm:w-96">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko me emër, email, ose numër telefoni..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 font-medium"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'unverified', 'verified'] as const).map((filterType) => (
            <button
              key={filterType}
              type="button"
              onClick={() => setFilter(filterType)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                filter === filterType
                  ? 'bg-[#071b33] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterType === 'all'
                ? `Të gjithë (${customers.length})`
                : filterType === 'unverified'
                  ? `Në pritje (${unverifiedCount})`
                  : `Të verifikuar (${verifiedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <article
            key={customer.id}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 lg:flex-row lg:items-center"
          >
            <div className="flex items-start gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-100 font-black text-orange-700">
                {customer.full_name
                  ? customer.full_name.charAt(0).toUpperCase()
                  : 'K'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-900">
                    {customer.full_name || 'Pa emër'}
                  </h3>
                  {customer.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      I verifikuar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Në pritje të verifikimit
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Mail className="size-3.5 text-slate-400" />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="flex items-center gap-1.5 font-mono text-slate-600">
                      <span className="font-bold text-slate-400">Tel:</span>
                      {customer.phone}
                    </span>
                  )}
                  <span className="text-slate-400">
                    Regjistruar më: {formatDate(customer.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {!customer.is_verified ? (
                <>
                  <button
                    type="button"
                    aria-label={`Verifiko email-in për ${customer.full_name || customer.email}`}
                    disabled={actionLoading === customer.id}
                    onClick={() => handleVerify(customer.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading === customer.id ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Verifiko tani
                  </button>
                  <button
                    type="button"
                    aria-label={`Ridërgo kodin OTP për ${customer.full_name || customer.email}`}
                    disabled={actionLoading === customer.id}
                    onClick={() =>
                      handleResend(customer.id, customer.email)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
                  >
                    <Mail className="size-3.5" />
                    Ridërgo OTP
                  </button>
                </>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Llogari aktive</span>
                </div>
              )}
            </div>
          </article>
        ))}

        {!filteredCustomers.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-semibold text-slate-400">
            Nuk u gjet asnjë përdorues i regjistruar sipas kërkimit tuaj.
          </div>
        )}
      </div>
    </div>
  );
}
