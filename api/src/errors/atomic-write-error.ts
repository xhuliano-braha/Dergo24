import { ApiError } from './api-error';

export function atomicWriteError(error: { code?: string }, fallback: string) {
  switch (error.code) {
    case 'PT400':
      return new ApiError(
        'Kontrolloni të dhënat. Për dorëzim dhe arkëtim përdorni veprimin përkatës.',
        400,
      );
    case 'PT403':
      return new ApiError('Nuk keni leje për këtë dërgesë.', 403);
    case 'PT404':
      return new ApiError('Dërgesa nuk u gjet.', 404);
    case 'PT409':
    case '23505':
      return new ApiError(
        'Veprimi bie ndesh me një regjistrim ekzistues ose dërgesa është mbyllur.',
        409,
      );
    case '23503':
    case '23514':
    case '23502':
    case '22P02':
      return new ApiError(
        'Të dhënat nuk janë të vlefshme për këtë veprim.',
        400,
      );
    default:
      return new ApiError(fallback, 503);
  }
}
