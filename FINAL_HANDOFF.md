# MARGIN final handoff status

## Current live status (2026-09-28)

The corrected Studionet deployment and corrected-contract normal claim lifecycles are complete. Use [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md) as the authoritative live record. The browser-aligned finalized claim has now been read and visibly rendered by the built extension on the RFC page; the optional Assured Claim path is recorded separately.

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0xb4161203706B2428D5FbC5B7e114b09d1De32960`.
- Deployment: `0xe72cb9b184b2cd98f2b86182c7b2bd0df3091ed71bc50417dac6cbffef13e27b`, `FINALIZED / MAJORITY_AGREE / SUCCESS`.
- Source commit: `552a6810742bd28ed0fc9eac80f07e69e95f8791`.
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`.
- A corrected-contract browser-aligned normal claim is finalized as `SUPPORTED` and has been rendered as a visible claim-keyed badge by the built extension on `https://www.rfc-editor.org/info/rfc9110/`. See [`SUBMISSION.md`](SUBMISSION.md) for the exact observed claim key and geometry.

The earlier environment-bound checklist below is historical context. It is not permission to overwrite the final deployment record or claim that browser-wallet verification occurred when it has not.

MARGIN has been pushed to the environment boundary available in this build session. Continue **in place**; do not re-scaffold it.

## What is already implemented

- Chromium Manifest V3 browser extension as the primary product surface.
- Text-selection capture with canonical URL, exact/prefix/suffix anchor and local page digest.
- Challenge composer for five bounded claim classes and up to three public evidence URLs plus an optional public archive URL.
- Canonical page key and claim key generation, with both keys recomputed and enforced by the Intelligent Contract.
- GenLayer Intelligent Contract with bounded page index, bounded revision history, validator-bound source manifests, domain-controlled Assured Claims, native GEN bonds, one appeal and deterministic settlement views.
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

- WSL Direct Mode: 14/14 PASS, including adversarial domain-proof rejection cases.
- WSL contract lint/validation: PASS with `genvm-lint 0.11.1rc2`.
- Python/source invariant suite: 12/12 PASS.
- `npm exec -- genlayer --version`: `0.39.1`.
- Studionet network info and deployed `network()` readback: `61999`, `studionet`, `https://studio.genlayer.com/api`.
- Extension/signer typecheck, tests and builds: PASS on the current committed source; extension tests `12/12`, signer tests `15/15`, source invariants `12/12`.
- Reproducible extension archive: `MARGIN-extension-v0.1.0.zip`, SHA-256 `66f245a1a14969b061c11b6bfa43c72140356a2232f447787273b73e86f664d9`, produced by `npm run zip` from `extension/dist`; repeated generation with unchanged sources matched this hash.
- GitHub Actions `verify` is green for the current HEAD `12ee9b10fcb923f70e894c5755d0682f99c15a92` (run `36467929894`).

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Remaining verification boundary

The corrected contract deployment is real and finalized. The following remain open and must not be represented as completed:

- Live Assured Claims have now passed registration, challenge, resolution, post-deadline settlement and withdrawal for both `CONTRADICTED` and `SUPPORTED` outcomes. Canonical readbacks are settled with zero remaining credits after withdrawal.
- The separate consumer was exercised against both states: it rejected the settled contradicted claim and successfully executed against the settled supported claim.
- live wallet-to-chain end-to-end verification is now recorded: fresh submit `0xaa2e1205bbb1680d03d4ccba35fb615115a64f899f486b4e3eca71a17605e2af` and resolve `0xd9b7c3743d60a6230d2a119c3f57be002e04d793b8de0f0cad7a898dccf83836` both finalized successfully through the production signer and injected wallet;
- live fee profiling. Live `INCONCLUSIVE` evidence is now recorded for claim `6e886a73a2573cdffb6d74b328215dff6cbd0b8f32e7b5d8141d862ccb1d8cf3`: submit `0x4d1ee62a832e0d4fcb548d7b1c71cccdd4a69650a70f0ce823f61b3c6c1aa777`, resolve `0x04e6245f7a2f44d333e885a7ccbe3e8602fd87dca2990e3de2c0a52e1fe19df8`, and canonical `INCONCLUSIVE` readback. The controlled `STALE` lifecycle is also recorded with submit `0xa3300ccffe62e6f3641c0f1f7b314555f73a7a2e72333bf3f1c8a27bd6f8b166`, resolve `0x14a0d173311ef22c283c07cae4bf9fa2a79fc778f619adcfd41430cd19754e3a`, and canonical `STALE` readback;
- automated browser E2E and hostile-page matrix.

## Production configuration hardening

The canonical static signer is `https://margin-signer.vercel.app/`. Its Vite production build receives the public `VITE_MARGIN_CONTRACT_ADDRESS` value for the canonical Studionet deployment. The signer no longer asks normal users to save a contract address and ignores incoming contract query parameters. The extension release similarly embeds the canonical contract and signer origin; Options is informational rather than an infrastructure editor. The current corrected signer deployment `dpl_CusQjTanPdaNEcJmaDtj8WC3iBhR` is live. Its response was checked after that deployment and returned the intended CSP, clickjacking, MIME, referrer and permissions headers; the deployed bundle contains the canonical contract address. The static deployment uses the repository-root `vercel.json` because the signer imports the shared protocol module. The finalized RFC claim has been proven through the extension's live read/anchor/badge path, and a separate real production signer session completed Submit and Resolve through the injected wallet; exact hashes and canonical readbacks are recorded in `docs/LIVE_VALIDATION.md`.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks accepted consensus plus the canonical leader execution result, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors. Minority validator errors are not treated as canonical transaction failure.

No success evidence for those steps has been fabricated.

## Exact continuation sequence

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, `docs/LIVE_VALIDATION.md`, then `CODEX.md` or `CLAUDE.md`.
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
