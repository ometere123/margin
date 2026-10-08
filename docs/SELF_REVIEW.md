# Factual self-review

This is an evidence inventory, not a project score. Historical deployments and browser runs are identified as such in `deployment.json`, `SUBMISSION.md` and `docs/LIVE_VALIDATION.md`.

## GenLayer fit

- MARGIN uses independent validator adjudication for bounded public-web claims; the contract binds the final status and status-specific semantic conditions.
- Assured Claims create opposed publisher/challenger bond positions and a bounded appeal/settlement lifecycle.
- `MarginGate.is_claim_supported` exposes only canonical `SETTLED + SUPPORTED` state.
- `MarginConsumer` uses the bound MARGIN address and protected releases can execute or refund based on finalized MARGIN state.
- The current V2 Studionet deployment and its deployment-only readbacks are in `deployment.json`; older lifecycle records are historical until rerun against V2.
- The primary human browser flow against the current deployment passed for normal claim `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33` from https://www.sqlite.org/serverless.html, including finalized `SUPPORTED`, exact re-anchor, highlight, visible badge and provenance routes. No Assured lifecycle was executed for this claim.

## Contract quality

- `contracts/margin.py` covers bounded claims, source identity commitments, accepted observation provenance, explicit normal/Assured adjudication contexts, revision limits, cooldowns, cancellation, stalled abort, appeal, settlement and pull-credit withdrawal.
- `contracts/margin_consumer.py` binds the canonical MARGIN address at construction and rejects caller-selected trust anchors.
- Direct Mode passes `54/54`; the consumer integration subset passes; source invariants pass `12/12`; the focused security mutation suite kills `12/12` mutations.
- The current deployed MARGIN source matches `deployment.json`: commit `ab5bbef32d046cf19e6621275485b57d4268ac87`, 86,605 bytes, SHA-256 `A079E57EA831456721A6982FC5A4FB5B6AA77649D71EC3636BE44540292B41F1`.
- Limitation: semantic GenVM lint validation is unavailable locally because the compatible v0.2.12 runner bundle is unavailable to the installed linter; the AST lint pass is `3/3` and the Direct Mode runner is green.

## Engineering

- `npm run verify` runs contract AST lint, TypeScript typechecks, extension tests, signer tests, Python invariants, Direct Mode and both production builds.
- Current totals are: AST lint `3/3` for each contract, extension `17/17`, signer `36/36`, invariants `12/12`, Direct Mode `54/54`, security mutations `12/12` killed. The primary human production normal browser flow passed and the final Covered/Assured economic lifecycle passed through the final live script; the optional manual Covered UI walkthrough is not claimed.
- CLI verification reports exactly `0.39.1`; the exact candidate's GitHub Actions result is reported with the final handoff and must not be inferred from an older run.
- The read-only `npm run live:read` script verifies finalized `network()` identity without a wallet or write.
- Limitation: the optional/hostile browser matrix and demo video were not recorded.

## Frontend/UX

- The extension remains the primary discovery and annotation surface; the signer provides routed challenge, claim, assurance and activity workspaces.
- The signer preserves injected EIP-1193 wallet handling, finalized reads, transaction persistence/recovery, Explorer links, global wallet controls, claim history and protected-release actions.
- The local and production signer builds are configured for the final V2 addresses; production deployment `dpl_9Avj9b5Mx7BwgtbBYsZhdVKazJmV` is recorded in `deployment.json`.
- The extension ZIP hash is `29264999CA6202A184899EA3FBA0E4097BCE25088B88A602FC3622F114FB1079`.
- Historical browser evidence demonstrates the RFC `<wbr>` anchoring and visible claim badge; it is not presented as fresh proof against the current deployment.
- Limitation: the optional/hostile browser matrix and the demo video were not recorded or claimed.
