import { NextRequest, NextResponse } from 'next/server';
import { staffAccountCreateSchema } from '../lib/account-schemas';
import { getAuthenticatedStaff, unauthorizedResponse } from '../lib/staff-auth';
import { accountService } from '../services/account.service';
import { controllerErrorResponse } from './controller-response';
import { parseJson } from './request-input';

export async function POST(request: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff(request);
    if (!staff) return unauthorizedResponse();
    if (staff.role !== 'admin')
      return NextResponse.json(
        { error: 'Vetëm administratori mund të krijojë staf.' },
        { status: 403 },
      );
    const input = await parseJson(
      request,
      staffAccountCreateSchema,
      'Kontrolloni të dhënat e llogarisë.',
    );
    return NextResponse.json(await accountService.createStaff(input, staff), {
      status: 201,
    });
  } catch (error) {
    return controllerErrorResponse(error, 'Staff account creation failed');
  }
}
