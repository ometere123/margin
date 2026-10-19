# @converts/margin-connect

`@converts/margin-connect` is a fail-closed integration SDK for applications that need
to consume a finalized MARGIN V2 Covered Claim. It reads the existing MARGIN
deployment directly with `genlayer-js@1.1.8` and uses `LATEST_FINAL` for every
authorization read.

The SDK returns only four decisions:

- `APPROVED` — a Covered Claim is settled `SUPPORTED`, the exact publisher,
  canonical URL and evidence commitments match, coverage is healthy, and the
  configured source/release artifact binding matches.
- `DENIED` — a claim is ordinary, missing, contradictory, stale, mismatched or
  otherwise not eligible.
- `PENDING` — the claim exists but the Assured lifecycle is not settled.
- `UNAVAILABLE` — a final read, identity check or required field was missing or
  malformed. Unavailable is never converted into approval.

## Install

The public package is [`@converts/margin-connect@0.1.0`](https://www.npmjs.com/package/@converts/margin-connect),
published by the authenticated `converts` account from main commit
`a275be880c508a54c0796b709a0cbf6e5b123fdb`. The original `@margin`
organization is not accessible to that account. Install the registry release
with:

```bash
npm install @converts/margin-connect genlayer-js@1.1.8
```

## Example

```ts
import { createMarginConnect } from '@converts/margin-connect';

const connect = createMarginConnect({
  marginAddress: '0x38a12Db824979A1E051792Cd322211FdB24473f3',
  consumerAddress: '0xD067556b32Ef7D9975d524B942344E4098724541',
  policyCommitment: {
    policyId: 'example-release-policy-v1',
    claimKey: '<64-hex-claim-key>',
    canonicalUrl: 'https://example.com/claim.html',
    publisher: '0x0000000000000000000000000000000000000001',
    manifestDigest: '<64-hex-manifest-digest>',
    evidencePackDigest: '<64-hex-evidence-pack-digest>',
    primaryArtifactSha256: '<64-hex-rendered-artifact-digest>',
    repository: 'owner/repository',
    commitSha: '<40-hex-commit-sha>',
    releaseArtifactSha256: '<64-hex-release-artifact-digest>',
    policyHash: '<hash of the fields above except policyHash>',
  },
});

const decision = await connect.evaluatePolicy({
  repository: 'owner/repository',
  commitSha: process.env.GITHUB_SHA!,
  releaseArtifactSha256: '<sha256 of the exact release artifact>',
});

if (decision.state !== 'APPROVED') throw new Error(decision.reason);
```

The SDK does not submit transactions and does not act as an oracle. The
existing MARGIN validators and final contract state remain authoritative.
