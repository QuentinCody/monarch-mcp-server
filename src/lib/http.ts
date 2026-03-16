import { restFetch } from "@bio-mcp/shared/http/rest-fetch";
import type { RestFetchOptions } from "@bio-mcp/shared/http/rest-fetch";

const MONARCH_BASE = "https://api.monarchinitiative.org/v3/api";

export interface MonarchFetchOptions extends Omit<RestFetchOptions, "retryOn"> {
    baseUrl?: string;
}

/**
 * Fetch from the Monarch Initiative API v3.
 */
export async function monarchFetch(
    path: string,
    params?: Record<string, unknown>,
    opts?: MonarchFetchOptions,
): Promise<Response> {
    const baseUrl = opts?.baseUrl ?? MONARCH_BASE;
    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(opts?.headers ?? {}),
    };

    return restFetch(baseUrl, path, params, {
        ...opts,
        headers,
        retryOn: [429, 500, 502, 503],
        retries: opts?.retries ?? 3,
        timeout: opts?.timeout ?? 30_000,
        userAgent: "monarch-mcp-server/1.0 (bio-mcp)",
    });
}
