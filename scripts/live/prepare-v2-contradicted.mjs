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
const url = 'https://a-murex-one.vercel.app/v2-contradicted.html';
// Keep the primary artifact byte-identical to the render-matched fixture. This
// isolates the contradictory evidence to the separately committed evidence
// item instead of introducing another unmeasured rendered-page digest.
const body = '<!doctype html>\n<html><head><meta charset="utf-8"><title>MARGIN V2 Final Supported Covered Claim</title></head><body><main><h1>MARGIN V2 Final Supported Covered Claim</h1><p>Final V2 Covered Claim fixture: The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value. This page is frozen for the final V2 support evidence.</p></main></body></html>\n';
const evidenceBody = 'Authoritative contradiction fixture: the committed Covered Claim policy requires publisher collateral and a value-coupled challenge bond; it does not permit a Covered Claim to protect value without economic collateral.\n';
const quote = 'The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value.';
const prefix = 'Final V2 Covered Claim fixture: ';
const suffix = ' This page is frozen for the final V2 support evidence.';
const challenge = 'Determine whether the committed policy evidence contradicts the highlighted Covered Claim proposition.';
const evidenceUrl = 'https://a-murex-one.vercel.app/v2-contradicted-evidence.txt';
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
    evidence_id: 'v2-evidence-contradicted',
    authority_profile: 'DOMAIN_CONTROLLED',
    url: evidenceUrl,
    expected_sha256: evidenceDigest,
    citation_exact: 'the committed Covered Claim policy requires publisher collateral and a value-coupled challenge bond',
    relation: 'CONTRADICTS',
    authority_metadata: { bounded_bytes: 40000 },
  }],
  evidence_pack_digest: '',
  // This is the accepted rendered digest for the byte-identical primary
  // fixture, observed in V2-render-supported.json.
  primary_artifact_sha256: 'd9354b91e378705702b10c727b4d315f9c695e803e5ba5da436d4aa8d3532e87',
  issued_at: '2026-10-07T00:00:00+00:00',
  expires_at: '2027-01-01T00:00:00+00:00',
  nonce: 'margin-v2-contradicted-20261007',
};
manifest.evidence_pack_digest = sha(canonicalJson(manifest.evidence_pack));
await mkdir(resolve(root, '.well-known/margin/claims'), { recursive: true });
await writeFile(resolve(root, 'v2-contradicted.html'), body);
await writeFile(resolve(root, 'v2-contradicted-evidence.txt'), evidenceBody);
await writeFile(resolve(root, `.well-known/margin/claims/${claimKey}.json`), `${JSON.stringify(manifest)}\n`);
console.log(JSON.stringify({ url, pageKey, pageDigest, evidenceDigest, claimKey, primaryArtifactSha256: manifest.primary_artifact_sha256 }, null, 2));
