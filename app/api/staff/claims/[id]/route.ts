import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedStaff, unauthorizedResponse } from '@/lib/staff-auth';

const schema = z.object({
  status: z.enum(['new', 'reviewing', 'approved', 'rejected', 'refunded']),
  approvedRefund: z.number().int().min(0).max(1000000).nullable(),
  staffNotes: z.string().trim().max(1000),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  if (staff.role === 'courier') return NextResponse.json({ error: 'Nuk keni leje.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Kontrolloni vendimin.' }, { status: 400 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from('claims').update({
    status: parsed.data.status,
    approved_refund_all: parsed.data.approvedRefund,
    staff_notes: parsed.data.staffNotes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Kërkesa nuk u përditësua.' }, { status: 503 });
  return NextResponse.json({ success: true });
}
