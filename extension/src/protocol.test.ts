import { describe, expect, it } from 'vitest';
import { canonicalizeUrl, claimKeyFor, pageKeyFor } from '../../shared/protocol';

describe('MARGIN protocol derivations', () => {
  it('removes fragments and tracking parameters while retaining semantic query params', () => {
    expect(canonicalizeUrl('https://example.com/a?utm_source=x&version=2#here')).toBe('https://example.com/a?version=2');
  });
  it('derives stable page keys', async () => {
    expect(await pageKeyFor('https://example.com/a#x')).toBe(await pageKeyFor('https://example.com/a'));
  });
  it('binds challenge text into the claim key', async () => {
    const base = {
      canonicalUrl:'https://example.com/a', pageTitle:'x', pageKey:await pageKeyFor('https://example.com/a'),
      anchor:{exact:'This package supports Node 18.',prefix:'',suffix:''}, pageDigest:'a'.repeat(64), claimClass:'COMPATIBILITY' as const,
      challengeStatement:'The current documentation says Node 20 or newer.', evidenceUrls:['https://example.com/docs'], archiveUrl:'', capturedAt:'2026-09-27T00:00:00Z'
    };
    const a = await claimKeyFor(base);
    const b = await claimKeyFor({...base, challengeStatement:'A different precise objection.'});
    expect(a).not.toBe(b);
  });
});
