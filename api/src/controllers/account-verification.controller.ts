import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { accountService } from '../services/account.service';
import { requestClient } from '../security/auth-throttle';
import { parseJson } from './request-input';
import { controllerErrorResponse } from './controller-response';

const emailSchema = z.object({ email: z.email().max(160) });
const verifySchema = emailSchema.extend({ token: z.string().regex(/^\d{6,10}$/) });

export async function resend(request: NextRequest) {
  try {
    const input = await parseJson(request, emailSchema, 'Kontrolloni email-in.');
    return NextResponse.json(await accountService.resendConfirmation(input.email, await requestClient(request)));
  } catch (error) {
    return controllerErrorResponse(error, 'Confirmation resend failed');
  }
}

export async function verify(request: NextRequest) {
  try {
    const input = await parseJson(request, verifySchema, 'Kontrolloni kodin dhe email-in.');
    return NextResponse.json(await accountService.verifyEmail(input.email, input.token, await requestClient(request)));
  } catch (error) {
    return controllerErrorResponse(error, 'Email verification failed');
  }
}
