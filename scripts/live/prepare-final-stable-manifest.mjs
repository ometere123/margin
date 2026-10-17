import crypto from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

const scenario = process.env.MARGIN_STABLE_SCENARIO;
const renderedPrimaryDigest = String(process.env.MARGIN_RENDERED_PRIMARY_SHA256 || '').trim().toLowerCase();
if (!['supported', 'contradicted'].includes(scenario)) throw new Error('MARGIN_STABLE_SCENARIO must be supported or contradicted');
if (!/^[0-9a-f]{64}$/.test(renderedPrimaryDigest)) throw new Error('MARGIN_RENDERED_PRIMARY_SHA256 must be the independently observed GenVM render digest');

const root = resolve('scripts/live/hosted/a');
const supported = scenario === 'supported';
const url = supported
  ? 'https://a-murex-one.vercel.app/v2-final-supported-20261017.html'
  : 'https://a-murex-one.vercel.app/v2-final-contradicted-fixed-20261017.html';
const evidenceUrl = supported
  ? 'https://a-murex-one.vercel.app/v2-final-supported-20261017-evidence.txt'
  : 'https://a-murex-one.vercel.app/v2-final-contradicted-fixed-20261017-evidence.txt';
const localPagePath = supported ? 'v2-final-supported-20261017.html' : 'v2-final-contradicted-fixed-20261017.html';
const localEvidencePath = supported ? 'v2-final-supported-20261017-evidence.txt' : 'v2-final-contradicted-fixed-20261017-evidence.txt';
const quote = supported
  ? 'The canonical consumer checks active release exposure before admitting additional Covered Claim principal.'
  : 'MARGIN publisher collateral pays release losses to release creators and beneficiaries.';
const prefix = supported ? 'Final supported Covered fixture: ' : 'Final contradicted fixed fixture: ';
const suffix = supported
  ? ' This statement is published as a fresh final-deployment evidence fixture.'
  : ' This intentionally false statement is challenged by the committed policy evidence.';
const challenge = supported
  ? 'Confirm that the unchanged supported final fixture is backed by its evidence artifact in the definitive Covered Claim run.'
  : 'Confirm whether the unchanged contradicted final fixture is disproved by its evidence artifact in the definitive Covered Claim run.';
const evidenceBody = await readFile(resolve(root, localEvidencePath), 'utf8');
const pageBody = await readFile(resolve(root, localPagePath), 'utf8');
const rawPageDigest = sha(pageBody);
const rawEvidenceDigest = sha(evidenceBody);
const publicPage = await fetch(url, { redirect: 'error' });
const publicEvidence = await fetch(evidenceUrl, { redirect: 'error' });
if (!publicPage.ok || !publicEvidence.ok) throw new Error(`Fixture fetch failed: page=${publicPage.status} evidence=${publicEvidence.status}`);
const publicPageBody = await publicPage.text();
const publicEvidenceBody = await publicEvidence.text();
if (sha(publicPageBody) !== rawPageDigest || publicPageBody !== pageBody) throw new Error('Public primary fixture bytes differ from the committed immutable fixture');
if (sha(publicEvidenceBody) !== rawEvidenceDigest || publicEvidenceBody !== evidenceBody) throw new Error('Public evidence bytes differ from the committed immutable fixture');
const citation = supported
  ? 'The canonical consumer checks active release exposure before admitting additional Covered Claim principal.'
  : 'Publisher collateral is a dispute stake and is not paid to release creators or beneficiaries.';
if (!publicEvidenceBody.includes(citation)) throw new Error('Required exact evidence citation is absent');
const pageKey = sha(url);
const payload = {
  archiveUrl: '', canonicalUrl: url, challengeStatement: challenge, claimClass: 'TECHNICAL', exact: quote,
  evidenceUrls: [evidenceUrl], pageDigest: rawPageDigest, pageKey, prefix, suffix, v: 1,
};
const claimKey = sha(canonicalJson(payload));
const evidencePack = [{
  authority_metadata: { bounded_bytes: 40000 },
  authority_profile: 'DOMAIN_CONTROLLED',
  citation_exact: citation,
  evidence_id: supported ? 'final-stable-supported-20261017' : 'final-stable-contradicted-20261017',
  expected_sha256: rawEvidenceDigest,
  relation: supported ? 'SUPPORTS' : 'CONTRADICTS',
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
  primary_artifact_sha256: renderedPrimaryDigest,
  issued_at: '2026-10-17T00:00:00+00:00',
  expires_at: '2027-10-17T00:00:00+00:00',
  nonce: supported ? 'margin-final-stable-supported-20261017' : 'margin-final-stable-contradicted-20261017',
};
await mkdir(resolve(root, '.well-known/margin/claims'), { recursive: true });
const manifestPath = resolve(root, `.well-known/margin/claims/${claimKey}.json`);
await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
console.log(JSON.stringify({ scenario, claimKey, pageKey, url, evidenceUrl, rawPageDigest, renderedPrimaryDigest, rawEvidenceDigest, citation, manifestPath: `.well-known/margin/claims/${claimKey}.json` }, null, 2));
