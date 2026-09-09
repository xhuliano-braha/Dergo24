import { PNG } from 'pngjs';
import { Buffer } from 'node:buffer';
import jpeg from 'jpeg-js';
import { ApiError } from '../errors/api-error';

function matches(bytes: Uint8Array, offset: number, expected: number[]) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

export function validImageBytes(bytes: Uint8Array, type: string) {
  try { decodeImage(bytes, type); return true; } catch { return false; }
}

function decodeImage(bytes: Uint8Array, type: string) {
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) throw new Error('Invalid image size');
  if (type === 'image/png') {
    if (bytes.length < 45 || !matches(bytes, 0, [137, 80, 78, 71, 13, 10, 26, 10]) ||
      !matches(bytes, 12, [73, 72, 68, 82]) || bytes[24] !== 8 || bytes[28] !== 0)
      throw new Error('Unsupported PNG');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    if (width === 0 || height === 0 || width * height > 2000000) throw new Error('Image dimensions exceeded');
    return PNG.sync.read(Buffer.from(bytes), { checkCRC: true });
  }
  if (type === 'image/jpeg' && matches(bytes, 0, [255, 216, 255]))
    return jpeg.decode(bytes, { useTArray: true, tolerantDecoding: false, maxResolutionInMP: 2, maxMemoryUsageInMB: 32 });
  throw new Error('Unsupported image');
}

export function normalizeSignature(value: string) {
  const encoded = value.slice('data:image/png;base64,'.length);
  if (value.length > 500000 || !value.startsWith('data:image/png;base64,') || encoded.length === 0 ||
      encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Invalid signature');
  const decoded = decodeImage(Buffer.from(encoded, 'base64'), 'image/png');
  if (decoded.width < 8 || decoded.height < 8 || decoded.width * decoded.height > 1000000) throw new Error('Invalid signature dimensions');
  let ink = 0;
  for (let offset = 0; offset < decoded.data.length; offset += 4) {
    if (decoded.data[offset + 3] > 32 && Math.min(decoded.data[offset], decoded.data[offset + 1], decoded.data[offset + 2]) < 230) ink += 1;
  }
  if (ink < 8 || ink > decoded.width * decoded.height * 0.95) throw new Error('Empty signature');
  const image = new PNG({ width: decoded.width, height: decoded.height });
  image.data = Buffer.from(decoded.data);
  const sanitized = Buffer.from(PNG.sync.write(image));
  const result = 'data:image/png;base64,' + sanitized.toString('base64');
  if (result.length > 500000) throw new Error('Signature too large');
  return result;
}

export function validSignature(value: string) {
  try {
    normalizeSignature(value);
    return true;
  } catch { return false; }
}

export async function validatePhoto(photo: File) {
  try {
    if (photo.size === 0 || photo.size > 5 * 1024 * 1024) throw new Error('Invalid photo size');
    const decoded = decodeImage(new Uint8Array(await photo.arrayBuffer()), photo.type);
    const raw = new PNG({ width: decoded.width, height: decoded.height });
    raw.data = Buffer.from(decoded.data);
    const buffer = photo.type === 'image/png' ? PNG.sync.write(raw) : jpeg.encode(raw, 85).data;
    if (buffer.length > 5 * 1024 * 1024) throw new Error('Photo too large');
    return new File([new Uint8Array(buffer)], photo.type === 'image/png' ? 'proof.png' : 'proof.jpg', { type: photo.type });
  } catch {
    throw new ApiError('Përdorni JPG ose PNG 8-bit pa interlace, deri në 5 MB dhe 2 megapikselë.', 400);
  }
}
