export const completionPreviewEnvFile: string;

export function parseEnvFile(text: string): Map<string, string>;

export function loadEnvFile(filePath?: string): Promise<{
  entries: Map<string, string>;
  exists: boolean;
}>;

export function envValue(
  localEnv: {
    entries: Map<string, string>;
    exists: boolean;
  },
  key: string
): string | undefined;

export function mergedEnv(
  localEnv: {
    entries: Map<string, string>;
    exists: boolean;
  },
  overrides?: Record<string, string | undefined>
): NodeJS.ProcessEnv;

export function safeOrigin(value: string | undefined): string;

export function isLocalUrl(value: string | undefined): boolean;

export function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<{
  ok: boolean;
  status: number | string;
}>;
