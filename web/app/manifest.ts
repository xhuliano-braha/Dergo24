import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dergo24 Courier',
    short_name: 'Dergo24',
    description: 'Paneli mobile i korrierëve Dergo24',
    start_url: '/courier',
    display: 'standalone',
    background_color: '#071b33',
    theme_color: '#f45a0a',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
