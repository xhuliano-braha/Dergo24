import { NextRequest, NextResponse } from 'next/server';
import { quoteRequestSchema } from '@/lib/quote-requests';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const parsed = quoteRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Kontrolloni të dhënat dhe provoni përsëri.' },
      { status: 400 },
    );
  }

  try {
    const input = parsed.data;
    const referenceCode = `OF-${new Date().getFullYear().toString().slice(-2)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 7).toUpperCase()}`;
    const { error } = await getSupabaseAdmin().from('quote_requests').insert({
      id: crypto.randomUUID(),
      reference_code: referenceCode,
      customer_name: input.customerName,
      phone: input.phone,
      pickup_city: input.pickupCity,
      delivery_city: input.deliveryCity,
      item_type: input.itemType,
      description: input.description,
      status: 'new',
    });
    if (error) throw error;
    return NextResponse.json({ referenceCode }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Kërkesa nuk mund të ruhej. Provoni përsëri.' },
      { status: 503 },
    );
  }
}
