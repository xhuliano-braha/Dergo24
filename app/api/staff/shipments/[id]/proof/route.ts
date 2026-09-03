import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedStaff,
  unauthorizedResponse,
} from '@/lib/staff-auth';

export const dynamic = 'force-dynamic';

async function canAccessShipment(staffId: string, role: string, shipmentId: string) {
  if (role !== 'courier') return true;
  const supabase = getSupabaseAdmin();
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('staff_id', staffId)
    .maybeSingle();
  if (!driver) return false;
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('id', shipmentId)
    .eq('driver_id', driver.id)
    .maybeSingle();
  return Boolean(shipment);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  const { id } = await params;
  if (!(await canAccessShipment(staff.id, staff.role, id)))
    return NextResponse.json({ error: 'Nuk keni akses në këtë dërgesë.' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { data: proof, error } = await supabase
    .from('delivery_proofs')
    .select('recipient_name, signature_data, photo_path, notes, cod_collected_all, latitude, longitude, delivered_at')
    .eq('shipment_id', id)
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: 'Prova nuk mund të ngarkohej.' }, { status: 503 });
  if (!proof) return NextResponse.json({ proof: null });

  let photoUrl: string | null = null;
  if (proof.photo_path) {
    const { data } = await supabase.storage
      .from('delivery-proofs')
      .createSignedUrl(proof.photo_path, 900);
    photoUrl = data?.signedUrl ?? null;
  }
  return NextResponse.json({ proof: { ...proof, photoUrl } });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getAuthenticatedStaff(request);
  if (!staff) return unauthorizedResponse();
  const { id } = await params;
  if (!(await canAccessShipment(staff.id, staff.role, id)))
    return NextResponse.json({ error: 'Nuk keni akses në këtë dërgesë.' }, { status: 403 });

  const form = await request.formData();
  const recipientNameValue = form.get('recipientName');
  const signatureValue = form.get('signatureData');
  const notesValue = form.get('notes');
  const recipientName = typeof recipientNameValue === 'string' ? recipientNameValue.trim() : '';
  const signatureData = typeof signatureValue === 'string' ? signatureValue : '';
  const notes = typeof notesValue === 'string' ? notesValue.trim() : '';
  const latitude = form.get('latitude') ? Number(form.get('latitude')) : null;
  const longitude = form.get('longitude') ? Number(form.get('longitude')) : null;
  const codCollected = Number(form.get('codCollected') ?? 0);
  const photo = form.get('photo');

  if (
    recipientName.length < 2 ||
    recipientName.length > 80 ||
    !signatureData.startsWith('data:image/png;base64,') ||
    signatureData.length > 500000 ||
    !Number.isInteger(codCollected) ||
    codCollected < 0 ||
    codCollected > 1000000 ||
    (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
    (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
  )
    return NextResponse.json({ error: 'Kontrolloni firmën dhe të dhënat e dorëzimit.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id, delivery_city, cod_amount_all')
    .eq('id', id)
    .maybeSingle();
  if (!shipment)
    return NextResponse.json({ error: 'Dërgesa nuk u gjet.' }, { status: 404 });
  if (shipment.cod_amount_all > 0 && codCollected !== shipment.cod_amount_all)
    return NextResponse.json({ error: `Duhet të mblidhen saktësisht ${shipment.cod_amount_all} Lekë.` }, { status: 400 });

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type))
      return NextResponse.json({ error: 'Fotoja duhet të jetë JPG, PNG ose WEBP deri në 5 MB.' }, { status: 400 });
    const extension = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg';
    photoPath = `${id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('delivery-proofs')
      .upload(photoPath, photo, { contentType: photo.type, upsert: false });
    if (uploadError)
      return NextResponse.json({ error: 'Fotoja e dorëzimit nuk u ngarkua.' }, { status: 503 });
  }

  const deliveredAt = new Date().toISOString();
  const { error: proofError } = await supabase.from('delivery_proofs').upsert({
    shipment_id: id,
    recipient_name: recipientName,
    signature_data: signatureData,
    photo_path: photoPath,
    notes: notes || null,
    cod_collected_all: codCollected,
    latitude,
    longitude,
    recorded_by: staff.id,
    delivered_at: deliveredAt,
  }, { onConflict: 'shipment_id' });
  if (proofError)
    return NextResponse.json({ error: 'Prova e dorëzimit nuk u ruajt.' }, { status: 503 });

  const codStatus = shipment.cod_amount_all > 0 ? 'collected' : 'not_required';
  const { error: shipmentError } = await supabase
    .from('shipments')
    .update({ status: 'U dorëzua', cod_status: codStatus, updated_at: deliveredAt })
    .eq('id', id);
  if (shipmentError)
    return NextResponse.json({ error: 'Prova u ruajt, por statusi nuk u përditësua.' }, { status: 503 });

  await supabase.from('tracking_events').insert({
    id: crypto.randomUUID(),
    shipment_id: id,
    status: 'U dorëzua',
    location: shipment.delivery_city,
    details: `Dërgesa iu dorëzua ${recipientName}.`,
    latitude,
    longitude,
    created_by: staff.id,
    created_at: deliveredAt,
  });

  return NextResponse.json({ success: true });
}
