import { describe, expect, it, vi } from 'vitest';
import { createPageClaimsReader } from './pageClaims';

const claim = (claim_key: string) => ({ claim_key, canonical_url: 'https://example.com/' } as any);

describe('bounded finalized page reads', () => {
  it('deduplicates concurrent reads and caches them for the TTL', async () => {
    let now = 1000;
    const fetchClaims = vi.fn(async () => [claim('one')]);
    const read = createPageClaimsReader(fetchClaims, () => now, 100, 0);
    const [first, second] = await Promise.all([read('https://example.com/'), read('https://example.com/')]);
    expect(first).toEqual(second);
    expect(fetchClaims).toHaveBeenCalledTimes(1);
    await read('https://example.com/');
    expect(fetchClaims).toHaveBeenCalledTimes(1);
    now += 101;
    await read('https://example.com/');
    expect(fetchClaims).toHaveBeenCalledTimes(2);
  });

  it('keeps the last successful claims during a temporary RPC failure', async () => {
    let now = 1000;
    const fetchClaims = vi.fn()
      .mockResolvedValueOnce([claim('one')])
      .mockRejectedValueOnce(new Error('429 HTML gateway response'));
    const read = createPageClaimsReader(fetchClaims, () => now, 100, 0);
    await read('https://example.com/');
    now += 101;
    await expect(read('https://example.com/')).resolves.toEqual([claim('one')]);
    expect(fetchClaims).toHaveBeenCalledTimes(2);
  });
});
