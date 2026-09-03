import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uynjtsddppyeieifrlyo.supabase.co',
        pathname: '/storage/v1/object/sign/delivery-proofs/**',
      },
    ],
  },
};

export default nextConfig;
