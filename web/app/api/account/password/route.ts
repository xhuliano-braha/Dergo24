import { NextRequest, NextResponse } from 'next/server';
import { passwordChangeSchema } from '@api/lib/account-schemas';
import { getSupabaseAdmin } from '@api/lib/supabase-admin';
import {
  clearCustomerSession,
  customerUnauthorizedResponse,
  getAuthenticatedCustomer,
} from '@api/lib/customer-auth';

export async function POST(request: NextRequest) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return customerUnauthorizedResponse();
  const parsed = passwordChangeSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Fjalëkalimi duhet të ketë të paktën 8 karaktere.' },
      { status: 400 },
    );

  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(
    customer.id,
    { password: parsed.data.newPassword },
  );
  if (error)
    return NextResponse.json(
      { error: 'Fjalëkalimi nuk mund të ndryshohej.' },
      { status: 503 },
    );

  const response = NextResponse.json({ success: true });
  clearCustomerSession(response);
  return response;
}
