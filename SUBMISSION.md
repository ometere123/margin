# MARGIN current submission record

## V3 integration surface

The V2 deployment below remains the comparison and consensus boundary. The
incremental MARGIN Connect work adds a typed SDK, a fail-closed Node 24
release-gate Action, a separately deployable non-custodial `MarginPolicyGate`
reference and a read-only signer `/integrations` workspace. These components
consume finalized V2 state; they do not modify or redeploy the V2 contracts or
replace the canonical Covered consumer. The official SDK is publicly available
as [`@margin-connect/sdk@0.1.0`](https://www.npmjs.com/package/@margin-connect/sdk).
It was published by `converts` from source commit
`facbdf6f61c9f7868e027faa41ca821fe50a63c2` and independently verified from the
public registry. The previous `@converts/margin-connect@0.1.0` release is
retained only as historical migration evidence.
No independent third-party adoption is claimed without independently verified
public evidence.

This file describes only the current canonical deployment. Historical deployment and transaction records are in [`docs/HISTORY.md`](docs/HISTORY.md).

## SDK namespace migration

- Target package: [`@margin-connect/sdk@0.1.0`](https://www.npmjs.com/package/@margin-connect/sdk)
- npm account and organisation: `converts`, owner of `margin-connect`
- Required publish command: `npm publish --workspace=@margin-connect/sdk --access public --registry=https://registry.npmjs.org/`
- Publication status: public and verified on 2026-10-19
- Published source commit: `facbdf6f61c9f7868e027faa41ca821fe50a63c2`
- Registry tarball: `https://registry.npmjs.org/@margin-connect/sdk/-/sdk-0.1.0.tgz`
- Registry SHA-1: `045aedfe842f9481a67d5a614513ceaefd25e526`
- Registry integrity: `sha512-89mvRcyI4yWlQ11cf1IzZxOXQ6ifUgMJVFPgdmqZDMAvaGpphZIjD1moqq4geWsLURRbcjeog1I+aXfjh2Q/Cw==`
- Registry file count: `8`
- Independent clean-project verification: `npm install @margin-connect/sdk@0.1.0 --registry=https://registry.npmjs.org/`; ESM and CommonJS imports passed; `npm audit --omit=dev` reported `0` vulnerabilities.
- Historical package: [`@converts/margin-connect@0.1.0`](https://www.npmjs.com/package/@converts/margin-connect), previously published from `a275be880c508a54c0796b709a0cbf6e5b123fdb`; it remains published and untouched pending separate owner confirmation.
- V2-to-V3 comparison: [`9d33116f...facbdf6`](https://github.com/ometere123/margin/compare/9d33116f24d5f62b9ca562229ed573fbdb133c31...facbdf6f61c9f7868e027faa41ca821fe50a63c2)

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
- Production deployment: GitHub-triggered Vercel deployment [`dpl_6iwqfSVyQCwAaZY3GkpsqyMQiUTw`](https://vercel.com/delealufejoel-4184s-projects/margin-signer/dpl_6iwqfSVyQCwAaZY3GkpsqyMQiUTw) is `READY / production / PROMOTED` for commit `84a725dbe3cc89293a60df13809ffa9376080c25`; the public bundle verification is recorded in `deployment.json`. No direct Vercel CLI deployment was used.
- Extension archive: `MARGIN-extension-v0.1.0.zip`
- Extension SHA-256: `59230A8330579C5D2126CD31DEC72F51C0A4BE42B985817C8FE038A1DB95B7E4`
- Live fixture project: `a` (`prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz`)
- Live fixture production deployment: `dpl_4wUiXh9LEKoAkP4Qih5pLBA3oi7F` (`READY / production / PROMOTED`), GitHub commit `3c2323670628ba1d8cc72ffecd1c5c2128295f72`
- Live fixture URL: https://a-murex-one.vercel.app/

The signer uses the injected EIP-1193 wallet. The signer project is connected to `ometere123/margin` on `main` with repository-root deployment settings; its verified production release is GitHub-triggered and recorded above. A read-only browser visit to the final supported Covered claim route showed `SUPPORTED`, `FINALIZED`, Studionet `61999`, the connected wallet surface and canonical provenance. The primary human production browser flow is retained as its recorded normal-claim evidence; a separate manual Covered UI walkthrough is optional and not claimed.

## Historical production browser proof (not re-attributed to the closeout bundle)

- Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
- Claim: `Negative index counts back from the end of the array — if index < 0, index + array.length is accessed.`
- Challenge: `Verify whether Array.prototype.at() handles a negative index by adding it to the array length, rather than treating it as an ordinary string property.`
- Evidence: https://tc39.es/ecma262/2026/multipage/indexed-collections.html#sec-array.prototype.at
- Class: `TECHNICAL`
- Result: human-observed `FINALIZED / Accepted / SUCCESS` submission and resolution on Studionet 61999; canonical verdict `SUPPORTED`; exact re-anchor, highlight, visible `M · SUPPORTED` badge and finalized provenance were observed. The transaction hashes and a deployment identity binding were not committed, so this is retained as historical browser evidence and is not attributed to the final signer release.
- Submission/resolution transaction hashes: not present in the repository evidence; intentionally not invented.

## Verification

- Contract lint: `3/3` for each contract
- Python invariants: `12/12`
- Direct Mode: `66/66` in the current local verification (`59/59` V2 regression cases plus `7/7` PolicyGate cases)
- Extension tests: `17/17`
- Signer tests: `43/43`
- Security mutations: `15/15` killed
- SDK tests: `7/7`; Action tests: `5/5`; ESM/CJS consumer imports passed
- Extension and signer builds: passed
- Main CI before publication: [`39270741687`](https://github.com/ometere123/margin/actions/runs/39270741687) green on `facbdf6f61c9f7868e027faa41ca821fe50a63c2`
- MARGIN source commit `6798b2e748d7ef6f1e41538de4e33f84d9c7ae68` matches the deployed source SHA-256 above; the Consumer source at the same commit matches its deployed digest and constructor binding.

## Fresh final-MARGIN normal evidence

- Claim: `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`
- Submit: `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`
- Resolve: `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`
- Both: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Canonical verdict: `SUPPORTED`

## Live evidence boundary

The material-observation V2 contract and bound consumer above are current. Prior V2 checkpoints remain historical. The primary human production normal browser flow passed. The two fresh final-deployment checkpoints below use stable GenVM-rendered primary digests and completed their real appeal-window settlements with definitive outcomes: one `SUPPORTED` release executed and one `CONTRADICTED` release refunded; both ended with zero MARGIN/consumer exposure and zero post-withdrawal credits. An optional manual Covered UI walkthrough is not claimed.

Historical final-deployment economic lifecycle: [`scripts/live/evidence/final-v2-economic-contradicted.json`](scripts/live/evidence/final-v2-economic-contradicted.json). The two earlier final-deployment checkpoints [`scripts/live/evidence/final-v3-supported-20261017.json`](scripts/live/evidence/final-v3-supported-20261017.json) and [`scripts/live/evidence/final-v3-contradicted-fixed-20261017.json`](scripts/live/evidence/final-v3-contradicted-fixed-20261017.json) remain genuine `SETTLED / INCONCLUSIVE` fail-closed evidence. The definitive final-deployment checkpoints are [`scripts/live/evidence/final-stable-supported-20261017-retry.json`](scripts/live/evidence/final-stable-supported-20261017-retry.json) and [`scripts/live/evidence/final-stable-contradicted-20261017.json`](scripts/live/evidence/final-stable-contradicted-20261017.json), with concise summaries in the adjacent Markdown files.

## Live sequence labels

- **A — Normal-resolve-first Assured lifecycle:** submit, normal resolve, register, challenge, assured resolve, wait the appeal window, settle, withdraw.
- **B — Protected release:** create the release before settlement, settle `SUPPORTED`, execute, beneficiary withdraw.
- **C — Cancellation:** register, wait the 24-hour challenge window, cancel, withdraw.

## Primary human browser proof (historical record)

- Status: `PASS`
- Run by: human operator
- Claim: `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33`
- Source: https://www.sqlite.org/serverless.html
- Observed: capture, signer handoff, Studionet 61999 connection, finalized submission, finalized resolution, `SUPPORTED`, exact re-anchor, highlight, visible `M · SUPPORTED` badge, refresh persistence, extension provenance/details, full provenance route, direct claim route and assurance route.
- The SQLite claim was a normal claim only; no Assured lifecycle was executed for it. Its deployment identity is not independently bound by committed transaction hashes, so it is not used as proof of the final signer release.

### MANUAL BROWSER STATUS

`PRIMARY HUMAN BROWSER FLOW: PASS`
