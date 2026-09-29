import { describe, expect, it } from 'vitest';
import { signerChallengeUrl } from './signerUrl';

describe('signer challenge URL', () => {
  it('generates the routed challenge target', () => {
    expect(signerChallengeUrl('https://margin-signer.vercel.app/', 'abc')).toBe('https://margin-signer.vercel.app/challenge?draft=abc');
  });
});
