import { NextRequest, NextResponse } from 'next/server';
import { passwordChangeSchema } from '@/lib/account-schemas';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  clearStaffSession,
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';

export async function POST(request: NextRequest) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  const parsed = passwordChangeSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Fjalëkalimi duhet të ketë të paktën 8 karaktere.' },
      { status: 400 },
    );

  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(
    staff.id,
    { password: parsed.data.newPassword },
  );
  if (error)
    return NextResponse.json(
      { error: 'Fjalëkalimi nuk mund të ndryshohej.' },
      { status: 503 },
    );

  const response = NextResponse.json({ success: true });
  clearStaffSession(response);
  return response;
}
