/**
 * Environment variable access with safe defaults.
 * Use this everywhere instead of `import.meta.env` directly so we
 * can fail loudly in production if a critical key is missing.
 */

function read(name: string, fallback = ""): string {
  // Vite injects import.meta.env at build time.
  // Fall back to process.env for SSR / runtime envs.
  const v =
    (import.meta as any).env?.[name] ??
    (typeof process !== "undefined" ? (process.env as any)?.[name] : "");
  return v && v.length > 0 ? String(v) : fallback;
}

export const env = {
  supabaseUrl: () => read("VITE_SUPABASE_URL"),
  supabaseAnonKey: () => read("VITE_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => read("SUPABASE_SERVICE_ROLE_KEY"),
  siteUrl: () => read("VITE_SITE_URL", "https://brightedge.co.ke"),
  siteName: () => read("VITE_SITE_NAME", "Bright Edge Agency"),
  storageBaseUrl: () => read("VITE_STORAGE_BASE_URL"),
  shortUrlBase: () => read("VITE_SHORT_URL_BASE") || read("VITE_SITE_URL", "https://brightedge.co.ke"),
  whatsappOtpNumber: () => read("VITE_WHATSAPP_OTP_NUMBER"),
  openaiKey: () => read("OPENAI_API_KEY"),
  isDev: () => Boolean((import.meta as any).env?.DEV),
  isProd: () => Boolean((import.meta as any).env?.PROD),
};

/**
 * Throws a clear error if a required env var is missing.
 * Use at server boot or in queries that need the value.
 */
export function requireEnv(name: string): string {
  const v = read(name);
  if (!v) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local for development or in Vercel Project Settings for production.`,
    );
  }
  return v;
}
