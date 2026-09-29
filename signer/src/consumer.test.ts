import { describe, expect, it } from 'vitest';
import { consumerErrorMessage, mergeProtectedReleases, prioritizeProtectedReleases } from './consumer';

const release = (id: string, creator: string, beneficiary: string) => ({ release_id: id, creator, beneficiary });
const wallet = '0x0000000000000000000000000000000000000001';

describe('protected release presentation', () => {
  it('puts connected creator and beneficiary releases first', () => {
    const result = prioritizeProtectedReleases([
      release('2', '0x0000000000000000000000000000000000000002', wallet),
      release('3', '0x0000000000000000000000000000000000000003', '0x0000000000000000000000000000000000000004'),
      release('1', wallet, '0x0000000000000000000000000000000000000005'),
    ], wallet);
    expect(result.map((item) => item.release_id)).toEqual(['1', '2', '3']);
  });

  it('merges pages without hiding an own release beyond the first page', () => {
    const firstPage = Array.from({ length: 25 }, (_, index) => release(String(index), '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003'));
    const own = release('26', wallet, '0x0000000000000000000000000000000000000003');
    const merged = mergeProtectedReleases(firstPage, [own], wallet);
    expect(merged).toHaveLength(26);
    expect(merged[0].release_id).toBe('26');
  });

  it('maps the per-creator cap revert to an actionable message', () => {
    expect(consumerErrorMessage(new Error('maximum protected releases reached for creator and claim'))).toContain('5-release limit');
  });
});
