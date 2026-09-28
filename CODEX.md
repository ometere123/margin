# CODEX HANDOFF — MARGIN

Continue MARGIN **in place** from this repository. Do not redesign it into a generic fact-check website, moderation bot, prediction market, reputation system, or normal DApp dashboard.

## Product invariant

MARGIN is a browser-extension-native semantic annotation layer for narrow public web claims. Normal browsing remains local. A claim becomes on-chain only when a user deliberately challenges highlighted text. Finalized GenLayer state is rendered back beside the original webpage text.

## Network invariant

Use **GenLayer Studionet only**:

- Chain ID `61999`
- RPC `https://studio.genlayer.com/api`
- network preset `studionet`

Do not silently migrate to any other network or preview environment.

## Your job

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, and `docs/LIVE_VALIDATION.md` first.
2. Run `npm install` at the repository root. This project pins `genlayer` **exactly to `0.39.1` locally** for Studionet 61999. The user's machine may have global CLI `0.40.0rc2`; ignore it. Run `npm run cli:check`, then use only `npm exec -- genlayer ...` (or `npm run genlayer -- ...`) for GenLayer CLI operations. Never run a bare/global `genlayer` command for this repo.
3. Add the official GenLayer docs MCP if available:
   `codex mcp add genlayer-docs --url https://docs-mcp.genlayer.com/mcp`
4. Run `npm install` and `npm run verify`; repair any dependency/API drift without changing architecture.
5. Run current `genvm-lint check contracts/margin.py` and fix every real lint/runtime issue.
6. Run Direct Mode / gltest coverage for deterministic writes and the resolution paths if the stable toolchain permits it.
7. Deploy `contracts/margin.py` to Studionet 61999 and record the deployment address/tx in `deployment.json`.
8. Exercise all scenarios in `docs/LIVE_VALIDATION.md` using real public fixtures you control where necessary.
9. Measure fee behavior on representative worst-case calls, not one toy call. Add `fee-profile.json` / evidence notes compatible with the current stable stack.
10. Build and load `extension/dist` unpacked in Chromium. Test anchoring, SPA pages, repeated text, DOM mutation, canonical URLs and final-state annotations.
11. Deploy `signer/dist` as a static app or leave exact Vercel deployment as the only manual user action if credentials are unavailable. Do not add a stateful MARGIN backend.
12. Confirm injected EIP-1193 signing, fee estimation, finalized reads and one transaction-level appeal against the live 61999 deployment.
13. Harden CSP and production-origin configuration for the signer.
14. Add screenshots/evidence notes only after actual live tests; do not fabricate success claims.
15. Perform a hostile source review before stopping: prompt injection, forged page key, evidence limits, duplicate claims, history bounds, stale content, status finality, wallet/network mismatch, annotation false positives.

## Architectural constraints

- No server-side browsing-history collection.
- No central API decides statuses.
- Extension reads `LATEST_FINAL` from GenLayer.
- A forged `page_key` must not make a claim render on a different canonical URL.
- `page_digest` is a local integrity anchor, not independent historical evidence.
- Historical source claims require public archive evidence or can be `STALE/INCONCLUSIVE`.
- Validators must independently verify the decision; never replace the current validator with JSON-shape-only acceptance.
- Keep authoritative result enum bounded: `SUPPORTED`, `CONTRADICTED`, `INCONCLUSIVE`, `STALE`.
- Keep v0.1 classes bounded: technical, licence, compatibility, pricing, documentation.
- Do not broaden into politics, medical claims, personal allegations or generic truth scoring.

## Stop condition

Stop only when the source, tests, extension build, stable Studionet deployment/runtime, fee measurement and live browser workflow are as complete as available credentials/environment permit. Leave a precise `FINAL_HANDOFF.md` listing only genuinely manual/account-specific leftovers.
