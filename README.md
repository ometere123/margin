# MARGIN

**Consensus-backed footnotes for the public web.**

MARGIN is a Chrome/Chromium browser extension plus a GenLayer Intelligent Contract. A user highlights a narrow public claim on a webpage, states one precise objection, attaches independently inspectable evidence, and submits the challenge to GenLayer Studionet. Validators independently inspect the same public sources and reach consensus on one bounded result:

- `SUPPORTED`
- `CONTRADICTED`
- `INCONCLUSIVE`
- `STALE`

When another MARGIN user visits that page, the extension reads finalized state directly from GenLayer and places a small status badge beside the anchored claim.

MARGIN is **not** a generic fact checker, reputation score, moderation system, or political-truth oracle. v0.1 intentionally accepts only technical, licence, compatibility, pricing and documentation challenges.

## Network: fixed to 61999

This repository targets **GenLayer Studionet**:

| Setting | Value |
|---|---|
| Chain ID | `61999` |
| GenLayer RPC | `https://studio.genlayer.com/api` |
| Currency | `GEN` |
| Explorer | `https://explorer-studio.genlayer.com` |

The product has one network target only: Studionet 61999.

## Product architecture

```text
public webpage
    │
    │ highlight + right click
    ▼
MARGIN content script
    │  text quote anchor + local page digest
    ▼
MARGIN side panel
    │  precise objection + <=3 evidence URLs + optional archive
    ▼
wallet signer web surface
    │  injected EIP-1193 wallet
    │  fee estimate + signed write
    ▼
GenLayer Studionet 61999
    │
    ├── submit_claim()      deterministic bounded storage
    │
    ├── resolve_claim()     validators independently fetch public evidence
    │       └── bounded source manifest + structured finding fields
    │
    └── optional Assured Claim lifecycle
            └── HTTPS domain proof → publisher/challenger GEN bonds → one appeal → settlement

MARGIN extension
    │ read LATEST_FINAL directly from 61999
    ▼
status badge beside original claim
```

### Why a tiny signer web surface exists

Injected browser wallets are not reliably injected into `chrome-extension://` pages. MARGIN therefore uses a deliberately small static signer DApp for transaction signing. It holds no server-side state. The signer independently re-derives the draft hashes and verifies the configured contract network before enabling a write. The extension does **not** trust a callback from that page; it re-reads finalized contract state from Studionet.

The extension is still the primary product surface. Normal browsing and anchoring occur locally. Finalized page reads are cached, deduplicated and globally rate-limited so dynamic pages cannot turn mutation/SPA observation into an unbounded RPC loop; temporary gateway failures retain the last successful finalized result and allow only bounded cooldown retries until the user explicitly refreshes annotations. Context-menu actions open the side panel while the originating user gesture is still active. Annotation badges store the selected claim and the user can open the panel from the extension action; Chrome does not permit the service worker to open a side panel after a content-script message has crossed that boundary.

The extension requests `storage` for local draft/session state, `contextMenus` and `sidePanel` for the challenge workflow, `tabs`/`activeTab` to address the originating public tab, and `scripting` only to recover a content script in an already-open HTTP(S) tab after an unpacked-extension reload. It does not inject into browser, extension, or local-file pages. During development, reload the unpacked extension and then reload the RFC page; the service worker also pings the active HTTP(S) tab and performs a guarded reinjection when the old content context has been invalidated.

For a bounded annotation diagnostic, append `?margin_debug=1` to a supported page and inspect the content-script console, or send the internal `MARGIN_DIAGNOSTICS` message from the extension context. The diagnostic reports the canonical URL, derived page key, finalized read result, returned claim keys, anchor match count, normalized range text, range rectangle and badge count without changing protocol state.

## Repository

```text
contracts/margin.py          GenLayer Intelligent Contract
extension/                   Manifest V3 Chrome extension
signer/                      static wallet signer DApp
shared/protocol.ts           chain constants, keys, draft encoding
scripts/                     verification + ZIP handoff scripts
tests/                       source invariants + GenLayer Direct Mode tests
docs/                        architecture, threat model, live validation
CLAUDE.md                    Claude handoff
CODEX.md                     Codex handoff
```

## Build

```bash
npm install
npm run verify
```

Built extension:

```text
extension/dist/
```

Built signer:

```text
signer/dist/
```

Load `extension/dist` as an unpacked extension in Chromium.


### Pinned GenLayer CLI

MARGIN intentionally pins **GenLayer CLI `0.39.1` locally** because this repository targets Studionet `61999`. A developer machine may have another global GenLayer CLI installed (for example `0.40.0rc2`), but that global binary must not be used for this project.

After `npm install`:

```bash
npm run cli:check
npm exec -- genlayer --version
```

All project CLI commands should be run through the local package, for example:

```bash
npm exec -- genlayer deploy contracts/margin.py --network studionet
```

The exact command flags should still be checked against `npm exec -- genlayer <command> --help` before a live write.

## Live deployment path

1. Run `npm install` in the repository root. The repo pins the **local** npm package `genlayer` to exactly `0.39.1` in `devDependencies` and `.genlayer-cli-version`.
2. Run `npm run cli` and require it to report local GenLayer CLI `0.39.1`.
3. For every CLI operation use `npm exec -- genlayer ...` (or `npm run genlayer -- ...`). **Do not use a bare/global `genlayer` command**, even if the machine has `0.40.0rc2` globally.
4. Lint `contracts/margin.py` with the compatible GenVM linter.
5. The current canonical deployment is recorded in [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md).
6. Build the extension; its release configuration contains the canonical public contract and signer origin.
7. Deploy `signer/dist` as a static site with public Vite configuration `VITE_MARGIN_CONTRACT_ADDRESS` set to the canonical address. This is public configuration, not a secret.
8. Fund the wallet from the Studionet faucet.
9. Run the scenarios in `docs/LIVE_VALIDATION.md`. Normal users never configure the contract, RPC, chain or signer URL.

Current canonical contract: `0xb4161203706B2428D5FbC5B7e114b09d1De32960` on Studionet 61999, deployed from source commit `552a6810742bd28ed0fc9eac80f07e69e95f8791`. The prior `0x03fE...D57C` deployment is historical. The production signer is [`https://margin-signer.vercel.app/`](https://margin-signer.vercel.app/). See [`deployment.json`](deployment.json) and [`SUBMISSION.md`](SUBMISSION.md) for the live record.

## Evidence model

A challenge stores:

- canonical URL;
- exact quote + prefix/suffix anchor;
- local page digest;
- narrow claim class;
- exact challenge statement;
- up to three public evidence URLs;
- optional public archive URL;
- challenger address and transaction timestamp.

The local page digest prevents the extension from silently changing what *it* saw, but is not used as independent historical truth. Validators resolve against independently fetchable public sources.

## Consensus design

`resolve_claim` runs a leader adjudication over the same bounded source set that validators can independently fetch. A validator reruns the source-grounded adjudication. The decision-bearing `status` must match exactly. Rationale may differ and only the accepted leader rationale is stored.

Each accepted revision also stores a digest of the ordered sources, fetch statuses and bounded content digests observed by validators, plus structured source-index fields. An unchanged source manifest cannot consume another revision; immediate refreshes after the first decision are restricted to the challenger or a cooldown. Recognised archive hosts are distinguished from ordinary supplemental URLs.

An optional Assured Claim binds a publisher to an HTTPS `/.well-known/margin.json` proof, requires publisher and challenger GEN bonds, permits one bounded appeal, and exposes deterministic settlement/withdrawal state. It is separate from normal permissionless annotations. `contracts/margin_consumer.py` demonstrates reading settled MARGIN state directly before allowing a protected action.

This follows the important GenLayer rule that validators must independently verify the substance rather than only checking that the leader returned syntactically valid JSON.

## What remains intentionally environment-specific

The corrected contract is deployed, corrected-contract normal claim lifecycles are recorded in `deployment.json`, and the RFC browser-aligned claim has been read and visibly rendered by the built extension. The following evidence remains account/browser dependent and must not be inferred from unit tests:

- complete a fresh wallet-to-chain submit/resolve session from the extension;
- exercise the Assured Claim appeal and post-deadline settlement path;
- deploy/exercise the reference consumer and record its canonical readback;
- measure representative fee profiles and transaction-level appeals where supported by the stable tooling.

The product architecture should not be redesigned to complete those steps.
