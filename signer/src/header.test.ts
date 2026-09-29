import { describe, expect, it } from 'vitest';
import { walletHeaderState } from './session';

describe('global wallet header state', () => {
  it('shows connect and a non-active network state when disconnected', () => {
    expect(walletHeaderState(null, true)).toEqual({ connected: false, networkActive: false });
  });
  it('shows the active Studionet state only for a connected wallet on chain', () => {
    expect(walletHeaderState('0x' + '1'.repeat(40), true)).toEqual({ connected: true, networkActive: true });
    expect(walletHeaderState('0x' + '1'.repeat(40), false)).toEqual({ connected: true, networkActive: false });
  });
});
