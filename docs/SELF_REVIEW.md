# Factual self-review

This is an evidence inventory, not a project score. Historical deployments and browser runs are identified as such in `deployment.json`, `SUBMISSION.md` and `docs/LIVE_VALIDATION.md`.

## GenLayer fit

- MARGIN uses independent validator adjudication for bounded public-web claims; the contract binds the final status and status-specific semantic conditions.
- Assured Claims create opposed publisher/challenger bond positions and a bounded appeal/settlement lifecycle.
- `MarginGate.is_claim_supported` exposes only canonical `SETTLED + SUPPORTED` state.
- `MarginConsumer` uses the bound MARGIN address and protected releases can execute or refund based on finalized MARGIN state.
- The current Studionet deployment and live lifecycle records are in `deployment.json`.
- Limitation: the current repository does not contain a fresh browser-wallet demonstration against the latest deployment, and no demo video is recorded.

## Contract quality

- `contracts/margin.py` covers bounded claims, source identity commitments, accepted observation provenance, explicit normal/Assured adjudication contexts, revision limits, cooldowns, cancellation, stalled abort, appeal, settlement and pull-credit withdrawal.
- `contracts/margin_consumer.py` binds the canonical MARGIN address at construction and rejects caller-selected trust anchors.
- Direct Mode passes `29/29`; the consumer integration subset passes; source invariants pass `12/12`.
- The current deployed MARGIN source matches `deployment.json`: commit `826206bb1825cbcd716e0eb24288e91b8bc6d00a`, 58,790 bytes, SHA-256 `6F5866BCEE5569C3BA0560E172F3FF524CF43F2A7A174189DB05CC03BD9FDEAF`.
- Limitation: semantic GenVM lint validation is unavailable locally because the compatible v0.2.12 runner bundle is unavailable to the installed linter; the AST lint pass is `3/3` and the Direct Mode runner is green.

## Engineering

- `npm run verify` runs contract AST lint, TypeScript typechecks, extension tests, signer tests, Python invariants, Direct Mode and both production builds.
- Current totals are: AST lint `3/3` for each contract, extension `16/16`, signer `27/27`, invariants `12/12`, Direct Mode `29/29`.
- CLI verification reports exactly `0.39.1`; CI is green in [run 36550961019](https://github.com/ometere123/margin/actions/runs/36550961019).
- The read-only `npm run live:read` script verifies finalized `network()` identity without a wallet or write.
- Limitation: automated browser E2E and the full hostile-page matrix were not run in this environment.

## Frontend/UX

- The extension remains the primary discovery and annotation surface; the signer provides routed challenge, claim, assurance and activity workspaces.
- The signer preserves injected EIP-1193 wallet handling, finalized reads, transaction persistence/recovery, Explorer links, global wallet controls, claim history and protected-release actions.
- The production signer is `https://margin-signer.vercel.app/`, deployment `dpl_6mGoLz1QmrTMuz9bvjxBkY5Ynnv2`.
- The extension ZIP hash is `c6ec12468fb129922a33e68f50e7826646e6fe4f1dddaeb3ddc0de841af4a62f`.
- Historical browser evidence demonstrates the RFC `<wbr>` anchoring and visible claim badge; it is not presented as fresh proof against the current deployment.
- Limitation: fresh Chromium matrix execution, real-wallet current-deployment proof and the demo video remain manual deliverables.
