import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

const root = resolve('scripts/live/hosted/a');
const url = 'https://a-murex-one.vercel.app/v2-final-supported.html';
const body = '<!doctype html>\n<html><head><meta charset="utf-8"><title>MARGIN V2 Final Supported Covered Claim</title></head><body><main><h1>MARGIN V2 Final Supported Covered Claim</h1><p>Final V2 Covered Claim fixture: The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value. This page is frozen for the final V2 support evidence.</p></main></body></html>\n';
const quote = 'The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value.';
const prefix = 'Final V2 Covered Claim fixture: ';
const suffix = ' This page is frozen for the final V2 support evidence.';
const challenge = 'Confirm that the final V2 Covered Claim statement is supported by the publisher evidence artifact.';
const evidenceUrl = 'https://a-murex-one.vercel.app/v2-evidence.txt';
const publisher = '0xac3ac69dc0bde389256dd6748c75817ead9286d9';
const pageKey = sha(url);
const pageDigest = sha(body);
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
    evidence_id: 'v2-evidence-final',
    authority_profile: 'DOMAIN_CONTROLLED',
    url: evidenceUrl,
    expected_sha256: '4c7c5838e77a68f45014ccba58317c668cb83d0d94234967ee89bc3770611228',
    citation_exact: 'finalized evidence commitments and value coverage are part of the Covered Claim fixture.',
    relation: 'SUPPORTS',
    authority_metadata: { bounded_bytes: 40000 },
  }],
  evidence_pack_digest: '',
  primary_artifact_sha256: pageDigest,
  issued_at: '2026-10-07T00:00:00+00:00',
  expires_at: '2027-01-01T00:00:00+00:00',
  nonce: 'margin-v2-final-supported-20261007',
};
manifest.evidence_pack_digest = sha(canonicalJson(manifest.evidence_pack));
await writeFile(resolve(root, 'v2-final-supported.html'), body);
await mkdir(resolve(root, '.well-known/margin/claims'), { recursive: true });
await writeFile(resolve(root, `.well-known/margin/claims/${claimKey}.json`), `${JSON.stringify(manifest)}\n`);
console.log(JSON.stringify({ url, pageKey, pageDigest, claimKey, manifestPath: `.well-known/margin/claims/${claimKey}.json` }, null, 2));
