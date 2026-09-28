# MARGIN final handoff status

## Current live status (2026-09-28)

The canonical Studionet deployment is complete for the contract path. Use [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md) as the authoritative live record:

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0x03fE368186822d745b4DB8e4A49f8F43e867D57C`.
- Deployment: `0xde6118bd3f5208c0b01f99ba085c7630e8fefc20811b3cd807d2b69e285082e9`, `FINALIZED / MAJORITY_AGREE / SUCCESS`.
- Source commit: `a18eba60cdb1b26c55692cb8dbc6f26d08ea1359`.
- Live claim submission: `0x3566ff81712e5b461a1f7e7dfe52a47eac49a6e289aedb6dcaac1f67d2605ed7`.
- Live resolution: `0x9411abcfe550b88b3d4e68bb54e22d1222da64616e7449e27d07aef29a5e013e`, finalized `SUPPORTED`.

The earlier environment-bound checklist below is historical context. It is not permission to overwrite the final deployment record or claim that browser-wallet verification occurred when it has not.

MARGIN has been pushed to the environment boundary available in this build session. Continue **in place**; do not re-scaffold it.

## What is already implemented

- Chromium Manifest V3 browser extension as the primary product surface.
- Text-selection capture with canonical URL, exact/prefix/suffix anchor and local page digest.
- Challenge composer for five bounded claim classes and up to three public evidence URLs plus an optional public archive URL.
- Canonical page key and claim key generation, with both keys recomputed and enforced by the Intelligent Contract.
- GenLayer Intelligent Contract with bounded page index, bounded revision history, public views, deterministic submission validation and non-deterministic web/LLM resolution.
- Independent validator re-execution of the evidence task; decision-bearing status must match exactly.
- Bounded results: `SUPPORTED`, `CONTRADICTED`, `INCONCLUSIVE`, `STALE`.
- Read-only extension state uses finalized GenLayer reads rather than a MARGIN backend.
- Static wallet signer for injected EIP-1193 wallets, transaction fee estimation, writes and finalization.
- Webpage annotation rendering anchored back beside the challenged text.
- Prompt-injection treatment: fetched pages are explicitly untrusted evidence and cannot redefine adjudication instructions.
- Source-level and direct-mode test suites, controlled public-fixture pages, architecture/threat/live-validation documentation.

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

## Checks completed in the originating environment

- `python3 -m py_compile` on the contract and Python tests: PASS.
- source invariant suite: PASS.
- repository-wide forbidden-chain scan: PASS.
- shared `protocol.ts` compile with the available global TypeScript compiler: PASS.
- a temporary-module-shim TypeScript pass over extension/signer source was also completed successfully during development.
- JS/Python canonical-JSON claim-key parity was checked, including Unicode input: PASS.

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Environment boundary reached here

The build container could not reach npm, so the following must **not** be represented as completed yet:

- fresh `npm install` / `npm ci`;
- real `npm run verify` against downloaded dependencies;
- actual extension/signer production bundles;
- GenVM linter execution with the current downloaded toolchain;
- Direct Mode execution with the downloaded GenLayer testing suite;
- deployment to Studionet;
- live validator/finality/appeal exercise;
- live browser + wallet end-to-end verification;
- live fee profiling.

## Production configuration hardening

The canonical static signer is `https://margin-signer.vercel.app/`. Its Vite production build receives the public `VITE_MARGIN_CONTRACT_ADDRESS` value for the canonical Studionet deployment. The signer no longer asks normal users to save a contract address and ignores incoming contract query parameters. The extension release similarly embeds the canonical contract and signer origin; Options is informational rather than an infrastructure editor.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks the complete observed execution vector for `SUCCESS`, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors.

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
