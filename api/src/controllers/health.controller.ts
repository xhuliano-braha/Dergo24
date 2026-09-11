import { NextResponse } from 'next/server';
import { healthRepository } from '../repositories/health.repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  let healthy = false;

  try {
    const { error } = await healthRepository.database();
    healthy = !error;
  } catch {
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'unavailable',
      database: healthy ? 'reachable' : 'unreachable',
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
