# MARGIN final handoff status

## Current live status (2026-10-07)

The final material-observation V2 Studionet MARGIN and bound-consumer deployments are finalized and recorded in [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md). The final-deployment economic lifecycle is recorded in [`scripts/live/evidence/final-v2-economic-contradicted.json`](../scripts/live/evidence/final-v2-economic-contradicted.json); its writes are kept distinct from historical V2 evidence. The final production browser proof is recorded below; no Covered/Assured economic lifecycle was rerun for that browser proof.

The final candidate includes the material-observation/citation contract hardening and corresponding tests; the prior V2 deployment is historical.

The frontend workspace routes are `/`, `/challenge?draft=...`, `/claim/<claimKey>`, `/claim/<claimKey>/assurance`, and `/activity`. The signer remains static and wallet-backed; the extension remains the primary discovery and annotation surface. The supplied logo/favicon/icon assets are included in the signer and MV3 extension. The MARGIN contract was not changed; the bound consumer was redeployed for the capped protected-release index.

- Network: Studionet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `0x4E0a75B63D913FC2d39A75F61905CA5973c77491`.
- Bound consumer: `0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F`, bound to the V2 contract above.
- Deployment: `0xa6917d417dd63f683684acdfe7168c75bad1310172a79d0a91fed21835d5a617`, `FINALIZED / MAJORITY_AGREE / SUCCESS`.
- Deployment source commit: `ab5bbef32d046cf19e6621275485b57d4268ac87`.
- Deployment source: 86,605 bytes; SHA-256 `A079E57EA831456721A6982FC5A4FB5B6AA77649D71EC3636BE44540292B41F1`.
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`.
- Human browser proof against the current deployment: normal claim `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33` from https://www.sqlite.org/serverless.html reached finalized `SUPPORTED`, re-anchored the exact quote, rendered the highlight and visible `M · SUPPORTED` badge, and exposed extension/full provenance routes. This was not an Assured Claim lifecycle.
- Final production browser proof: the MDN Array.prototype.at claim at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at reached finalized `SUPPORTED` through the production signer on the final MARGIN deployment. The exact quote was re-anchored, highlighted, and rendered with a visible `M · SUPPORTED` badge; side-panel and full provenance routes rendered successfully. Exact transaction hashes were not committed and are not inferred here.
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

- Direct Mode: 54/54 PASS, including Covered Claim collateral/exposure cases, citation-integrity cases, timeout-race cases, per-creator release-cap enforcement, pagination, bond-conservation assertions, real MARGIN/consumer integration coverage and explicit consensus trust-boundary tamper cases.
- Contract AST lint: 3/3 PASS for both contracts with `genvm-lint 0.11.1rc2`; SDK semantic validation is not claimed because the compatible v0.2.12 runner bundle is unavailable to the installed linter.
- Python/source invariant suite: 12/12 PASS.
- `npm exec -- genlayer --version`: `0.39.1`.
- Studionet network info and deployed `network()` readback: `61999`, `studionet`, `https://studio.genlayer.com/api`.
- Extension/signer typecheck, tests and builds: PASS on the current source; contract lint is AST-only (`3/3` per contract; full SDK semantic validation was not run), extension tests `17/17`, signer tests `33/33`, source invariants `12/12`, Direct Mode `54/54`, security mutations `12/12` killed. The deterministic browser harness is separate from manual real-wallet verification.
- Reproducible extension archive: `MARGIN-extension-v0.1.0.zip`, SHA-256 `29264999CA6202A184899EA3FBA0E4097BCE25088B88A602FC3622F114FB1079`, produced by `npm run zip` from `extension/dist`; the ZIP is not committed as generated noise.
- GitHub Actions status must be read from the workflow run attached to the exact candidate commit; the prior run reference is historical and is not current verification for this hardening pass.

Run `bash scripts/offline-preflight.sh` immediately after unzipping to repeat the checks that do not require package downloads.

## Remaining verification boundary

The current live evidence boundary is:

- MARGIN V2 deployment: `0x4E0a75B63D913FC2d39A75F61905CA5973c77491`, finalized at `0xa6917d417dd63f683684acdfe7168c75bad1310172a79d0a91fed21835d5a617`.
- Consumer V2 deployment: `0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F`, finalized at `0x521f944b8274e4f4e5bfe151c3f9a6fdba0fd4f5f4f515dd8f98b5d7976ce01d`, with constructor binding read back as the final MARGIN address. Source commit `ab5bbef32d046cf19e6621275485b57d4268ac87`, SHA-256 `4060BFABA93A8B6BF90F6CDA6466D2066A7F1E1ED91036C1DB275047201DF6EC`, 15,416 bytes.
- Fresh final-deployment normal claim evidence: submit → resolve → `FINALIZED / MAJORITY_AGREE / SUCCESS`, with canonical verdict `SUPPORTED`, as recorded above.
- The superseded V2 evidence checkpoints `V2-final-supported.json`, `V2-render-supported.json`, `V2-contradicted.json` and `V2-contradicted-strong.json` are historical. Current final-deployment evidence is recorded separately in `scripts/live/evidence/final-v2-economic-contradicted.json`; no historical checkpoint is relabeled as final evidence.
- Primary human browser flow: `PASS`. Optional/hostile browser matrix items are not claimed unless individually recorded.

## Production configuration hardening

The local static signer build and production Vercel signer receive the final V2 `VITE_MARGIN_CONTRACT_ADDRESS` and `VITE_MARGIN_CONSUMER_ADDRESS` values. Production deployment `dpl_9Avj9b5Mx7BwgtbBYsZhdVKazJmV` was built from signer-only patch commit `e35e27ea2c76fcb5482d285b6b41b858813b684e` and verified at `https://margin-signer.vercel.app/`.

The signer must use the injected EIP-1193 provider directly. In `genlayer-js@1.1.8`, `client.connect('studionet')` enters the legacy GenLayer Snap path (`wallet_getSnaps` / `wallet_requestSnaps`); production MARGIN therefore constructs the provider-backed client without calling that helper. `signer/src/wallet.test.ts` guards this boundary.

The same SDK's Studio finalization response is shaped differently from older receipt examples: it reports `statusName: FINALIZED` and execution outcomes under `consensus_data.leader_receipt[].execution_result` / `consensus_data.validators[].execution_result`. It does not export `isSuccessful()` and may omit `txExecutionResultName`. The signer therefore checks accepted consensus plus the canonical leader execution result, accepts a null application return, persists each returned transaction ID before polling, and reports resumable tracking instead of calling a submitted transaction failed when polling itself errors. Minority validator errors are not treated as canonical transaction failure.

No success evidence for those steps has been fabricated.

## Final state note

The contracts are deployed on Studionet 61999 and the extension is built. The final signer is available locally with `npm run dev -w signer` at `http://localhost:5174/`, and the production signer is deployed at `https://margin-signer.vercel.app/`. Final Covered/Assured economic evidence remains the recorded non-browser lifecycle; the MDN browser proof was a normal claim only.

### Manual Covered browser checklist

1. Run `npm run build` and load `extension/dist` as an unpacked MV3 extension.
2. Run `npm run dev -w signer` and open `http://localhost:5174/`.
3. Confirm the deployment card shows Studionet `61999`, MARGIN `0x4E0a75B63D913FC2d39A75F61905CA5973c77491` and consumer `0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F`.
4. On a real public HTTPS page, select a narrow technical claim and choose **Challenge with MARGIN**.
5. Confirm `/challenge?draft=...` preserves the exact quote, prefix, suffix, evidence and claim key; connect an injected wallet and verify off-network writes are blocked.
6. Submit once, record the immediate transaction ID, wait for `FINALIZED` plus successful execution, resolve once, and wait for the separate resolution transaction to finalize.
7. Return to the source page, confirm exact re-anchoring, `M · SUPPORTED`/bounded verdict display, provenance, evidence and the assurance route.
8. For a Covered flow, use a publisher-controlled proof, verify the canonical required challenge/appeal bond values, create a protected release before settlement, and confirm the final release/withdrawal state from canonical reads.

Manual status: `MANUAL VERIFICATION REQUIRED`.

## Architecture that must not be weakened

- No central MARGIN backend deciding claim status.
- No server-side browsing-history collection.
- No generic “truth score”.
- No politics, medical claims or personal allegations in v0.1 scope.
- No use of the local page digest as proof of historical public content.
- No validator that merely checks the leader output schema.
- No annotations from accepted/pending state when finalized state is required.
- No arbitrary claim/page keys supplied by the client without on-chain payload binding.
