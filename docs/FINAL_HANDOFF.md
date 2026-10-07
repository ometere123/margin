# MARGIN final handoff status

## Current live status (2026-09-29)

The V2 Studionet deployments are finalized and recorded in [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md). A fresh V2 Covered lifecycle is recorded in `scripts/live/evidence/V2-covered.json`: it settled `INCONCLUSIVE` after a real appeal wait, refunded the pre-settlement release, and withdrew all credits. No positive V2 `SUPPORTED` release execution is claimed. Prior A/B/C lifecycle records remain historical. The primary browser flow in the earlier handoff is not claimed as V2 proof.

Protected runtime/protocol implementation is unchanged from the known-good baseline `23062e40b16d74f5fb72c56a72cdfaa0eaef9587`; the current candidate adds only tests and documentation.

The frontend workspace routes are `/`, `/challenge?draft=...`, `/claim/<claimKey>`, `/claim/<claimKey>/assurance`, and `/activity`. The signer remains static and wallet-backed; the extension remains the primary discovery and annotation surface. The supplied logo/favicon/icon assets are included in the signer and MV3 extension. The MARGIN contract was not changed; the bound consumer was redeployed for the capped protected-release index.

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0x03197B3246a5BF0C28fad07c4E5868F52c601580`.
- Bound consumer: `0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`, bound to the V2 contract above.
- Deployment: `0x84a4b0a159205e4ba2be9c913a9d3698cb43d5bbcfe66502f24093b50fc67250`, `FINALIZED / MAJORITY_AGREE / SUCCESS`.
- Deployment source commit: `54605dae812afca03a0f9b2dacaf91e23ccdac95`.
- Deployment source: 80,340 bytes; SHA-256 `F880EA25C950135FE51BBABFD9DF84C408B490216D9B4A8263638660EC6D7B01`.
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`.
- Human browser proof against the current deployment: normal claim `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33` from https://www.sqlite.org/serverless.html reached finalized `SUPPORTED`, re-anchored the exact quote, rendered the highlight and visible `M · SUPPORTED` badge, and exposed extension/full provenance routes. This was not an Assured Claim lifecycle.
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

- Direct Mode: 51/51 PASS, including Covered Claim collateral/exposure cases, adversarial domain-proof rejection cases, timeout-race cases, per-creator release-cap enforcement, pagination, bond-conservation assertions, real MARGIN/consumer integration coverage and explicit consensus trust-boundary tamper cases.
- Contract AST lint: 3/3 PASS for both contracts with `genvm-lint 0.11.1rc2`; SDK semantic validation is not claimed because the compatible v0.2.12 runner bundle is unavailable to the installed linter.
- Python/source invariant suite: 12/12 PASS.
- `npm exec -- genlayer --version`: `0.39.1`.
- Studionet network info and deployed `network()` readback: `61999`, `studionet`, `https://studio.genlayer.com/api`.
- Extension/signer typecheck, tests and builds: PASS on the current source; contract lint is AST-only (`3/3` per contract; full SDK semantic validation was not run), extension tests `17/17`, signer tests `31/31`, source invariants `12/12`, Direct Mode `51/51`. The deterministic browser harness is separate from manual real-wallet verification.
- Reproducible extension archive: `MARGIN-extension-v0.1.0.zip`, SHA-256 `A1121399097C9F5D425C41BDE718453D587BEE9F15A459A97DA14DF508625803`, produced by `npm run zip` from `extension/dist`; the ZIP is not committed as generated noise.
- GitHub Actions status must be read from the workflow run attached to the exact candidate commit; the prior run reference is historical and is not current verification for this hardening pass.

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Remaining verification boundary

The current live evidence boundary is:

- MARGIN V2 deployment: `0x03197B3246a5BF0C28fad07c4E5868F52c601580`, finalized at `0x84a4b0a159205e4ba2be9c913a9d3698cb43d5bbcfe66502f24093b50fc67250`.
- Consumer V2 deployment: `0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`, finalized at `0xebc599b8d667f6fc39787057cf261273f24a566a60f62d194e5c0821365a3ba3`, with constructor binding read back as the V2 MARGIN address. Source commit `54605dae812afca03a0f9b2dacaf91e23ccdac95`, SHA-256 `4060BFABA93A8B6BF90F6CDA6466D2066A7F1E1ED91036C1DB275047201DF6EC`, 15,416 bytes.
- Fresh final-deployment normal claim evidence: submit → resolve → `FINALIZED / MAJORITY_AGREE / SUCCESS`, with canonical verdict `SUPPORTED`, as recorded above.
- No fresh V2 Assured evidence is recorded yet. The A/B/C files are historical V1 evidence and are not presented as V2 proof. Historical transactions and verdicts remain separated through [`docs/HISTORY.md`](HISTORY.md).
- Primary human browser flow: `PASS`. Optional/hostile browser matrix items are not claimed unless individually recorded.

## Production configuration hardening

The canonical static signer is `https://margin-signer.vercel.app/`. Its Vite production build receives the public V2 `VITE_MARGIN_CONTRACT_ADDRESS` and `VITE_MARGIN_CONSUMER_ADDRESS` values. The current production deployment is `dpl_99CS5PiZNHKfkwgqmzBNBVYmC3QL`; a fresh V2 real-wallet/browser proof remains manual and is not claimed here.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks accepted consensus plus the canonical leader execution result, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors. Minority validator errors are not treated as canonical transaction failure.

No success evidence for those steps has been fabricated.

## Final state note

The contracts are already deployed on Studionet 61999, the production signer is already deployed, and the extension is already built. Fresh Assured evidence A and B is recorded under `scripts/live/evidence/`; C remains pending until its derived 24-hour cancellation time. The primary human browser flow is complete; optional/hostile browser checks and the demo video remain separate, unclaimed items.

## Architecture that must not be weakened

- No central MARGIN backend deciding claim status.
- No server-side browsing-history collection.
- No generic “truth score”.
- No politics, medical claims or personal allegations in v0.1 scope.
- No use of the local page digest as proof of historical public content.
- No validator that merely checks the leader output schema.
- No annotations from accepted/pending state when finalized state is required.
- No arbitrary claim/page keys supplied by the client without on-chain payload binding.
