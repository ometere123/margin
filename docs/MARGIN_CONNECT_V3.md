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

`packages/connect-sdk/` provides the local `@converts/margin-connect` package with
strict TypeScript types, ESM/CJS exports and declarations. Its policy
commitment binds the MARGIN address, canonical consumer, claim key, canonical
URL, publisher and Covered evidence commitments. Release integration adds the
repository, exact commit and release-artifact SHA-256 binding.

The authenticated npm account is `converts`, and the `@margin` organization is
not accessible to that account. The SDK is therefore released under the
authorized `@converts/margin-connect` scope; publication evidence is recorded
only after registry release and independent installation verification.

The current production dependency audit is clean (`npm audit --omit=dev`:
0 vulnerabilities). The remaining six workspace findings are development-only:
the pinned GenLayer `0.39.1` toolchain brings Dockerode 4 / UUID 10, and the
Node-20-compatible Vitest 3 test tooling has advisories whose supported fix is
Vitest 5 (Node 22.12+). Neither chain is included in the published SDK files
or the bundled Action runtime; the pinned CLI and Node 20+ repository support
were preserved rather than force-upgraded.

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
unavailable and replayed cases.

The reference gate was deployed without changing V2 at
`0xa2Eab1218E09b9d3B28390d4332643Cb3C29ecA1` in finalized transaction
`0x56a7e9bf2aa59fcbcfce02cfcf8de42bbd9cd7b4a627c0e56f501f71ca8350a5`.
The deployed source is byte-for-byte equal to
`contracts/margin_policy_gate.py` (13,809 UTF-8 bytes; SHA-256
`1fd89faff425c133e1cc9c34a65856b60e199a7d769cd10a1dfb411552e80ac3`). Its
`evaluate_policy` read returned `APPROVED` for the existing finalized V2
`SETTLED / SUPPORTED` claim, with canonical consumer
`0xD067556b32Ef7D9975d524B942344E4098724541`, and its owner-only
`perform` action finalized in transaction
`0x59608feba008b9868e88368040cf1bbfd7950e6416fa3f6b227c138046750353`.
The machine-readable record is
[`artifacts/margin_connect_v3_policy_gate.json`](../artifacts/margin_connect_v3_policy_gate.json).

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
independently evidenced. The final merged main verification is GitHub Actions
run [`39244609574`](https://github.com/ometere123/margin/actions/runs/39244609574)
on commit `eb7937c21a16feded049e85c8aca18f409eda493`; it passed the existing V2
checks together with the V3 SDK, Action, PolicyGate, typecheck, build,
mutation and browser-harness checks.
