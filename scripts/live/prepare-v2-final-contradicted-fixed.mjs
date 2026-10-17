import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

const root = resolve('scripts/live/hosted/a');
const url = 'https://a-murex-one.vercel.app/v2-final-contradicted-fixed-20261017.html';
const evidenceUrl = 'https://a-murex-one.vercel.app/v2-final-contradicted-fixed-20261017-evidence.txt';
const quote = 'MARGIN publisher collateral pays release losses to release creators and beneficiaries.';
const prefix = 'Final contradicted fixed fixture: ';
const suffix = ' This intentionally false statement is challenged by the committed policy evidence.';
const challenge = 'Confirm whether publisher collateral pays release losses to release creators and beneficiaries.';
const body = `<!doctype html>\n<html><head><meta charset="utf-8"><title>MARGIN V2 Final Contradicted Covered Claim Fixed</title></head><body><main><h1>MARGIN V2 Final Contradicted Covered Claim Fixed</h1><p>${prefix}${quote}${suffix}</p></main></body></html>\n`;
const evidenceBody = 'Publisher collateral is a dispute stake and is not paid to release creators or beneficiaries. Release principal is funded separately through the canonical consumer.\n';
const pageKey = sha(url);
const pageDigest = sha(body);
const evidenceDigest = sha(evidenceBody);
const payload = { archiveUrl: '', canonicalUrl: url, challengeStatement: challenge, claimClass: 'TECHNICAL', exact: quote, evidenceUrls: [evidenceUrl], pageDigest, pageKey, prefix, suffix, v: 1 };
const claimKey = sha(canonicalJson(payload));
const evidencePack = [{
  authority_metadata: { bounded_bytes: 40000 },
  authority_profile: 'DOMAIN_CONTROLLED',
  citation_exact: 'Publisher collateral is a dispute stake and is not paid to release creators or beneficiaries.',
  evidence_id: 'final-contradicted-fixed-20261017',
  expected_sha256: evidenceDigest,
  relation: 'CONTRADICTS',
  url: evidenceUrl,
}];
const manifest = {
  protocol_version: 2,
  claim_key: claimKey,
  publisher_wallet: '0xac3ac69dc0bde389256dd6748c75817ead9286d9',
  domain: 'a-murex-one.vercel.app',
  canonical_url: url,
  claim_digest: sha(quote),
  anchor_digest: sha(`${prefix}|${quote}|${suffix}`),
  coverage_cap: 2,
  evidence_pack: evidencePack,
  evidence_pack_digest: sha(canonicalJson(evidencePack)),
  primary_artifact_sha256: pageDigest,
  issued_at: '2026-10-17T00:00:00+00:00',
  expires_at: '2027-10-17T00:00:00+00:00',
  nonce: 'margin-final-contradicted-fixed-20261017',
};
await mkdir(resolve(root, '.well-known/margin/claims'), { recursive: true });
await writeFile(resolve(root, 'v2-final-contradicted-fixed-20261017.html'), body);
await writeFile(resolve(root, 'v2-final-contradicted-fixed-20261017-evidence.txt'), evidenceBody);
await writeFile(resolve(root, `.well-known/margin/claims/${claimKey}.json`), `${JSON.stringify(manifest)}\n`);
console.log(JSON.stringify({ url, evidenceUrl, pageKey, pageDigest, evidenceDigest, claimKey, manifest }, null, 2));
