import crypto from 'node:crypto';

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const pageUrl = 'https://a-murex-one.vercel.app/v2-supported-positive.html';
const pageBody = `<!doctype html>
<html><head><meta charset="utf-8"><title>MARGIN V2 Supported Covered Claim</title></head><body><main><h1>MARGIN V2 Supported Covered Claim</h1><p>Positive Covered Claim fixture: The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value. This statement is published as a fresh V2 evidence fixture.</p></main></body></html>
`;
const quote = 'The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value.';
const prefix = 'Positive Covered Claim fixture: ';
const suffix = ' This statement is published as a fresh V2 evidence fixture.';
const payload = {
  archiveUrl: '', canonicalUrl: pageUrl,
  challengeStatement: 'Confirm that this fresh Covered Claim fixture is supported by the published evidence artifact.',
  claimClass: 'TECHNICAL', exact: quote,
  evidenceUrls: ['https://a-murex-one.vercel.app/v2-evidence.txt'],
  pageDigest: sha(pageBody), pageKey: sha(pageUrl), prefix, suffix, v: 1,
};
console.log(JSON.stringify({
  pageKey: payload.pageKey,
  pageDigest: payload.pageDigest,
  claimKey: sha(canonicalJson(payload)),
  claimDigest: sha(quote),
  anchorDigest: sha(`${prefix}|${quote}|${suffix}`),
  pageUrl,
  quote,
  prefix,
  suffix,
  challengeStatement: payload.challengeStatement,
}, null, 2));
