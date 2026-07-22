import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : "lheltgehwtavkmdumior.supabase.co";
  } catch {
    return "lheltgehwtavkmdumior.supabase.co";
  }
})();

const nextConfig: NextConfig = {
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
