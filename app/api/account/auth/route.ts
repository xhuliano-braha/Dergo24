import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  clearCustomerSession,
  getAuthenticatedCustomer,
  setCustomerSession,
} from '@/lib/customer-auth';
import { customerLoginSchema } from '@/lib/account-schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer)
    return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, customer });
}

export async function POST(request: NextRequest) {
  const parsed = customerLoginSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni email-in dhe fjalëkalimin.' },
      { status: 400 },
    );

  const authClient = getSupabaseAdmin();
  const { data, error } = await authClient.auth.signInWithPassword(parsed.data);
  if (error || !data.session || !data.user)
    return NextResponse.json(
      { error: 'Email ose fjalëkalim i pasaktë.' },
      { status: 401 },
    );

  const { data: profile } = await getSupabaseAdmin()
    .from('customer_profiles')
    .select('id, full_name, email, phone, active')
    .eq('id', data.user.id)
    .eq('active', true)
    .maybeSingle();
  if (!profile)
    return NextResponse.json(
      { error: 'Kjo llogari nuk është aktive.' },
      { status: 403 },
    );

  const response = NextResponse.json({
    customer: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
    },
  });
  setCustomerSession(response, data.session.access_token, data.session.expires_in);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearCustomerSession(response);
  return response;
}
