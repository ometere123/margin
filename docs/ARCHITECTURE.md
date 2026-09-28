# Architecture

## 1. Surfaces

### Browser extension

The extension is the real MARGIN user interface. It does four jobs:

1. capture an exact highlighted claim without uploading ordinary browsing history;
2. create a resilient text quote anchor (`exact`, `prefix`, `suffix`);
3. read finalized claims for the current canonical URL from GenLayer;
4. render claim markers beside matched text without rewriting the webpage's HTML structure.

The extension uses a small DOM badge and a conservative anchor resolver. If an anchor cannot be located unambiguously, MARGIN does not guess.

The resolver builds a rendered text stream from visible text characters. It collapses whitespace that is actually present, treats `<br>`/block boundaries as explicit separators, and does not insert a separator at ordinary text-node or inline-element boundaries. This matters for pages such as RFC Editor, which can split `application-level` as `applicatio<wbr>n-level`; the resulting `Range` spans the real DOM nodes while the badge remains independent of CSS Custom Highlight support. The service worker exposes a bounded success/error result for finalized page reads, and the content script keeps diagnostics behind `margin_debug=1` rather than logging normal browsing activity.

### Signer DApp

The signer exists only because injected EIP-1193 wallets are not reliably exposed inside Chrome extension pages. It receives a fully formed draft through a URL-safe payload and asks the wallet to submit it. Its release build receives the public canonical contract through `VITE_MARGIN_CONTRACT_ADDRESS`; normal users do not edit infrastructure configuration.

It has no database and no authority over extension annotations. Finalized on-chain state is authoritative.

### Intelligent Contract

The contract owns challenge state and resolution history. It does not own browser data or user identity. An optional Assured Claim layer adds domain-control proof, publisher/challenger GEN bonds, one bounded appeal, and deterministic settlement without changing the permissionless normal annotation path.

## 2. Canonical page identity

The client canonicalizes URLs by:

- removing fragments;
- dropping common tracking parameters;
- sorting remaining query parameters;
- normalizing default HTTP(S) ports.

A same-origin `<link rel=canonical>` may be used. Cross-origin canonical hints are ignored.

`page_key = SHA256(canonical_url)`

The contract treats `page_key` as an index hint, not as proof. The extension always filters returned claims by exact `canonical_url`, so a malicious caller cannot make a foreign-page claim appear merely by forging another page key.

## 3. Claim identity

`claim_key` commits to:

- canonical URL;
- page key;
- exact/prefix/suffix anchor;
- local page digest;
- claim class;
- challenge statement;
- sorted evidence URLs;
- archive URL.

Changing evidence or wording therefore creates a different claim.

## 4. Adjudication

The contract fetches:

- the current primary page;
- optional archive URL;
- up to three evidence URLs.

Source text is explicitly treated as untrusted prompt material. Validators independently fetch the bounded source set and commit an ordered source manifest containing fetch status, provenance and content digests. The leader must return bounded structured findings; validators re-derive and verify the decision-bearing fields and manifest. A validator disagreement cannot be hidden by a leader-provided digest.

MARGIN does not use fuzzy status tolerance.

## 5. Revision model

A claim may be re-resolved up to five times, but unchanged source manifests are rejected, immediate refreshes after the first decision are restricted to the original challenger, and other refreshes require a cooldown. Each accepted resolution stores its ordered evidence manifest and is appended to immutable keyed history before the latest status is updated. This prevents a stranger from trivially burning all revision capacity.

The current extension renders the latest finalized status.

### Assured Claims and consumers

An Assured Claim requires an exact HTTPS `/.well-known/margin.json` proof bound to the publisher, nonce, claim and expiry. The publisher and challenger lock bounded GEN bonds. One appeal may be opened before the deadline; after the deadline, deterministic settlement allocates the funded balances according to the finalized status. `MarginConsumer` demonstrates a downstream contract reading settled MARGIN state directly rather than trusting extension data.

## 6. No MARGIN backend

There is no MARGIN indexing server in v0.1. Per-page keys make finalized state directly queryable from the Intelligent Contract. This is deliberate:

- no browsing-history collection;
- no central verdict API;
- no backend that can silently suppress claims;
- fewer trust assumptions.
