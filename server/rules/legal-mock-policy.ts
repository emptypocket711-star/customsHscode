export function allowLegalMockFallback() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return true;
  }

  return process.env.ALLOW_LEGAL_MOCK_FALLBACK === "true" && process.env.NODE_ENV !== "production";
}
