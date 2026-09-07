import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedCustomer,
  customerUnauthorizedResponse,
} from '../lib/customer-auth';
import { dashboardService } from '../services/dashboard.service';
import { controllerErrorResponse } from './controller-response';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedCustomer(request);
    if (!actor) return customerUnauthorizedResponse();
    return NextResponse.json(await dashboardService.customer(actor));
  } catch (error) {
    return controllerErrorResponse(error, 'Customer dashboard failed');
  }
}
