'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CopyTrackingButton({
  value,
  compact = false,
  dark = false,
  className,
}: {
  value: string;
  compact?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Kopjo kodin ${value}`}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-xs font-black transition hover:-translate-y-0.5',
        compact ? 'size-8' : 'px-3 py-2',
        dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        copied && 'bg-emerald-100 text-emerald-700',
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {!compact && (copied ? 'U kopjua' : 'Kopjo kodin')}
    </button>
  );
}
