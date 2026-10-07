import { ApiError } from '../errors/api-error';

export function assertSameOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site') {
    throw new ApiError('Kërkesa nga kjo faqe nuk lejohet.', 403);
  }

  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');
  let origin = originHeader;
  if (!origin && refererHeader) {
    try {
      origin = new URL(refererHeader).origin;
    } catch {
      origin = null;
    }
  }
  if (!origin) return;

  let requestOrigin = '';
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    requestOrigin = '';
  }

  const expected = process.env.APP_ORIGIN || requestOrigin;
  const allowed = new Set([
    expected,
    requestOrigin,
    'https://dergo24.com',
    'https://www.dergo24.com',
    'http://dergo24.com',
    'http://www.dergo24.com',
    'https://dergo24.xhulianobraha.workers.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (!allowed.has(origin)) {
    throw new ApiError('Kërkesa nga kjo faqe nuk lejohet.', 403);
  }
}

export async function readLimitedBody(request: Request, limit: number) {
  const declared = request.headers.get('content-length');
  if (declared && Number(declared) > limit)
    throw new ApiError('Kërkesa është shumë e madhe.', 413);
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel().catch(() => {});
        throw new ApiError('Kërkesa është shumë e madhe.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
