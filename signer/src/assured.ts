export type AssuredState = 'REGISTERED' | 'CHALLENGED' | 'RESOLVED' | 'APPEALED' | 'SETTLED' | string;

export type AssuredClaimView = {
  claim_key?: string;
  publisher?: string;
  publisher_bond?: string | number | bigint;
  challenger?: string;
  challenge_bond?: string | number | bigint;
  state?: AssuredState;
  final_status?: string;
  appeal_deadline?: string | number | bigint;
  appeal_count?: string | number | bigint;
  settled?: boolean;
  publisher_credit?: string | number | bigint;
  challenger_credit?: string | number | bigint;
  appeal_reason?: string;
  source_manifest_digest?: string;
  latest_manifest?: unknown;
};

export type AssuredAction = 'register' | 'challenge' | 'resolve' | 'appeal' | 'resolveAppeal' | 'settle' | 'withdraw';

const zero = (value: unknown) => BigInt(String(value ?? 0)) === 0n;
const same = (a: string | null, b: unknown) => Boolean(a && typeof b === 'string' && a.toLowerCase() === b.toLowerCase());

export function assuredActions(claim: AssuredClaimView | null, account: string | null, now = Math.floor(Date.now() / 1000)): AssuredAction[] {
  if (!claim || !claim.state) return account ? ['register'] : [];
  const state = String(claim.state).toUpperCase();
  if (state === 'REGISTERED') return account && !same(account, claim.publisher) ? ['challenge'] : [];
  if (state === 'CHALLENGED') return account ? ['resolve'] : [];
  if (state === 'RESOLVED') {
    const deadline = Number(claim.appeal_deadline || 0);
    const appealOpen = deadline === 0 || now <= deadline;
    return appealOpen && Number(claim.appeal_count || 0) < 1 && (same(account, claim.publisher) || same(account, claim.challenger)) ? ['appeal'] : (deadline > 0 && now > deadline ? ['settle'] : []);
  }
  if (state === 'APPEALED') return account ? ['resolveAppeal'] : [];
  if (state === 'SETTLED') {
    const publisherCredit = same(account, claim.publisher) && !zero(claim.publisher_credit);
    const challengerCredit = same(account, claim.challenger) && !zero(claim.challenger_credit);
    return publisherCredit || challengerCredit ? ['withdraw'] : [];
  }
  return [];
}

export function assuredDisplay(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}
