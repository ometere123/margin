import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

describe('signer routes', () => {
  const key = 'A'.repeat(64).toLowerCase();
  it('routes encoded drafts to challenge', () => expect(parseRoute('/challenge', '?draft=abc')).toEqual({ kind: 'challenge', draft: 'abc' }));
  it('loads direct claim and assurance routes without a draft', () => {
    expect(parseRoute(`/claim/${key}`)).toEqual({ kind: 'claim', claimKey: key });
    expect(parseRoute(`/claim/${key}/assurance`)).toEqual({ kind: 'assurance', claimKey: key });
  });
  it('fails closed for malformed or unknown routes', () => {
    expect(parseRoute('/claim/nope')).toEqual({ kind: 'not-found' });
    expect(parseRoute('/unknown')).toEqual({ kind: 'not-found' });
  });
});
