# MARGIN current submission record

This file describes only the current canonical deployment. Historical deployment and transaction records are in [`docs/HISTORY.md`](docs/HISTORY.md).

## Network

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Repository-local CLI: `0.39.1`

## Current deployments

- MARGIN: [`0x38a12Db824979A1E051792Cd322211FdB24473f3`](https://explorer-studio.genlayer.com/address/0x38a12Db824979A1E051792Cd322211FdB24473f3)
- MARGIN deployment: [`0x6b7c5bd6ec5a458ce668e9908ac0c9111ec8dbbf90fdda8f281992ecc707f9e9`](https://explorer-studio.genlayer.com/tx/0x6b7c5bd6ec5a458ce668e9908ac0c9111ec8dbbf90fdda8f281992ecc707f9e9)
- MARGIN source commit: `6798b2e748d7ef6f1e41538de4e33f84d9c7ae68`
- MARGIN source SHA-256: `3A23F33952A35E3C848694887BB1C8D8DB03D3E1AEB10999F8A1518A9870BA12`
- MARGIN deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Consumer: [`0xD067556b32Ef7D9975d524B942344E4098724541`](https://explorer-studio.genlayer.com/address/0xD067556b32Ef7D9975d524B942344E4098724541)
- Consumer deployment: [`0xbdc8d87ef3185dab1dfdd1103f1ba2a14dda4c1c2d47284eb737dd39f2692fa8`](https://explorer-studio.genlayer.com/tx/0xbdc8d87ef3185dab1dfdd1103f1ba2a14dda4c1c2d47284eb737dd39f2692fa8)
- Canonical consumer binding: [`0x3da7c5b731733ce69ac6dba9d4a3f91f074a465ddd3d6975aac80c9c4b14f77a`](https://explorer-studio.genlayer.com/tx/0x3da7c5b731733ce69ac6dba9d4a3f91f074a465ddd3d6975aac80c9c4b14f77a)
- Consumer source commit: `6798b2e748d7ef6f1e41538de4e33f84d9c7ae68`
- Consumer source SHA-256: `FBDC44E60CEAC4BFB0F63C8A6F4E78443382D6E6904BC33CE494AEC9C95DD9DA`
- Consumer source size: `16742` bytes
- Consumer constructor binding: final MARGIN address above
- Consumer deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`

## Production signer and release

- Signer: https://margin-signer.vercel.app/
- Production deployment: `dpl_9Avj9b5Mx7BwgtbBYsZhdVKazJmV` (`READY`), built from signer-only patch commit `e35e27ea2c76fcb5482d285b6b41b858813b684e` and verified at the production URL.
- Extension archive: `MARGIN-extension-v0.1.0.zip`
- Extension SHA-256: `59230A8330579C5D2126CD31DEC72F51C0A4BE42B985817C8FE038A1DB95B7E4`
- Live fixture project: `a` (`prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz`)
- Live fixture production deployment: `dpl_4kHV5KpGXPKb3Pa3hX6xfjPct1um`
- Live fixture URL: https://a-murex-one.vercel.app/

The signer uses the injected EIP-1193 wallet. Its production project environment is configured for the current MARGIN and consumer, but the public deployment listed above is historical and still targets the superseded deployment; no direct signer redeployment is claimed in this pass. The primary human production browser flow against the prior final deployment passed; a fresh Covered UI walkthrough against the corrected deployment is not claimed.

## Final production browser proof

- Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
- Claim: `Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.`
- Challenge: `Verify whether Array.prototype.at() handles a negative index by adding it to the array length, rather than treating it as an ordinary string property.`
- Evidence: https://tc39.es/ecma262/2026/multipage/indexed-collections.html#sec-array.prototype.at
- Class: `TECHNICAL`
- Result: human-observed `FINALIZED / Accepted / SUCCESS` submission and resolution on Studionet 61999; canonical verdict `SUPPORTED`; exact re-anchor, highlight, visible `M · SUPPORTED` badge and finalized provenance were confirmed against the final MARGIN deployment.
- Submission/resolution transaction hashes: not present in the repository evidence; intentionally not invented.

## Verification

- Contract lint: `3/3` for each contract
- Python invariants: `12/12`
- Direct Mode: `59/59` in the current local verification after the material-observation, citation, canonical-exposure and withdrawal tests
- Extension tests: `17/17`
- Signer tests: `40/40`
- Extension and signer builds: passed
- MARGIN source commit `6798b2e748d7ef6f1e41538de4e33f84d9c7ae68` matches the deployed source SHA-256 above; the Consumer source at the same commit matches its deployed digest and constructor binding.

## Fresh final-MARGIN normal evidence

- Claim: `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`
- Submit: `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`
- Resolve: `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`
- Both: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Canonical verdict: `SUPPORTED`

## Live evidence boundary

The material-observation V2 contract and bound consumer above are current. Prior V2 checkpoints are historical. The primary human production browser flow passed. The fresh final-deployment checkpoints below completed their real appeal-window settlements and authoritative post-settlement readbacks: both settled `INCONCLUSIVE`, refunded the protected release, and ended with zero MARGIN/consumer exposure and zero recorded credits. An optional manual Covered UI walkthrough is not claimed.

Historical final-deployment economic lifecycle: [`scripts/live/evidence/final-v2-economic-contradicted.json`](scripts/live/evidence/final-v2-economic-contradicted.json). New final-deployment checkpoints are [`scripts/live/evidence/final-v3-supported-20261017.json`](scripts/live/evidence/final-v3-supported-20261017.json) and [`scripts/live/evidence/final-v3-contradicted-fixed-20261017.json`](scripts/live/evidence/final-v3-contradicted-fixed-20261017.json); both completed post-deadline readbacks as `SETTLED / INCONCLUSIVE` with `REFUNDED` releases and zero final exposure.

## Live sequence labels

- **A — Normal-resolve-first Assured lifecycle:** submit, normal resolve, register, challenge, assured resolve, wait the appeal window, settle, withdraw.
- **B — Protected release:** create the release before settlement, settle `SUPPORTED`, execute, beneficiary withdraw.
- **C — Cancellation:** register, wait the 24-hour challenge window, cancel, withdraw.

## Primary human browser proof

- Status: `PASS`
- Run by: human operator
- Claim: `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33`
- Source: https://www.sqlite.org/serverless.html
- Observed: capture, signer handoff, Studionet 61999 connection, finalized submission, finalized resolution, `SUPPORTED`, exact re-anchor, highlight, visible `M · SUPPORTED` badge, refresh persistence, extension provenance/details, full provenance route, direct claim route and assurance route.
- The SQLite claim was a normal claim only; no Assured lifecycle was executed for it.

### MANUAL BROWSER STATUS

`PRIMARY HUMAN BROWSER FLOW: PASS`
