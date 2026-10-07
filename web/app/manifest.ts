import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dergo24',
    short_name: 'Dergo24',
    description: 'Dërgesa në gjithë Shqipërinë',
    start_url: '/',
    display: 'standalone',
    background_color: '#071b33',
    theme_color: '#f45a0a',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
