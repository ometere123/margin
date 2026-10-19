# Factual self-review

This is an evidence inventory, not a project score. Historical deployments and browser runs are identified as such in `deployment.json`, `SUBMISSION.md` and `docs/LIVE_VALIDATION.md`.

## GenLayer fit

- MARGIN uses independent validator adjudication for bounded public-web claims; the contract binds the final status and status-specific semantic conditions.
- Assured Claims create opposed publisher/challenger bond positions and a bounded appeal/settlement lifecycle.
- `MarginGate.is_claim_supported` exposes only canonical `SETTLED + SUPPORTED` state.
- `MarginConsumer` uses the bound MARGIN address and protected releases can execute or refund based on finalized MARGIN state.
- The current V2 Studionet deployment and its deployment-only readbacks are in `deployment.json`; older lifecycle records are historical. The definitive stable-render Covered checkpoints are recorded separately with final `SUPPORTED` and `CONTRADICTED` outcomes.
- The primary human browser flow against the current deployment passed for normal claim `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33` from https://www.sqlite.org/serverless.html, including finalized `SUPPORTED`, exact re-anchor, highlight, visible badge and provenance routes. No Assured lifecycle was executed for this claim.

## Contract quality

- `contracts/margin.py` covers bounded claims, source identity commitments, accepted observation provenance, explicit normal/Assured adjudication contexts, revision limits, cooldowns, cancellation, stalled abort, appeal, settlement and pull-credit withdrawal.
- `contracts/margin_consumer.py` binds the canonical MARGIN address at construction and rejects caller-selected trust anchors.
- Direct Mode passes `66/66` (`59/59` V2 regression cases plus `7/7` PolicyGate cases); the consumer integration subset passes; source invariants pass `12/12`; the focused security mutation suite kills `15/15` mutations.
- The current deployed MARGIN source matches `deployment.json`: source commit `6798b2e`, 91,516 bytes, SHA-256 `3A23F33952A35E3C848694887BB1C8D8DB03D3E1AEB10999F8A1518A9870BA12`; the consumer is 16,742 bytes with SHA-256 `FBDC44E60CEAC4BFB0F63C8A6F4E78443382D6E6904BC33CE494AEC9C95DD9DA` and is bound to that MARGIN.
- Both contracts passed the pinned GenVM semantic validation in the recorded CI run; the repository also retains the `3/3` AST-lint checks per contract and the green Direct Mode suite.

## Engineering

- `npm run verify` runs contract AST lint, TypeScript typechecks, extension tests, signer tests, Python invariants, Direct Mode and both production builds.
- Current totals are: AST lint `3/3` for each contract, extension `17/17`, signer `43/43`, SDK `7/7`, Action `5/5`, invariants `12/12`, Direct Mode `66/66`, security mutations `15/15` killed. The deterministic browser harness passed; the primary human production normal browser flow is recorded separately from the final Covered lifecycle evidence.
- CLI verification reports exactly `0.39.1`; the exact candidate's GitHub Actions result is reported with the final handoff and must not be inferred from an older run.
- The read-only `npm run live:read` script verifies finalized `network()` identity without a wallet or write.
- Limitation: the optional manual Covered UI walkthrough and demo video were not recorded; the deterministic browser harness is a separate automated check and is not presented as production-wallet evidence.

## Frontend/UX

- The extension remains the primary discovery and annotation surface; the signer provides routed challenge, claim, assurance and activity workspaces.
- The signer preserves injected EIP-1193 wallet handling, finalized reads, transaction persistence/recovery, Explorer links, global wallet controls, claim history and protected-release actions.
- The local signer and production build are configured for the corrected canonical addresses. Fixture deployment `dpl_4wUiXh9LEKoAkP4Qih5pLBA3oi7F` and signer deployment `dpl_6iwqfSVyQCwAaZY3GkpsqyMQiUTw` were GitHub-triggered; the final signer bundle verification is recorded in `deployment.json`, and direct Vercel CLI deployment was not used. Both projects are locked against further automatic Git deployments.
- The extension ZIP hash is `59230A8330579C5D2126CD31DEC72F51C0A4BE42B985817C8FE038A1DB95B7E4`.
- Historical browser evidence demonstrates the RFC `<wbr>` anchoring and visible claim badge; it is not presented as fresh proof against the current deployment.
- Limitation: the optional/hostile browser matrix and the demo video were not recorded or claimed.

## V3 integration boundary

- The V2 contracts and canonical consumer remain unchanged from the accepted
  baseline; V3 adds integration tooling rather than a new claim protocol.
- The SDK, release Action and PolicyGate all require finalized MARGIN state and
  fail closed for ordinary, pending, negative, malformed or unavailable reads.
- The signer `/integrations` workspace is read-only and has a browser-harness
  check for unavailable canonical reads; it does not claim a production wallet
  approval run by itself.
- Local SDK tests cover seven API cases, Action binding tests cover five cases,
  and the reference PolicyGate Direct Mode suite covers seven cases. The
  existing V2 regression/mutation suite remains part of the final gates.
- The official SDK [`@margin-connect/sdk@0.1.0`](https://www.npmjs.com/package/@margin-connect/sdk)
  is public and was installed from the registry in a clean external project;
  ESM/CJS imports passed and its production audit reported zero vulnerabilities.
  The published tarball has eight files and was published from
  `facbdf6f61c9f7868e027faa41ca821fe50a63c2`. The prior
  `@converts/margin-connect@0.1.0` release remains historical migration evidence
  and is untouched pending separate owner confirmation. Independent third-party
  adoption is not claimed without public maintainer evidence.
- The separately deployed PolicyGate is `0xa2Eab1218E09b9d3B28390d4332643Cb3C29ecA1`;
  its finalized deployment, source parity, `APPROVED` readback and one-shot
  action are recorded in `artifacts/margin_connect_v3_policy_gate.json`.
- Main verification run [`39270741687`](https://github.com/ometere123/margin/actions/runs/39270741687)
  passed on `facbdf6f61c9f7868e027faa41ca821fe50a63c2`; the deterministic
  browser harness is not a production-wallet proof. The V2-to-V3 comparison is
[`9d33116f...facbdf6`](https://github.com/ometere123/margin/compare/9d33116f24d5f62b9ca562229ed573fbdb133c31...facbdf6f61c9f7868e027faa41ca821fe50a63c2).
