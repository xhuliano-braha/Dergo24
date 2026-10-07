import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { authRepository } from '../repositories/auth.repository';
import { sendVerificationEmail } from '../services/mailer.service';
import { getSupabaseAdmin } from '../lib/supabase-admin';
import { controllerErrorResponse } from './controller-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedStaff(request);
    if (!actor || (actor.role !== 'admin' && !actor.permissions.includes('staff.manage'))) {
      return unauthorizedResponse();
    }

    const body = (await request.json()) as {
      action: 'verify' | 'resend';
      customerId: string;
    };

    if (!body.customerId) {
      return NextResponse.json({ error: 'customerId kërkohet.' }, { status: 400 });
    }

    const { data: customer, error: fetchError } = await getSupabaseAdmin()
      .from('customer_profiles')
      .select('id, full_name, email')
      .eq('id', body.customerId)
      .maybeSingle();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Klienti nuk u gjet.' }, { status: 404 });
    }

    if (body.action === 'verify') {
      const { error: confirmErr } = await authRepository.confirmUser(customer.id);
      if (confirmErr) throw confirmErr;
      return NextResponse.json({
        success: true,
        message: `Klienti ${customer.full_name} (${customer.email}) u verifikua me sukses!`,
      });
    }

    if (body.action === 'resend') {
      const linkRes = await authRepository.generateSignupLink(customer.email);
      const otp = linkRes?.data?.properties?.email_otp || '';
      const actionLink = linkRes?.data?.properties?.action_link || '';

      if (otp && actionLink) {
        await sendVerificationEmail({
          to: customer.email,
          fullName: customer.full_name,
          otp,
          actionLink,
        });
      }

      void authRepository.sendConfirmation(customer.email);

      return NextResponse.json({
        success: true,
        otp,
        actionLink,
        message: `Email-i me kodin e verifikimit u dërgua te ${customer.email}.`,
      });
    }

    return NextResponse.json({ error: 'Veprim i pavlefshëm.' }, { status: 400 });
  } catch (error) {
    return controllerErrorResponse(error, 'Staff customer action failed');
  }
}
