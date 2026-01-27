import { setTimeout as delay } from "node:timers/promises";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 3;

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  verbose?: boolean;
}

export async function requestJson<T>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<{ data: T; response: Response }> {
  const response = await fetchWithRetry(url, options);
  const text = await response.text();
  let data = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch (error) {
      const parseError = new Error(`Failed to parse JSON response from ${url}.`);
      (parseError as any).cause = error;
      (parseError as any).status = response.status;
      throw parseError;
    }
  }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }
  return { data, response };
}

export async function fetchWithRetry(
  url: string,
  options: HttpRequestOptions,
): Promise<Response> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout(url, options);
      if (response.status === 429 && attempt < retries) {
        const retryAfter = response.headers.get("retry-after");
        const delayMs = retryAfter ? Number(retryAfter) * 1000 : 1000 * attempt;
        await delay(delayMs);
        continue;
      }
      return response;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      await delay(1000 * attempt);
    }
  }
}

async function fetchWithTimeout(
  url: string,
  options: HttpRequestOptions,
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const mergedSignal = options.signal
    ? mergeSignals(options.signal, controller.signal)
    : controller.signal;

  try {
    if (options.verbose) {
      // eslint-disable-next-line no-console
      console.error(`[fitbit] ${options.method ?? "GET"} ${url}`);
    }
    return await fetch(url, {
      method: options.method ?? "GET",
      headers: options.headers,
      body: options.body,
      signal: mergedSignal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function mergeSignals(signalA: AbortSignal, signalB: AbortSignal): AbortSignal {
  if (signalA.aborted) {
    return signalA;
  }
  if (signalB.aborted) {
    return signalB;
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signalA.addEventListener("abort", onAbort, { once: true });
  signalB.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
}
