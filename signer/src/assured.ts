export type AssuredState = 'REGISTERED' | 'CHALLENGED' | 'RESOLVED' | 'APPEALED' | 'SETTLED' | 'CANCELLED' | 'ABORTED' | string;

export type AssuredClaimView = {
  claim_key?: string;
  publisher?: string;
  publisher_bond?: string | number | bigint;
  challenger?: string;
  challenge_bond?: string | number | bigint;
  domain_proof_url?: string;
  proof_expires_at?: string;
  proof_digest?: string;
  state?: AssuredState;
  final_status?: string;
  appeal_deadline?: string | number | bigint;
  appeal_count?: string | number | bigint;
  settled?: boolean;
  publisher_credit?: string | number | bigint;
  challenger_credit?: string | number | bigint;
  appeal_reason?: string;
  appeal_bond?: string | number | bigint;
  source_manifest_digest?: string;
  latest_manifest?: unknown;
  state_started_at?: string;
};

export type CoveredClaimView = {
  claim_key?: string;
  publisher?: string;
  manifest_url?: string;
  manifest_digest?: string;
  evidence_pack_digest?: string;
  coverage_cap?: string | number | bigint;
  publisher_collateral?: string | number | bigint;
  required_challenge_bond?: string | number | bigint;
  required_appeal_bond?: string | number | bigint;
  active_exposure?: string | number | bigint;
  available_coverage?: string | number | bigint;
  state?: AssuredState;
  final_status?: string;
  challenger?: string;
  challenge_bond?: string | number | bigint;
  appeal_bond?: string | number | bigint;
  appeal_deadline?: string;
  settled?: boolean;
  publisher_credit?: string | number | bigint;
  challenger_credit?: string | number | bigint;
};

export type AssuredAction = 'register' | 'registerCovered' | 'challenge' | 'resolve' | 'appeal' | 'resolveAppeal' | 'settle' | 'withdraw' | 'cancel' | 'abort';

export function coveredBondValue(
  action: 'challenge' | 'appeal',
  coveredClaim: CoveredClaimView | null,
  coveredReadHealthy = true,
): bigint {
  if (!coveredClaim) {
    if (!coveredReadHealthy) throw new Error('Covered Claim state could not be read safely; retry before signing.');
    return 1n;
  }
  const raw = action === 'challenge' ? coveredClaim.required_challenge_bond : coveredClaim.required_appeal_bond;
  if (raw === undefined || raw === null || !/^\d+$/.test(String(raw)) || BigInt(String(raw)) <= 0n) {
    throw new Error(`Canonical Covered Claim ${action} bond is unavailable; transaction blocked.`);
  }
  return BigInt(String(raw));
}

export function protectedReleaseCoverageError(amount: bigint, coveredClaim: CoveredClaimView | null): string | null {
  if (!coveredClaim) return null;
  const available = BigInt(String(coveredClaim.available_coverage ?? 0));
  return amount <= available
    ? null
    : `Protected release amount ${amount.toString()} exceeds available Covered Claim coverage ${available.toString()}.`;
}

const zero = (value: unknown) => BigInt(String(value ?? 0)) === 0n;
const same = (a: string | null, b: unknown) => Boolean(a && typeof b === 'string' && a.toLowerCase() === b.toLowerCase());

export function assuredActions(claim: AssuredClaimView | null, account: string | null, now = Math.floor(Date.now() / 1000)): AssuredAction[] {
  if (!claim || !claim.state) return account ? ['register', 'registerCovered'] : [];
  const state = String(claim.state).toUpperCase();
  if (state === 'REGISTERED') {
    if (same(account, claim.publisher)) return ['cancel'];
    return account ? ['challenge'] : [];
  }
  if (state === 'CHALLENGED') {
    const actions: AssuredAction[] = account ? ['resolve'] : [];
    const startedMs = claim.state_started_at ? Date.parse(claim.state_started_at) : NaN;
    if (Number.isFinite(startedMs) && Date.now() >= startedMs + 86400 * 1000 && (same(account, claim.publisher) || same(account, claim.challenger))) actions.push('abort');
    return actions;
  }
  if (state === 'RESOLVED') {
    const rawDeadline = claim.appeal_deadline;
    const deadlineMs = typeof rawDeadline === 'string' ? Date.parse(rawDeadline) : Number(rawDeadline || 0) * 1000;
    const nowMs = now < 10_000_000_000 ? now * 1000 : now;
    const appealOpen = Number.isFinite(deadlineMs) && nowMs <= deadlineMs;
    return appealOpen && Number(claim.appeal_count || 0) < 1 && (same(account, claim.publisher) || same(account, claim.challenger)) ? ['appeal'] : (!appealOpen && Number.isFinite(deadlineMs) && nowMs > deadlineMs ? ['settle'] : []);
  }
  if (state === 'APPEALED') {
    const actions: AssuredAction[] = account ? ['resolveAppeal'] : [];
    const startedMs = claim.state_started_at ? Date.parse(claim.state_started_at) : NaN;
    if (Number.isFinite(startedMs) && Date.now() >= startedMs + 86400 * 1000 && (same(account, claim.publisher) || same(account, claim.challenger))) actions.push('abort');
    return actions;
  }
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
