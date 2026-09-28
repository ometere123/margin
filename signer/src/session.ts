export function accountFromProvider(accounts: unknown): `0x${string}` | null {
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) return null;
  return accounts[0] as `0x${string}`;
}

export function accountRequestMethod(explicit: boolean): 'eth_requestAccounts' | 'eth_accounts' {
  return explicit ? 'eth_requestAccounts' : 'eth_accounts';
}

export function shouldAutoRestore(marker: string | null): boolean {
  return marker !== '1';
}

export function isStudionetChainHex(chainHex: string): boolean {
  return Number.parseInt(chainHex, 16) === 61999;
}
