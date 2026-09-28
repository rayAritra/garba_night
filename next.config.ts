import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const PHOTO_PATH = "/storage/v1/object/public/profile-photos/**";
const remotePatterns: RemotePattern[] = [{ protocol: "https", hostname: "*.supabase.co", pathname: PHOTO_PATH }];

// Also allow the configured project host (custom domains, or a local `supabase start` stack).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let localSupabase = false;
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    localSupabase = ["localhost", "127.0.0.1"].includes(url.hostname);
    remotePatterns.push({ protocol: url.protocol === "http:" ? "http" : "https", hostname: url.hostname, port: url.port, pathname: PHOTO_PATH });
  } catch {}
}

const nextConfig: NextConfig = {
  images: { remotePatterns, qualities: [75], dangerouslyAllowLocalIP: localSupabase },
  poweredByHeader: false,
};

export default nextConfig;
