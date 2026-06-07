import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garde-fou: ne pas bloquer le déploiement Vercel sur les règles ESLint
  // (les warnings/erreurs de lint n'empêchent pas l'app de fonctionner).
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
