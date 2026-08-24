export function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return stripTrailingSlash(prod.startsWith("http") ? prod : `https://${prod}`);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return "http://localhost:3000";
}

export function getBrowserAuthBaseUrl() {
  if (typeof window === "undefined") return getSiteUrl();
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (isLocal) return window.location.origin;
  return getSiteUrl();
}

export function getBrowserPublicBaseUrl() {
  if (typeof window === "undefined") return getSiteUrl();
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (isLocal) return window.location.origin;
  return getSiteUrl();
}

export function makeAuthCallbackUrl(next = "/dashboard") {
  const base = getBrowserAuthBaseUrl();
  const url = new URL("/auth/callback", base);
  url.searchParams.set("next", next);
  return url.toString();
}
