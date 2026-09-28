export const MARGIN_CHAIN_ID = 61999 as const;
export const MARGIN_NETWORK_NAME = 'studionet' as const;
export const MARGIN_RPC_URL = 'https://studio.genlayer.com/api' as const;
export const MARGIN_EXPLORER_URL = 'https://explorer-studio.genlayer.com' as const;
export const MARGIN_CONTRACT_ADDRESS = '0xb4161203706B2428D5FbC5B7e114b09d1De32960' as const;
export const MARGIN_SIGNER_URL = 'https://margin-signer.vercel.app/' as const;

export const CLAIM_CLASSES = [
  'TECHNICAL',
  'LICENSE',
  'COMPATIBILITY',
  'PRICING',
  'DOCUMENTATION',
] as const;

export type ClaimClass = (typeof CLAIM_CLASSES)[number];
export type ClaimStatus = 'OPEN' | 'SUPPORTED' | 'CONTRADICTED' | 'INCONCLUSIVE' | 'STALE';

export interface TextAnchor {
  exact: string;
  prefix: string;
  suffix: string;
}

export interface ClaimDraft {
  canonicalUrl: string;
  pageTitle: string;
  pageKey: string;
  claimKey: string;
  anchor: TextAnchor;
  pageDigest: string;
  claimClass: ClaimClass;
  challengeStatement: string;
  evidenceUrls: string[];
  archiveUrl: string;
  capturedAt: string;
}

export interface MarginClaim {
  claim_key: string;
  page_key: string;
  canonical_url: string;
  quote: string;
  prefix: string;
  suffix: string;
  page_digest: string;
  claim_class: ClaimClass;
  challenge_statement: string;
  evidence_urls_json: string;
  archive_url: string;
  challenger: string;
  created_at: string;
  status: ClaimStatus;
  rationale: string;
  resolved_at: string;
  revision: number | bigint;
  source_manifest_digest?: string;
  latest_manifest?: Record<string, unknown>;
}

const TRACKING_KEYS = new Set([
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'ref_src',
]);

export function canonicalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = '';
  const kept = [...url.searchParams.entries()]
    .filter(([key]) => !key.toLowerCase().startsWith('utm_') && !TRACKING_KEYS.has(key.toLowerCase()))
    .sort(([a, av], [b, bv]) => (a === b ? av.localeCompare(bv) : a.localeCompare(b)));
  url.search = '';
  for (const [k, v] of kept) url.searchParams.append(k, v);
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }
  return url.toString();
}

export function normalizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function pageKeyFor(url: string): Promise<string> {
  return sha256Hex(canonicalizeUrl(url));
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function claimKeyFor(input: Omit<ClaimDraft, 'claimKey'>): Promise<string> {
  const payload = {
    archiveUrl: input.archiveUrl,
    canonicalUrl: input.canonicalUrl,
    challengeStatement: input.challengeStatement,
    claimClass: input.claimClass,
    exact: input.anchor.exact,
    evidenceUrls: [...input.evidenceUrls].sort(),
    pageDigest: input.pageDigest,
    pageKey: input.pageKey,
    prefix: input.anchor.prefix,
    suffix: input.anchor.suffix,
    v: 1,
  };
  return sha256Hex(canonicalJson(payload));
}

export function encodeDraft(draft: ClaimDraft): string {
  const json = JSON.stringify(draft);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeDraft(encoded: string): ClaimDraft {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as ClaimDraft;
}

export function isHex64(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}
