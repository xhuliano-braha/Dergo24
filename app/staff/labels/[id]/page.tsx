'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { ArrowLeft, Printer } from 'lucide-react';

type LabelShipment = {
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
  service: string;
  cod_amount_all: number;
  quoted_price_all: number;
  pickup_date: string | null;
  delivery_window: string;
  delivery_method: 'home' | 'pickup_point';
  pickup_points: { name: string; address: string } | null;
  created_at: string;
};

export default function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [shipment, setShipment] = useState<LabelShipment | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void params.then(async ({ id }) => {
      const response = await fetch(`/api/staff/shipments/${id}/label`);
      const body = await response.json() as { shipment?: LabelShipment; error?: string };
      if (!response.ok || !body.shipment) return setError(body.error ?? 'Etiketa nuk u gjet.');
      setShipment(body.shipment);
    });
  }, [params]);

  useEffect(() => {
    if (!shipment || !barcodeRef.current) return;
    JsBarcode(barcodeRef.current, shipment.tracking_code, {
      format: 'CODE128',
      displayValue: false,
      height: 72,
      margin: 0,
      width: 2,
    });
  }, [shipment]);

  if (error) return <main className="grid min-h-screen place-items-center p-6"><div className="text-center"><p className="font-bold text-red-600">{error}</p><Link href="/staff" className="mt-4 inline-block font-bold text-orange-600">Kthehu në panel</Link></div></main>;
  if (!shipment) return <main className="grid min-h-screen place-items-center font-bold text-slate-500">Duke përgatitur etiketën...</main>;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-[#071b33] print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-[100mm] justify-between print:hidden">
        <Link href="/staff" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black shadow-sm"><ArrowLeft className="size-4" /> Paneli</Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white"><Printer className="size-4" /> Printo</button>
      </div>
      <article className="mx-auto min-h-[150mm] w-full max-w-[100mm] bg-white p-7 shadow-xl print:min-h-0 print:max-w-none print:shadow-none">
        <header className="flex items-start justify-between border-b-4 border-[#071b33] pb-5">
          <Image src="/dergo24-logo-light.svg" alt="Dërgo24" width={180} height={42} className="h-10 w-auto" />
          <div className="text-right"><p className="text-xs font-black uppercase tracking-widest text-orange-600">{shipment.service}</p><p className="mt-1 text-xs">{new Date(shipment.created_at).toLocaleDateString('sq-AL')}</p></div>
        </header>
        <section className="grid grid-cols-2 border-b border-slate-300 py-5">
          <div className="border-r border-slate-300 pr-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nga</p><p className="mt-2 font-black">{shipment.sender_name}</p><p className="mt-1 text-sm">{shipment.sender_phone}</p><p className="text-sm">{shipment.pickup_city}</p></div>
          <div className="pl-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Për</p><p className="mt-2 text-xl font-black">{shipment.recipient_name}</p><p className="mt-1 text-sm font-bold">{shipment.recipient_phone}</p><p className="mt-2 text-sm leading-5">{shipment.delivery_address}<br />{shipment.delivery_city}</p></div>
        </section>
        <section className="grid grid-cols-3 gap-3 border-b border-slate-300 py-5 text-center">
          <LabelFact label="Pako" value={shipment.package_type} />
          <LabelFact label="Pesha" value={`${shipment.weight_kg} kg`} />
          <LabelFact label="Pagesa" value={shipment.cod_amount_all > 0 ? `${shipment.cod_amount_all} Lekë COD` : `${shipment.quoted_price_all} Lekë`} />
        </section>
        <section className="border-b border-slate-300 py-4 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Planifikimi</p><p className="mt-1 text-sm font-black">Marrja: {shipment.pickup_date ?? 'Për t’u konfirmuar'} · {shipment.delivery_window === 'anytime' ? 'Gjatë ditës' : shipment.delivery_window}</p>{shipment.pickup_points && <p className="mt-1 text-xs">Tërheqje: {shipment.pickup_points.name} · {shipment.pickup_points.address}</p>}</section>
        <section className="py-7 text-center">
          <svg ref={barcodeRef} className="mx-auto max-w-full" aria-label={`Barkodi ${shipment.tracking_code}`} />
          <p className="mt-4 font-mono text-xl font-black tracking-wider">{shipment.tracking_code}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">Gjurmo në dergo24-albania.traveleuro6.chatgpt.site</p>
        </section>
      </article>
    </main>
  );
}

function LabelFact({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>;
}
