import { describe, expect, it } from 'vitest';
import { accountFromProvider, accountRequestMethod, isStudionetChainHex, shouldAutoRestore } from './session';

describe('injected wallet session policy', () => {
  it('silently restores authorised accounts without requesting permission', () => {
    expect(accountRequestMethod(false)).toBe('eth_accounts');
    expect(accountFromProvider(['0x81301DD9C3605a7DA743D87b803156d8445620B0'])).toBe('0x81301DD9C3605a7DA743D87b803156d8445620B0');
  });
  it('uses an explicit request only after Connect', () => {
    expect(accountRequestMethod(true)).toBe('eth_requestAccounts');
  });
  it('suppresses auto-restore after explicit MARGIN disconnect', () => {
    expect(shouldAutoRestore('1')).toBe(false);
    expect(shouldAutoRestore(null)).toBe(true);
  });
  it('tracks account and chain changes defensively', () => {
    expect(accountFromProvider([])).toBeNull();
    expect(accountFromProvider(['not-an-address'])).toBeNull();
    expect(isStudionetChainHex('0xf22f')).toBe(true);
    expect(isStudionetChainHex('0xf21d')).toBe(false);
  });
});
