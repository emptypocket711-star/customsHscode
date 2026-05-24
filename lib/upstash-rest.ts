type UpstashPipelineResponse = Array<{ result?: unknown; error?: string }>;

export function hasUpstashRestEnv() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function upstashPipeline(commands: Array<Array<string | number>>) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(Number(process.env.UPSTASH_REDIS_TIMEOUT_MS || 3000))
  });

  if (!response.ok) return null;

  const payload = await response.json() as UpstashPipelineResponse;
  if (!Array.isArray(payload)) return null;
  if (payload.some((item) => item.error)) return null;

  return payload;
}

export async function upstashCommand(command: Array<string | number>) {
  const result = await upstashPipeline([command]);
  return result?.[0]?.result;
}

