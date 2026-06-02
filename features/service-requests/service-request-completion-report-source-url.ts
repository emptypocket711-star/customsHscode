export function safeCompletionReportSourceHref(sourceUrl?: string) {
  if (!sourceUrl) return null;
  if (sourceUrl.startsWith("https://") || sourceUrl.startsWith("http://")) return sourceUrl;
  return null;
}
