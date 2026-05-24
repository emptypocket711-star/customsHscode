export function normalizeHsCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function formatHsCode(value: string) {
  const normalized = normalizeHsCode(value);

  if (normalized.length <= 4) {
    return normalized;
  }

  if (normalized.length <= 6) {
    return `${normalized.slice(0, 4)}.${normalized.slice(4)}`;
  }

  return `${normalized.slice(0, 4)}.${normalized.slice(4, 6)}-${normalized.slice(6)}`;
}
