import { describe, expect, it } from 'vitest';
import { assuredActions } from './assured';

const publisher = '0x0000000000000000000000000000000000000001';
const challenger = '0x0000000000000000000000000000000000000002';

describe('Assured Claim action gating', () => {
  it('only offers registration for a connected empty claim', () => expect(assuredActions(null, publisher)).toEqual(['register']));
  it('does not let the publisher challenge their own registered claim', () => expect(assuredActions({ state: 'REGISTERED', publisher }, publisher)).toEqual([]));
  it('offers resolve for a challenged claim and appeal only to a party', () => {
    expect(assuredActions({ state: 'CHALLENGED' }, challenger)).toEqual(['resolve']);
    expect(assuredActions({ state: 'RESOLVED', publisher, challenger, appeal_deadline: 200 }, publisher, 100)).toEqual(['appeal']);
  });
  it('offers settlement only after the deadline and withdrawal only for credit', () => {
    expect(assuredActions({ state: 'RESOLVED', appeal_deadline: 100 }, challenger, 101)).toEqual(['settle']);
    expect(assuredActions({ state: 'SETTLED', publisher, publisher_credit: 1 }, publisher)).toEqual(['withdraw']);
  });
});
