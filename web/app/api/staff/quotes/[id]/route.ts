import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@api/lib/staff-auth';
import { quoteUpdateSchema } from '@api/lib/staff-schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();

  const parsed = quoteUpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni statusin dhe çmimin.' },
      { status: 400 },
    );

  const { id } = await params;
  const { error } = await getSupabaseAdmin()
    .from('quote_requests')
    .update({
      status: parsed.data.status,
      quoted_price_all: parsed.data.quotedPrice,
      assigned_to: staff.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error)
    return NextResponse.json(
      { error: 'Oferta nuk mund të përditësohej.' },
      { status: 503 },
    );
  return NextResponse.json({ success: true });
}
