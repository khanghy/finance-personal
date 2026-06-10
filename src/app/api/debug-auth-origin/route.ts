import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const requestHeaders = await headers();
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? null;
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const proto = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");
  const origin = configuredSiteUrl && configuredSiteUrl !== "http://localhost:3000"
    ? configuredSiteUrl.replace(/\/$/, "")
    : host
      ? `${proto}://${host}`
      : configuredSiteUrl ?? "http://localhost:3000";

  return NextResponse.json({
    configuredSiteUrl,
    forwardedHost,
    host: requestHeaders.get("host"),
    forwardedProto,
    computedOrigin: origin,
    emailRedirectTo: `${origin}/auth/callback`,
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
