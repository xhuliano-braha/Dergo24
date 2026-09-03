import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAlbanianAddress } from '@/lib/albania-address';

const schema = z.object({
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(2).max(180),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ valid: false, message: 'Plotësoni qytetin dhe adresën.' }, { status: 400 });
  return NextResponse.json(validateAlbanianAddress(parsed.data.city, parsed.data.address));
}
