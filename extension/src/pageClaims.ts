import type { MarginClaim } from '../../shared/protocol';

export const PAGE_CLAIMS_CACHE_TTL_MS = 15_000;
export const PAGE_CLAIMS_MIN_RPC_INTERVAL_MS = 2_500;

type CacheEntry = { claims: MarginClaim[]; fetchedAt: number };

/** Bound direct finalized reads made by dynamic pages. */
export function createPageClaimsReader(
  fetchClaims: (canonicalUrl: string) => Promise<MarginClaim[]>,
  now: () => number = () => Date.now(),
  ttlMs = PAGE_CLAIMS_CACHE_TTL_MS,
  minRpcIntervalMs = PAGE_CLAIMS_MIN_RPC_INTERVAL_MS,
) {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<MarginClaim[]>>();
  let nextRpcAt = 0;

  async function waitForRpcSlot() {
    const waitMs = Math.max(0, nextRpcAt - now());
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    nextRpcAt = Math.max(nextRpcAt, now()) + minRpcIntervalMs;
  }

  return async function read(canonicalUrl: string): Promise<MarginClaim[]> {
    const cached = cache.get(canonicalUrl);
    if (cached && now() - cached.fetchedAt < ttlMs) return cached.claims;
    const existing = inFlight.get(canonicalUrl);
    if (existing) return existing;

    const request = waitForRpcSlot().then(() => fetchClaims(canonicalUrl))
      .then((claims) => {
        cache.set(canonicalUrl, { claims, fetchedAt: now() });
        return claims;
      })
      .catch((error) => {
        // Preserve a last known finalized result during a temporary gateway or
        // rate-limit failure; do not make an annotation disappear optimistically.
        if (cached) return cached.claims;
        throw error;
      })
      .finally(() => inFlight.delete(canonicalUrl));
    inFlight.set(canonicalUrl, request);
    return request;
  };
}
