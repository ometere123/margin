# MARGIN Connect (V3)

MARGIN Connect is an incremental integration surface over the accepted V2
deployment. It does not change `contracts/margin.py` or
`contracts/margin_consumer.py`, and it does not create a second Covered Claim
consumer.

## Baseline and environment

- V2 comparison baseline: `9d33116f24d5f62b9ca562229ed573fbdb133c31`
- Network: GenLayer Studionet, chain `61999`
- RPC: `https://studio.genlayer.com/api`
- Local CLI: `genlayer@0.39.1`
- GenVM semantic validation target: `v0.2.12`

All authorisation reads use `LATEST_FINAL`. The SDK returns only
`APPROVED`, `DENIED`, `PENDING` or `UNAVAILABLE`; an RPC error, malformed
read, ordinary claim, unresolved Assured Claim or non-supported terminal state
cannot become approval.

## SDK

`packages/connect-sdk/` provides the local `@margin/connect` package with
strict TypeScript types, ESM/CJS exports and declarations. Its policy
commitment binds the MARGIN address, canonical consumer, claim key, canonical
URL, publisher and Covered evidence commitments. Release integration adds the
repository, exact commit and release-artifact SHA-256 binding.

The npm namespace was checked and no public `@margin/connect` package was
found. npm account ownership/authentication was not independently available
in this environment, so the package is not published and no publication is
claimed.

## GitHub Action

`actions/margin-release-gate/` is a distributable Node 24 JavaScript Action.
It checks repository identity, the exact evaluated commit and the SHA-256 of
the local release artifact before querying the SDK. The example workflows are
manual `workflow_dispatch` examples with `contents: read`; they do not use
`pull_request_target`, private keys or a backend verdict authority. Their
passing/blocking examples are integration examples until run in a repository
with a real immutable policy file and artifact.

## Reference Intelligent Contract

`contracts/margin_policy_gate.py` is separately deployable and non-custodial.
It stores an immutable policy, reads the existing MARGIN deployment directly,
requires the exact Covered commitments and `SETTLED / SUPPORTED` state, and
records a bounded one-time-per-action application state transition for its
owner. It has no release escrow, token transfer or alternative Covered Claim
capacity. Direct Mode tests cover approved, denied, pending, malformed,
unavailable and replayed cases; deployment evidence is recorded only after a
real finalized Studionet deployment.

## Signer integration workspace

The existing static signer keeps its V2 routes and injected EIP-1193 wallet
flow. `/integrations` is a read-only policy inspector for live finalized
reads, with explicit failure states and no transaction path. It is not an
external approval oracle and does not replace the extension-first experience.

## Adoption boundary

No independently maintained third-party application integration or maintainer
permission is claimed until a public repository and public CI run verify it.
The first-party SDK, Action and reference contract are the reproducible
integration surface; external adoption remains an explicit limitation unless
independently evidenced.
