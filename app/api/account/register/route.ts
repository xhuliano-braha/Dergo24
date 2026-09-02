import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { customerRegisterSchema } from '@/lib/account-schemas';
import { setCustomerSession } from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  const parsed = customerRegisterSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Kontrolloni emrin, telefonin, email-in dhe fjalëkalimin.' },
      { status: 400 },
    );

  const admin = getSupabaseAdmin();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (createError || !created.user)
    return NextResponse.json(
      { error: 'Ky email mund të jetë regjistruar më parë.' },
      { status: 409 },
    );

  const { error: profileError } = await getSupabaseAdmin()
    .from('customer_profiles')
    .insert({
      id: created.user.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
    });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: 'Llogaria nuk mund të krijohej.' },
      { status: 503 },
    );
  }

  const authClient = getSupabaseAdmin();
  const { data: signedIn, error: signInError } =
    await authClient.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    });
  if (signInError || !signedIn.session)
    return NextResponse.json(
      { error: 'Llogaria u krijua. Ju lutemi hyni.' },
      { status: 201 },
    );

  const response = NextResponse.json(
    {
      customer: {
        id: created.user.id,
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
      },
    },
    { status: 201 },
  );
  setCustomerSession(
    response,
    signedIn.session.access_token,
    signedIn.session.expires_in,
  );
  return response;
}
