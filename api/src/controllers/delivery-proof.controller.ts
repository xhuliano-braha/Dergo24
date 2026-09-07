import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../errors/api-error';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { deliveryProofSchema } from '../schemas/delivery-proof.schema';
import { deliveryService } from '../services/delivery.service';
import { controllerErrorResponse } from './controller-response';
import { parseId, type IdRouteContext } from './request-input';
import { readLimitedBody } from '../security/request-security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: IdRouteContext) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    return NextResponse.json(
      await deliveryService.proof(await parseId(context), staff),
    );
  } catch (error) {
    return controllerErrorResponse(error, 'Delivery proof lookup failed');
  }
}

export async function POST(request: NextRequest, context: IdRouteContext) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    const id = await parseId(context);
    let form: FormData;
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data;'))
      throw new ApiError('Përdorni multipart/form-data.', 415);
    const body = await readLimitedBody(request, 6 * 1024 * 1024);
    try {
      form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
    } catch {
      throw new ApiError('Kërkesa nuk është e vlefshme.', 400);
    }
    const parsed = deliveryProofSchema.safeParse({
      recipientName: form.get('recipientName'),
      signatureData: form.get('signatureData'),
      notes: form.get('notes') ?? '',
      latitude: form.get('latitude') ? Number(form.get('latitude')) : null,
      longitude: form.get('longitude') ? Number(form.get('longitude')) : null,
      codCollected: Number(form.get('codCollected') ?? 0),
    });
    if (!parsed.success)
      throw new ApiError('Kontrolloni firmën dhe të dhënat e dorëzimit.', 400);
    const photo = form.get('photo');
    if (photo !== null && !(photo instanceof File))
      throw new ApiError('Foto e pavlefshme.', 400);
    return NextResponse.json(
      await deliveryService.saveProof(id, { ...parsed.data, photo }, staff),
    );
  } catch (error) {
    return controllerErrorResponse(error, 'Delivery confirmation failed');
  }
}
