export function signerChallengeUrl(signerUrl: string, encodedDraft: string): string {
  const target = new URL('/challenge', signerUrl);
  target.searchParams.set('draft', encodedDraft);
  return target.toString();
}
