export type ProtectedReleaseView = {
  release_id?: string;
  claim_key?: string;
  creator?: string;
  beneficiary?: string;
  amount?: string | number | bigint;
  expiry?: string;
  executed?: boolean;
  refunded?: boolean;
  beneficiary_credit?: string | number | bigint;
  creator_credit?: string | number | bigint;
};

export function prioritizeProtectedReleases(
  releases: ProtectedReleaseView[],
  account: string | null,
): ProtectedReleaseView[] {
  const connected = account?.toLowerCase() || '';
  const own = (release: ProtectedReleaseView) => {
    const creator = String(release.creator || '').toLowerCase();
    const beneficiary = String(release.beneficiary || '').toLowerCase();
    return (creator === connected ? 2 : 0) + (beneficiary === connected ? 1 : 0);
  };
  return [...releases].sort((a, b) => own(b) - own(a) || String(a.release_id || '').localeCompare(String(b.release_id || '')));
}

export function mergeProtectedReleases(
  existing: ProtectedReleaseView[],
  incoming: ProtectedReleaseView[],
  account: string | null,
): ProtectedReleaseView[] {
  const byId = new Map<string, ProtectedReleaseView>();
  [...existing, ...incoming].forEach((release) => {
    if (release.release_id) byId.set(String(release.release_id), release);
  });
  return prioritizeProtectedReleases([...byId.values()], account);
}

export function consumerErrorMessage(error: unknown): string {
  const text = String((error as Error)?.message || error);
  if (text.includes('maximum protected releases reached for creator and claim')) {
    return 'This wallet has reached the 5-release limit for this claim.';
  }
  if (text.includes('protected release requires SETTLED SUPPORTED state')) {
    return 'This release can execute only after the Assured Claim is finalized SUPPORTED.';
  }
  if (text.includes('protected release is not refundable yet') || text.includes('release is not refundable yet')) {
    return 'This release is not refundable until the claim is terminal or the release expires.';
  }
  if (text.includes('only the release creator may refund')) return 'Only the release creator can refund it.';
  if (text.includes('caller has no release credit') || text.includes('no release credit')) return 'This wallet has no withdrawable credit for the selected release.';
  return text;
}
