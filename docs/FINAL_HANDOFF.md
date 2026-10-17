# MARGIN final handoff status

## Current live status (2026-10-17)

The final material-observation V2 Studionet MARGIN and bound-consumer deployments are finalized and recorded in [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md). The earlier `final-v2-economic-contradicted.json` record is historical; the two earlier `final-v3-*` checkpoints remain genuine fail-closed `INCONCLUSIVE` evidence. The definitive final-deployment checkpoints use independently observed stable GenVM-render digests: one settled `SUPPORTED` and executed its release, while the other settled `CONTRADICTED` and refunded its release. Both ended with zero MARGIN/consumer exposure and zero post-withdrawal credits.

The final candidate includes the material-observation/citation contract hardening and corresponding tests; the prior V2 deployment is historical.

The frontend workspace routes are `/`, `/challenge?draft=...`, `/claim/<claimKey>`, `/claim/<claimKey>/assurance`, and `/activity`. The signer remains static and wallet-backed; the extension remains the primary discovery and annotation surface. The supplied logo/favicon/icon assets are included in the signer and MV3 extension. The MARGIN contract was corrected and redeployed for canonical consumer exposure; the bound consumer was redeployed against that new MARGIN address.

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0x38a12Db824979A1E051792Cd322211FdB24473f3`.
- Bound consumer: `0xD067556b32Ef7D9975d524B942344E4098724541`, bound to the V2 contract above.
- Deployment: `0x6b7c5bd6ec5a458ce668e9908ac0c9111ec8dbbf90fdda8f281992ecc707f9e9`, `FINALIZED / MAJORITY_AGREE / SUCCESS`.
- Deployment source commit: `6798b2e`.
- Deployment source: 91,516 bytes; SHA-256 `3A23F33952A35E3C848694887BB1C8D8DB03D3E1AEB10999F8A1518A9870BA12`.
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`.
- Historical human browser proof: normal claim `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33` from https://www.sqlite.org/serverless.html reached finalized `SUPPORTED`, re-anchored the exact quote, rendered the highlight and visible `M · SUPPORTED` badge, and exposed extension/full provenance routes. This was not an Assured Claim lifecycle and is not re-attributed to the final signer release without committed deployment-bound transaction IDs.
- Historical MDN browser proof: the Array.prototype.at claim was observed through the production signer with finalized `SUPPORTED`, exact re-anchoring, highlight, badge and provenance. Exact transaction hashes were not committed, so it is retained as historical evidence rather than proof of the corrected signer deployment.
- Fresh non-browser final-deployment normal evidence: claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`, submit `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`, resolve `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`, both `FINALIZED / MAJORITY_AGREE / SUCCESS`, canonical verdict `SUPPORTED`.

The earlier environment-bound checklist below is retained as manual verification context. It does not alter the final deployment record or current live evidence.

MARGIN has been pushed to the environment boundary available in this build session. Continue **in place**; do not re-scaffold it.

## What is already implemented

- Chromium Manifest V3 browser extension as the primary product surface.
- Text-selection capture with canonical URL, exact/prefix/suffix anchor and local page digest.
- Challenge composer for five bounded claim classes and up to three public evidence URLs plus an optional public archive URL.
- Canonical page key and claim key generation, with both keys recomputed and enforced by the Intelligent Contract.
- GenLayer Intelligent Contract with bounded page index, bounded revision history, consensus-bound source identities and status plus accepted-proposal observation provenance, domain-controlled Assured Claims, native GEN bonds, one appeal and deterministic settlement views.
- Independent validator re-execution of the evidence task; deterministic source identities and bounded semantic status are consensus-bound. Validators independently fetch and adjudicate. Exact accepted observation content digests, cited indexes and leader rationale are accepted-proposal provenance and may differ across validators.
- Bounded results: `SUPPORTED`, `CONTRADICTED`, `INCONCLUSIVE`, `STALE`.
- Read-only extension state uses finalized GenLayer reads rather than a MARGIN backend.
- Static wallet signer for injected EIP-1193 wallets, transaction fee estimation, writes and finalization.
- Webpage annotation rendering anchored back beside the challenged text.
- Prompt-injection treatment: fetched pages are explicitly untrusted evidence and cannot redefine adjudication instructions.
- Funded protected-release consumer in `contracts/margin_consumer.py` reads settled Assured Claim state directly and supports multiple independent releases per claim.
- Source-level and Direct Mode test suites, controlled public-fixture pages, architecture/threat/live-validation documentation.

## Fixed network invariant

MARGIN targets **GenLayer Studionet only**:

- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- preset: `studionet`
- explorer: `https://explorer-studio.genlayer.com`

Do not introduce a fallback to another GenLayer environment.

## Fixed CLI invariant

Studionet 61999 work in this repository must use **GenLayer CLI `0.39.1` locally**. The root `package.json` pins `genlayer: "0.39.1"` exactly and `.genlayer-cli-version` records the same invariant.

The user's machine may have a global `0.40.0rc2` CLI. **Ignore the global binary.** After dependency installation:

- run `npm run cli`;
- verify with `npm exec -- genlayer --version`;
- use `npm exec -- genlayer ...` (or `npm run genlayer -- ...`) for every GenLayer CLI command.

Do not run bare `genlayer ...` commands from this repo.

## Checks completed for the corrected candidate

- Direct Mode: 59/59 PASS, including Covered Claim collateral/exposure cases, citation-integrity cases, timeout-race cases, per-creator release-cap enforcement, pagination, bond-conservation assertions, real MARGIN/consumer integration coverage and explicit consensus trust-boundary tamper cases.
- Contract AST lint: 3/3 PASS for both contracts with pinned `genvm-linter==0.11.0`; both contracts also passed the pinned SDK semantic validation in the recorded CI run.
- Python/source invariant suite: 12/12 PASS.
- `npm exec -- genlayer --version`: `0.39.1`.
- Studionet network info and deployed `network()` readback: `61999`, `studionet`, `https://studio.genlayer.com/api`.
- Extension/signer typecheck, tests and builds: PASS on the current source; extension tests `17/17`, signer tests `42/42`, source invariants `12/12`, Direct Mode `59/59`, security mutations `15/15` killed. The deterministic browser harness is separate from manual real-wallet verification.
- Reproducible extension archive: `MARGIN-extension-v0.1.0.zip`, SHA-256 `59230A8330579C5D2126CD31DEC72F51C0A4BE42B985817C8FE038A1DB95B7E4`, produced by `npm run zip` from `extension/dist`; the ZIP is not committed as generated noise.
- GitHub Actions status must be read from the workflow run attached to the exact candidate commit; the prior run reference is historical and is not current verification for this hardening pass.

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Remaining verification boundary

The current live evidence boundary is:

- MARGIN V2 deployment: `0x38a12Db824979A1E051792Cd322211FdB24473f3`, finalized at `0x6b7c5bd6ec5a458ce668e9908ac0c9111ec8dbbf90fdda8f281992ecc707f9e9`.
- Consumer V2 deployment: `0xD067556b32Ef7D9975d524B942344E4098724541`, finalized at `0xbdc8d87ef3185dab1dfdd1103f1ba2a14dda4c1c2d47284eb737dd39f2692fa8`, bound through `0x3da7c5b731733ce69ac6dba9d4a3f91f074a465ddd3d6975aac80c9c4b14f77a`, with constructor binding read back as the final MARGIN address. Source commit `6798b2e`, SHA-256 `FBDC44E60CEAC4BFB0F63C8A6F4E78443382D6E6904BC33CE494AEC9C95DD9DA`, 16,742 bytes.
- Fresh final-deployment normal claim evidence: submit → resolve → `FINALIZED / MAJORITY_AGREE / SUCCESS`, with canonical verdict `SUPPORTED`, as recorded above.
- The superseded V2 evidence checkpoints and `scripts/live/evidence/final-v2-economic-contradicted.json` are historical. The `final-v3-supported-20261017.json` and `final-v3-contradicted-fixed-20261017.json` checkpoints are preserved as fail-closed `INCONCLUSIVE` evidence. Definitive current final-deployment checkpoints are `scripts/live/evidence/final-stable-supported-20261017-retry.json` and `scripts/live/evidence/final-stable-contradicted-20261017.json`, with adjacent Markdown summaries.
- Primary human browser flow: `PASS`.
- Fresh final Covered/Assured economic lifecycle: supported checkpoint `SETTLED / SUPPORTED` with `EXECUTED` release; contradicted checkpoint `SETTLED / CONTRADICTED` with `REFUNDED` release; both have zero final exposure and zero post-withdrawal credits.
- Optional manual Covered UI walkthrough: `NOT CLAIMED`.

## Production configuration hardening

The local static signer build and production Vercel project environment contain the corrected `VITE_MARGIN_CONTRACT_ADDRESS` and `VITE_MARGIN_CONSUMER_ADDRESS` values. The fixture deployment is `dpl_4wUiXh9LEKoAkP4Qih5pLBA3oi7F` and the signer deployment is `dpl_6iwqfSVyQCwAaZY3GkpsqyMQiUTw`; both were GitHub-triggered, and the signer is `READY / production / PROMOTED`. The public bundle includes both canonical addresses and excludes both superseded addresses. No direct Vercel CLI upload was used; both projects are locked again against automatic Git deployments after verification.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks accepted consensus plus the canonical leader execution result, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors. Minority validator errors are not treated as canonical transaction failure.

No success evidence for those steps has been fabricated.

## Final state note

The contracts are deployed on Studionet 61999 and the extension is built. The signer is available locally with `npm run dev -w signer` at `http://localhost:5174/`; the public signer release is verified separately from the scripted Covered evidence. The MDN browser proof was a normal claim only.

### OPTIONAL MANUAL UI WALKTHROUGH / NOT REQUIRED FOR COMPLETION

1. Run `npm run build` and load `extension/dist` as an unpacked MV3 extension.
2. Run `npm run dev -w signer` and open `http://localhost:5174/`.
3. Confirm the deployment card shows Studionet `61999`, MARGIN `0x38a12Db824979A1E051792Cd322211FdB24473f3` and consumer `0xD067556b32Ef7D9975d524B942344E4098724541`.
4. On a real public HTTPS page, select a narrow technical claim and choose **Challenge with MARGIN**.
5. Confirm `/challenge?draft=...` preserves the exact quote, prefix, suffix, evidence and claim key; connect an injected wallet and verify off-network writes are blocked.
6. Submit once, record the immediate transaction ID, wait for `FINALIZED` plus successful execution, resolve once, and wait for the separate resolution transaction to finalize.
7. Return to the source page, confirm exact re-anchoring, `M · SUPPORTED`/bounded verdict display, provenance, evidence and the assurance route.
8. For a Covered flow, use a publisher-controlled proof, verify the canonical required challenge/appeal bond values, create a protected release before settlement, and confirm the final release/withdrawal state from canonical reads.

Final status:

- `PRIMARY HUMAN BROWSER FLOW: PASS`
- `FRESH FINAL COVERED/ASSURED ECONOMIC LIFECYCLE: SUPPORTED EXECUTED + CONTRADICTED REFUNDED; EXPOSURE ZERO`
- `OPTIONAL MANUAL COVERED UI WALKTHROUGH: NOT CLAIMED`

## Architecture that must not be weakened

- No central MARGIN backend deciding claim status.
- No server-side browsing-history collection.
- No generic “truth score”.
- No politics, medical claims or personal allegations in v0.1 scope.
- No use of the local page digest as proof of historical public content.
- No validator that merely checks the leader output schema.
- No annotations from accepted/pending state when finalized state is required.
- No arbitrary claim/page keys supplied by the client without on-chain payload binding.
