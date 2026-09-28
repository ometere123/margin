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
    └── resolve_claim()     validators independently fetch public evidence
             │
             └── exact agreement on decision-bearing status

MARGIN extension
    │ read LATEST_FINAL directly from 61999
    ▼
status badge beside original claim
```

### Why a tiny signer web surface exists

Injected browser wallets are not reliably injected into `chrome-extension://` pages. MARGIN therefore uses a deliberately small static signer DApp for transaction signing. It holds no server-side state. The signer independently re-derives the draft hashes and verifies the configured contract network before enabling a write. The extension does **not** trust a callback from that page; it re-reads finalized contract state from Studionet.

The extension is still the primary product surface. Normal browsing and anchoring occur locally.

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
2. Run `npm run cli:check` and require it to report local GenLayer CLI `0.39.1`.
3. For every CLI operation use `npm exec -- genlayer ...` (or `npm run genlayer -- ...`). **Do not use a bare/global `genlayer` command**, even if the machine has `0.40.0rc2` globally.
4. Lint `contracts/margin.py` with the compatible GenVM linter.
5. Deploy `contracts/margin.py` to Studionet `61999` using the local CLI.
6. Record the deployed address.
7. Open MARGIN extension options and save that address.
8. Deploy `signer/dist` as a static site (Vercel is fine) and set that URL in extension options.
9. Fund the wallet from the Studionet faucet.
10. Run the scenarios in `docs/LIVE_VALIDATION.md`.

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

This follows the important GenLayer rule that validators must independently verify the substance rather than only checking that the leader returned syntactically valid JSON.

## What remains intentionally environment-specific

This ZIP is designed so another agent only has to finish things that require the live environment:

- current GenVM lint/runtime corrections, if the live stable runner exposes an API mismatch;
- deploy to 61999;
- measure live fee profiles;
- exercise finality and transaction-level appeals;
- load the unpacked extension in Chrome and test against real pages;
- deploy the static signer and set its production URL;
- replace any SDK call whose exact signature has changed in the installed stable release.

The product architecture should not be redesigned to complete those steps.
