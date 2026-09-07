import { ApiError } from '../errors/api-error';

function matches(bytes: Uint8Array, offset: number, expected: number[]) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

export function validImageBytes(bytes: Uint8Array, type: string) {
  if (type === 'image/png') {
    if (bytes.length < 45 || !matches(bytes, 0, [137, 80, 78, 71, 13, 10, 26, 10])) return false;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return view.getUint32(8) === 13 && matches(bytes, 12, [73, 72, 68, 82]) &&
      width > 0 && height > 0 && width * height <= 40000000 &&
      matches(bytes, bytes.length - 12, [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  }
  if (type === 'image/jpeg')
    return bytes.length >= 4 && matches(bytes, 0, [255, 216, 255]) &&
      matches(bytes, bytes.length - 2, [255, 217]);
  if (type === 'image/webp')
    return bytes.length >= 20 && matches(bytes, 0, [82, 73, 70, 70]) &&
      matches(bytes, 8, [87, 69, 66, 80]) &&
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) === bytes.length - 8 &&
      matches(bytes, 12, [86, 80, 56]) && [32, 76, 88].includes(bytes[15]);
  return false;
}

export function validSignature(value: string) {
  const encoded = value.slice('data:image/png;base64,'.length);
  if (!value.startsWith('data:image/png;base64,') || encoded.length === 0 ||
      encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
  try {
    const decoded = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    return validImageBytes(decoded, 'image/png');
  } catch {
    return false;
  }
}

export async function validatePhoto(photo: File) {
  if (photo.size === 0 || photo.size > 5 * 1024 * 1024 ||
      !validImageBytes(new Uint8Array(await photo.arrayBuffer()), photo.type))
    throw new ApiError('Fotoja duhet të jetë JPG, PNG ose WEBP e vlefshme deri në 5 MB.', 400);
}
