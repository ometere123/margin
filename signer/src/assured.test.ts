import { describe, expect, it } from 'vitest';
import { assuredActions } from './assured';

const publisher = '0x0000000000000000000000000000000000000001';
const challenger = '0x0000000000000000000000000000000000000002';

describe('Assured Claim action gating', () => {
  it('only offers registration for a connected empty claim', () => expect(assuredActions(null, publisher)).toEqual(['register']));
  it('lets the publisher cancel their own registered claim, but not challenge it', () => expect(assuredActions({ state: 'REGISTERED', publisher }, publisher)).toEqual(['cancel']));
  it('lets another wallet challenge a registered claim', () => expect(assuredActions({ state: 'REGISTERED', publisher }, challenger)).toEqual(['challenge']));
  it('offers resolve for a challenged claim and appeal only to a party', () => {
    expect(assuredActions({ state: 'CHALLENGED' }, challenger)).toEqual(['resolve']);
    expect(assuredActions({ state: 'RESOLVED', publisher, challenger, appeal_deadline: '2026-10-01T12:00:00+00:00' }, publisher, Date.parse('2026-10-01T11:00:00+00:00'))).toEqual(['appeal']);
    expect(assuredActions({ state: 'RESOLVED', publisher, challenger, appeal_deadline: '2026-10-01T12:00:00+00:00' }, publisher, Date.parse('2026-10-01T13:00:00+00:00'))).toEqual(['settle']);
    expect(assuredActions({ state: 'RESOLVED', publisher, challenger, appeal_deadline: 'not-a-date' }, publisher, Date.parse('2026-10-01T13:00:00+00:00'))).toEqual([]);
  });
  it('offers settlement only after the deadline and withdrawal only for credit', () => {
    expect(assuredActions({ state: 'RESOLVED', appeal_deadline: 100 }, challenger, 101)).toEqual(['settle']);
    expect(assuredActions({ state: 'SETTLED', publisher, publisher_credit: 1 }, publisher)).toEqual(['withdraw']);
  });
  it('offers a stalled abort only to lifecycle parties after the timeout', () => {
    const started = new Date(Date.now() - 86_400_001).toISOString();
    expect(assuredActions({ state: 'CHALLENGED', publisher, challenger, state_started_at: started }, publisher)).toEqual(['resolve', 'abort']);
    expect(assuredActions({ state: 'CHALLENGED', publisher, challenger, state_started_at: started }, '0x0000000000000000000000000000000000000003')).toEqual(['resolve']);
  });
});
