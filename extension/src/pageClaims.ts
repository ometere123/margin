import type { MarginClaim } from '../../shared/protocol';

export const PAGE_CLAIMS_CACHE_TTL_MS = 15_000;
// A single readContract can make more than one RPC request. Keep the global
// cadence well below the provider's 30-request/minute gateway limit even when
// several tabs are polling different pages.
export const PAGE_CLAIMS_MIN_RPC_INTERVAL_MS = 7_500;

type CacheEntry = { claims: MarginClaim[]; fetchedAt: number };
export type PageClaimsRead =
  | { ok: true; claims: MarginClaim[] }
  | { ok: false; claims: MarginClaim[]; error: string };

/** Bound direct finalized reads made by dynamic pages. */
export function createPageClaimsReader(
  fetchClaims: (canonicalUrl: string) => Promise<MarginClaim[]>,
  now: () => number = () => Date.now(),
  ttlMs = PAGE_CLAIMS_CACHE_TTL_MS,
  minRpcIntervalMs = PAGE_CLAIMS_MIN_RPC_INTERVAL_MS,
) {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<PageClaimsRead>>();
  let nextRpcAt = 0;
  let suppressUntil = 0;

  async function waitForRpcSlot() {
    const waitMs = Math.max(0, nextRpcAt - now());
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    nextRpcAt = Math.max(nextRpcAt, now()) + minRpcIntervalMs;
  }

  return async function read(canonicalUrl: string): Promise<PageClaimsRead> {
    const cached = cache.get(canonicalUrl);
    if (cached && now() - cached.fetchedAt < ttlMs) return { ok: true, claims: cached.claims };
    if (now() < suppressUntil) return { ok: false, claims: cached?.claims || [], error: 'temporary RPC failure cooldown' };
    const existing = inFlight.get(canonicalUrl);
    if (existing) return existing;

    const request = waitForRpcSlot().then(() => fetchClaims(canonicalUrl))
      .then((claims) => {
        cache.set(canonicalUrl, { claims, fetchedAt: now() });
        return { ok: true as const, claims };
      })
      .catch((error) => {
        // Preserve a last known finalized result during a temporary gateway or
        // rate-limit failure; do not make an annotation disappear optimistically.
        // Also suppress a burst of retries when there is no cached result. The
        // next scheduled read will try again after the gateway cooldown.
        suppressUntil = now() + 15_000;
        return {
          ok: false as const,
          claims: cached?.claims || [],
          error: String((error as Error)?.message || error),
        };
      })
      .finally(() => inFlight.delete(canonicalUrl));
    inFlight.set(canonicalUrl, request);
    return request;
  };
}
