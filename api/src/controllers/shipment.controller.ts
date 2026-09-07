import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '../lib/customer-auth';
import { bulkShipmentSchema, shipmentSchema } from '../lib/shipments';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { shipmentUpdateSchema } from '../lib/staff-schemas';
import { shipmentService } from '../services/shipment.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson, parseId, type IdRouteContext } from './request-input';

export async function getShipmentController(request: NextRequest) {
  try {
    const trackingCode = request.nextUrl.searchParams.get('tracking') ?? '';
    return NextResponse.json(await shipmentService.track(trackingCode));
  } catch (error) {
    return controllerErrorResponse(error, 'Shipment tracking failed');
  }
}

export async function createShipmentController(request: NextRequest) {
  try {
    const input = await parseJson(
      request,
      shipmentSchema,
      'Kontrolloni të dhënat e formularit dhe provoni përsëri.',
    );
    const customer = await getAuthenticatedCustomer(request);
    const result = await shipmentService.create(input, customer?.id ?? null);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return controllerErrorResponse(error, 'Shipment booking failed');
  }
}

export async function importShipmentsController(request: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    const input = await parseJson(
      request,
      bulkShipmentSchema,
      'CSV përmban të dhëna të pavlefshme.',
    );
    return NextResponse.json(await shipmentService.importMany(input, staff));
  } catch (error) {
    return controllerErrorResponse(error, 'Shipment import failed');
  }
}

export async function updateShipmentController(
  request: NextRequest,
  context: IdRouteContext,
) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    const input = await parseJson(
      request,
      shipmentUpdateSchema,
      'Kontrolloni statusin dhe shënimin.',
    );
    const id = await parseId(context);
    return NextResponse.json(await shipmentService.update(id, input, staff));
  } catch (error) {
    return controllerErrorResponse(error, 'Shipment update failed');
  }
}
