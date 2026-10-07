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
const url = 'https://a-murex-one.vercel.app/v2-contradicted-strong.html';
const quote = 'A Covered Claim can protect value without publisher collateral.';
const prefix = 'Strong contradiction fixture: ';
const suffix = ' This proposition is challenged by the committed policy evidence.';
const body = `<!doctype html>\n<html><head><meta charset="utf-8"><title>MARGIN V2 Contradiction Fixture</title></head><body><main><h1>MARGIN V2 Contradiction Fixture</h1><p>${prefix}${quote}${suffix}</p></main></body></html>\n`;
const evidenceBody = 'The highlighted proposition is false. Covered Claim registration requires publisher collateral before protected value can be created, and the required challenge bond is also value-coupled. A Covered Claim cannot protect value without the required publisher collateral.\n';
const evidenceUrl = 'https://a-murex-one.vercel.app/v2-contradicted-strong-evidence.txt';
const challenge = 'Determine whether the committed policy evidence directly contradicts the highlighted proposition about protecting value without publisher collateral.';
const publisher = '0xac3ac69dc0bde389256dd6748c75817ead9286d9';
const pageKey = sha(url);
const pageDigest = sha(body);
const evidenceDigest = sha(evidenceBody);
const payload = { archiveUrl: '', canonicalUrl: url, challengeStatement: challenge, claimClass: 'TECHNICAL', exact: quote, evidenceUrls: [evidenceUrl], pageDigest, pageKey, prefix, suffix, v: 1 };
const claimKey = sha(canonicalJson(payload));
const manifest = {
  protocol_version: 2,
  claim_key: claimKey,
  publisher_wallet: publisher,
  domain: 'a-murex-one.vercel.app',
  canonical_url: url,
  claim_digest: sha(quote),
  anchor_digest: sha(`${prefix}|${quote}|${suffix}`),
  coverage_cap: 2,
  evidence_pack: [{
    evidence_id: 'v2-evidence-contradicted-strong',
    authority_profile: 'DOMAIN_CONTROLLED',
    url: evidenceUrl,
    expected_sha256: evidenceDigest,
    citation_exact: 'Covered Claim registration requires publisher collateral before protected value can be created',
    relation: 'CONTRADICTS',
    authority_metadata: { bounded_bytes: 40000 },
  }],
  evidence_pack_digest: '',
  // Filled after the normal finalized read observes GenLayer's rendered HTML.
  primary_artifact_sha256: '',
  issued_at: '2026-10-07T00:00:00+00:00',
  expires_at: '2027-01-01T00:00:00+00:00',
  nonce: 'margin-v2-contradicted-strong-20261007',
};
manifest.evidence_pack_digest = sha(canonicalJson(manifest.evidence_pack));
await mkdir(resolve(root, '.well-known/margin/claims'), { recursive: true });
await writeFile(resolve(root, 'v2-contradicted-strong.html'), body);
await writeFile(resolve(root, 'v2-contradicted-strong-evidence.txt'), evidenceBody);
await writeFile(resolve(root, `.well-known/margin/claims/${claimKey}.json`), `${JSON.stringify(manifest)}\n`);
console.log(JSON.stringify({ url, pageKey, pageDigest, evidenceDigest, claimKey, primaryArtifactSha256: null }, null, 2));
