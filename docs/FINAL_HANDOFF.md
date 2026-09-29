# MARGIN final handoff status

## Current live status (2026-09-29)

The corrected Studionet deployment and corrected-contract normal claim lifecycles are complete. Use [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md) as the authoritative live record. The optional Assured Claim path is recorded separately. Browser evidence from an earlier deployment is retained as historical evidence; a fresh browser-wallet run against the current deployment remains manual work.

The frontend workspace routes are `/`, `/challenge?draft=...`, `/claim/<claimKey>`, `/claim/<claimKey>/assurance`, and `/activity`. The signer remains static and wallet-backed; the extension remains the primary discovery and annotation surface. The supplied logo/favicon/icon assets are included in the signer and MV3 extension. No contract source or deployed contract was changed in this frontend round.

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0x0f8D86d56F1b8997475dD048579807fBFe60e227`.
- Bound consumer: `0x388c762f777A10071A13063d71ed0B37CdE2d85a`, deployed in a separate consumer-only correction and bound to the contract above.
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
- Independent validator re-execution of the evidence task; decision-bearing status, structured source indexes and source-manifest digest must match exactly.
- Bounded results: `SUPPORTED`, `CONTRADICTED`, `INCONCLUSIVE`, `STALE`.
- Read-only extension state uses finalized GenLayer reads rather than a MARGIN backend.
- Static wallet signer for injected EIP-1193 wallets, transaction fee estimation, writes and finalization.
- Webpage annotation rendering anchored back beside the challenged text.
- Prompt-injection treatment: fetched pages are explicitly untrusted evidence and cannot redefine adjudication instructions.
- Minimal downstream consumer in `contracts/margin_consumer.py` reads settled Assured Claim state directly.
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

- WSL Direct Mode: 29/29 PASS, including adversarial domain-proof rejection cases, timeout-race cases and the real MARGIN/consumer integration suite.
- Contract AST lint: 3/3 PASS for both contracts with `genvm-lint 0.11.1rc2`; SDK semantic validation is not claimed because the compatible v0.2.12 runner bundle is unavailable to the installed linter.
- Python/source invariant suite: 12/12 PASS.
- `npm exec -- genlayer --version`: `0.39.1`.
- Studionet network info and deployed `network()` readback: `61999`, `studionet`, `https://studio.genlayer.com/api`.
- Extension/signer typecheck, tests and builds: PASS on the current source; contract AST lint `3/3` per contract, extension tests `16/16`, signer tests `27/27`, source invariants `12/12`, Direct Mode `29/29`.
- Reproducible extension archive: `MARGIN-extension-v0.1.0.zip`, SHA-256 `c6ec12468fb129922a33e68f50e7826646e6fe4f1dddaeb3ddc0de841af4a62f`, produced by `npm run zip` from `extension/dist`; the ZIP is not committed as generated noise.
- GitHub Actions `verify` was green for the current repository in [run `36548304731`](https://github.com/ometere123/margin/actions/runs/36548304731); the final repository SHA is reported outside the repository.

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Remaining verification boundary

The corrected contract deployment is real and finalized. The following evidence boundaries remain explicit and must not be overstated:

- The earlier live wallet and browser evidence belongs to the immediately preceding deployment and is retained as historical evidence. The current deployment has fresh same-source appeal, post-deadline settlement, withdrawal and canonical readback evidence: `SETTLED / SUPPORTED`, both credits zero.
- The corrected consumer is newly deployed against the current MARGIN address, its construction calldata binds that address, and its fresh positive exercise finalized successfully with `has_executed: true`.
- Live wallet-to-chain end-to-end verification remains recorded for the preceding deployment; this source-only round did not redo the browser matrix.
- live fee profiling. Live `INCONCLUSIVE` evidence is now recorded for claim `6e886a73a2573cdffb6d74b328215dff6cbd0b8f32e7b5d8141d862ccb1d8cf3`: submit `0x4d1ee62a832e0d4fcb548d7b1c71cccdd4a69650a70f0ce823f61b3c6c1aa777`, resolve `0x04e6245f7a2f44d333e885a7ccbe3e8602fd87dca2990e3de2c0a52e1fe19df8`, and canonical `INCONCLUSIVE` readback. The controlled `STALE` lifecycle is also recorded with submit `0xa3300ccffe62e6f3641c0f1f7b314555f73a7a2e72333bf3f1c8a27bd6f8b166`, resolve `0x14a0d173311ef22c283c07cae4bf9fa2a79fc778f619adcfd41430cd19754e3a`, and canonical `STALE` readback;
- automated browser E2E and hostile-page matrix.

## Production configuration hardening

The canonical static signer is `https://margin-signer.vercel.app/`. Its Vite production build receives the public `VITE_MARGIN_CONTRACT_ADDRESS` value for the canonical Studionet deployment. The signer no longer asks normal users to save a contract address and ignores incoming contract query parameters. The extension release similarly embeds the canonical contract and signer origin; Options is informational rather than an infrastructure editor. The current production deployment is `dpl_5jGexXPWMc1VL6qJe5PoUsDborCF`; HTTP smoke verification and the deployed bundle-address check are recorded with this handoff. Real wallet/browser proof remains manual for this final deployment.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks accepted consensus plus the canonical leader execution result, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors. Minority validator errors are not treated as canonical transaction failure.

No success evidence for those steps has been fabricated.

## Exact continuation sequence

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, `docs/LIVE_VALIDATION.md`, then `docs/CODEX.md` or `docs/CLAUDE.md`.
2. Run `bash scripts/offline-preflight.sh`.
3. Install Node 20+ dependencies with `npm install`. This installs the repo-local `genlayer@0.39.1`. Immediately run `npm run cli:check` and `npm exec -- genlayer --version`; both must resolve to `0.39.1`. Then run `npm run verify`. Repair only real SDK/API drift; preserve the architecture. Do not use the machine's global GenLayer CLI.
4. Create a Python environment, install `requirements.txt`, run the current `genvm-lint check contracts/margin.py`, then run `pytest tests/direct -v`.
5. Deploy `contracts/margin.py` to Studionet and write the real address/transaction/tool versions to a new `deployment.json` (never overwrite the example with invented data).
6. Serve or deploy the static signer and configure its real production origin/CSP.
7. Build the extension and load `extension/dist` unpacked in Chromium.
8. Exercise the controlled fixtures and the full matrix in `docs/LIVE_VALIDATION.md`, including prompt injection, changed-page/stale behavior, duplicate claims, forged keys, repeated text, canonical URLs, SPA/DOM mutation, wallet mismatch, finality and an actual protocol appeal where supported.
9. Record representative fee measurements for submission, normal resolution, maximum-evidence resolution and appeal/finality paths.
10. Replace this status file with a truthful final report containing only real live evidence and remaining account-specific steps.

## Architecture that must not be weakened

- No central MARGIN backend deciding claim status.
- No server-side browsing-history collection.
- No generic “truth score”.
- No politics, medical claims or personal allegations in v0.1 scope.
- No use of the local page digest as proof of historical public content.
- No validator that merely checks the leader output schema.
- No annotations from accepted/pending state when finalized state is required.
- No arbitrary claim/page keys supplied by the client without on-chain payload binding.
