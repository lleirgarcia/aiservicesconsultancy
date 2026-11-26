import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : "lheltgehwtavkmdumior.supabase.co";
  } catch {
    return "lheltgehwtavkmdumior.supabase.co";
  }
})();

// Demo de agentes (ver agentes/): backend FastAPI en BASE_PORT+1 salvo que se fije AGENTES_URL.
const agentesUrl =
  process.env.AGENTES_URL ?? `http://127.0.0.1:${Number(process.env.BASE_PORT ?? 5520) + 1}`;

const nextConfig: NextConfig = {
  // El gzip de Next retiene el stream SSE de la demo de agentes (los eventos no llegan hasta el final).
  compress: false,
  async rewrites() {
    return [{ source: "/agentes-app/:path*", destination: `${agentesUrl}/:path*` }];
  },
  allowedDevOrigins: ["192.168.1.70", "vps", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/blog-images/**",
      },
    ],
  },
};

export default nextConfig;
