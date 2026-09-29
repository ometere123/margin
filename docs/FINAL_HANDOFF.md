# MARGIN final handoff status

## Current live status (2026-09-29)

The corrected Studionet deployment and fresh non-browser live sequences are complete where their real deadlines elapsed. Use [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md) as the authoritative live record. Browser evidence from an earlier deployment is retained as historical evidence; a fresh browser-wallet run against the current deployment remains manual work.

The frontend workspace routes are `/`, `/challenge?draft=...`, `/claim/<claimKey>`, `/claim/<claimKey>/assurance`, and `/activity`. The signer remains static and wallet-backed; the extension remains the primary discovery and annotation surface. The supplied logo/favicon/icon assets are included in the signer and MV3 extension. The MARGIN contract was not changed; the bound consumer was redeployed for the capped protected-release index.

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0x0f8D86d56F1b8997475dD048579807fBFe60e227`.
- Bound consumer: `0x6Bdb12646e054C24b68012560F7472636b395881`, deployed in a separate consumer-only correction and bound to the contract above.
- Deployment: `0x1f54fb2b8520008a8bf856906a695dd35f6835e28afdedf51bded400744abebd`, `FINALIZED / MAJORITY_AGREE / SUCCESS`.
- Deployment source commit: `826206bb1825cbcd716e0eb24288e91b8bc6d00a`.
- Deployment source: 58,790 bytes; SHA-256 `6F5866BCEE5569C3BA0560E172F3FF524CF43F2A7A174189DB05CC03BD9FDEAF`.
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`.
- A corrected-contract browser-aligned claim is recorded in `deployment.json`; fresh browser rendering against the current deployment is not claimed here. See [`docs/MANUAL_BROWSER_VERIFICATION.md`](MANUAL_BROWSER_VERIFICATION.md) for the exact manual proof steps.
- Fresh non-browser final-deployment normal evidence: claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`, submit `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`, resolve `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`, both `FINALIZED / MAJORITY_AGREE / SUCCESS`, canonical verdict `SUPPORTED`.

The earlier environment-bound checklist below is historical context. It is not permission to overwrite the final deployment record or claim that browser-wallet verification occurred when it has not.

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

- Direct Mode: 41/41 PASS, including adversarial domain-proof rejection cases, timeout-race cases, per-creator release-cap enforcement, pagination, bond-conservation assertions and real MARGIN/consumer integration coverage.
- Contract AST lint: 3/3 PASS for both contracts with `genvm-lint 0.11.1rc2`; SDK semantic validation is not claimed because the compatible v0.2.12 runner bundle is unavailable to the installed linter.
- Python/source invariant suite: 12/12 PASS.
- `npm exec -- genlayer --version`: `0.39.1`.
- Studionet network info and deployed `network()` readback: `61999`, `studionet`, `https://studio.genlayer.com/api`.
- Extension/signer typecheck, tests and builds: PASS on the current source; contract lint is AST-only (`3/3` per contract; full SDK semantic validation was not run), extension tests `16/16`, signer tests `30/30`, source invariants `12/12`, Direct Mode `41/41`.
- Reproducible extension archive: `MARGIN-extension-v0.1.0.zip`, SHA-256 `109C2CA42B85DEE0AC1AAAD7DE6F3996DE4B00D56DD334C00C7440BACC4EF3AB`, produced by `npm run zip` from `extension/dist`; the ZIP is not committed as generated noise.
- GitHub Actions was green for source commit `d7cc0727bdced6ba85400fb7c60703cb49c59e34` in [run `36637688185`](https://github.com/ometere123/margin/actions/runs/36637688185).

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Remaining verification boundary

The current live evidence boundary is:

- MARGIN deployment: `0x0f8D86d56F1b8997475dD048579807fBFe60e227`, finalized at `0x1f54fb2b8520008a8bf856906a695dd35f6835e28afdedf51bded400744abebd`.
- Consumer deployment: `0x6Bdb12646e054C24b68012560F7472636b395881`, finalized at `0x10f861aa287fe9ce0b4dbbacd95fc51cacb14539516d62f9bd6331495609ff0d`, with its constructor bound to the current MARGIN address. Source commit `66b2e2a492bc343df6369c8f6b4779fcb79a128c`, SHA-256 `FBCF9882250D640008B778F0486BDA3FCC892886270704ACB26DFADD2B7FF465`, 12,869 bytes. The previous consumer deployment is historical only.
- Fresh final-deployment normal claim evidence: submit → resolve → `FINALIZED / MAJORITY_AGREE / SUCCESS`, with canonical verdict `SUPPORTED`, as recorded above.
- Fresh final-deployment Assured evidence is recorded in `scripts/live/evidence/A.json` and `B.json`: A is `SETTLED + INCONCLUSIVE` with both credits withdrawn; B is `SETTLED + SUPPORTED` with a protected release created before settlement, executed and withdrawn. C is a truthful `REGISTERED` pending cancellation sequence with earliest cancellation at `2026-09-30T21:01:11.318Z`; no cancellation is claimed before that time. Historical transactions and verdicts are referenced only through [`docs/HISTORY.md`](HISTORY.md).
- Browser verification remains manual; automated browser evidence is not claimed.

## Production configuration hardening

The canonical static signer is `https://margin-signer.vercel.app/`. Its Vite production build receives the public `VITE_MARGIN_CONTRACT_ADDRESS` value for the canonical Studionet deployment. The signer no longer asks normal users to save a contract address and ignores incoming contract query parameters. The extension release similarly embeds the canonical contract and signer origin; Options is informational rather than an infrastructure editor. The current production deployment is `dpl_AskgUH19RUAjoQB8dehD4onbwzoM`; real wallet/browser proof remains manual for this final deployment.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks accepted consensus plus the canonical leader execution result, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors. Minority validator errors are not treated as canonical transaction failure.

No success evidence for those steps has been fabricated.

## Final state note

The contracts are already deployed on Studionet 61999, the production signer is already deployed, and the extension is already built. Fresh Assured evidence A and B is recorded under `scripts/live/evidence/`; C remains pending until its derived 24-hour cancellation time. The remaining human task is to run [`docs/MANUAL_BROWSER_VERIFICATION.md`](MANUAL_BROWSER_VERIFICATION.md).

## Architecture that must not be weakened

- No central MARGIN backend deciding claim status.
- No server-side browsing-history collection.
- No generic “truth score”.
- No politics, medical claims or personal allegations in v0.1 scope.
- No use of the local page digest as proof of historical public content.
- No validator that merely checks the leader output schema.
- No annotations from accepted/pending state when finalized state is required.
- No arbitrary claim/page keys supplied by the client without on-chain payload binding.
