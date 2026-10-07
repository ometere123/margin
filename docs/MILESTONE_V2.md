# MARGIN V2 — Covered Claims

## Baseline

MARGIN V1 baseline: `0de81fc659b16b82d35e19c22bd2c3972df95b1c`.

The V1 baseline was verified on Studionet (`61999`) before this milestone
branch was created. The existing ordinary annotation, Assured Claim, signer,
extension, and consumer flows remain compatibility surfaces for V2.

## Scope of this milestone

Covered Claims add a bounded high-assurance path alongside ordinary public
annotations. A Covered Claim binds a publisher-controlled, claim-specific
manifest to an immutable evidence-pack digest and requires publisher
collateral to cover the declared protected-value ceiling. The consumer tracks
active protected exposure per claim and rejects releases that would exceed the
canonical coverage cap.

The ordinary annotation path remains permissionless and is not described as
financial assurance.

## Verification boundary

The status (`SUPPORTED`, `CONTRADICTED`, `INCONCLUSIVE`, or `STALE`) remains
the committee-consensus decision. The rationale, accepted observation manifest,
and cited source indexes are stored as accepted-proposal provenance; they are
not represented as byte-identical natural-language agreement by every
validator.

Covered evidence uses deterministic manifest identity, typed authority profiles,
bounded complete artifacts, a primary-artifact SHA-256 commitment, and expected
evidence SHA-256 commitments. Semantic adjudication remains separate from
deterministic URL, hash, collateral, and state-transition checks. A Covered
Claim's manifest and evidence pack are independently checked again during each
Covered adjudication; a changed, unavailable or oversized committed artifact
cannot produce a definitive `SUPPORTED` or `CONTRADICTED` result.

## V1 → V2 traceability

| V1 limitation | V2 change | Test/live proof |
| --- | --- | --- |
| Fixed one-unit assurance did not cover arbitrary protected value | Covered Claim `coverage_cap` and full publisher collateral | `tests/direct/test_covered_claims.py`; V2 live pre-settlement release and settlement readback |
| Releases were not coupled to a claim-wide value ceiling | `MarginConsumer.active_exposure_by_claim` and coverage checks | consumer Direct Mode integration; V2 live release refunded after `INCONCLUSIVE` |
| Arbitrary high-assurance evidence URLs | Derived publisher manifest URL and typed evidence pack | manifest validation tests; V2 live manifest readback |
| Mutable or oversized evidence could be silently truncated | bounded manifest/artifact policy, primary and evidence digest commitments | integrity mutation tests; V2 live primary-observation mismatch produced `INCONCLUSIVE` |
| Ordinary annotations are advisory | explicit distinction between public annotation and Covered Claim | signer/assurance UI and documentation |

## Current limitations

V2 MARGIN is deployed on Studionet at
`0x03197B3246a5BF0C28fad07c4E5868F52c601580` and the bound consumer is
`0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`. The production signer has been
rebuilt for those addresses. A fresh V2 Covered Claim lifecycle, including a
pre-settlement release, real appeal wait, `SETTLED + INCONCLUSIVE` integrity
outcome, refund and credit withdrawals, is recorded in
`scripts/live/evidence/V2-covered.json`. A positive `SUPPORTED` protected
release execution and a V2 browser run remain outstanding; the earlier A/B/C
evidence is historical V1 evidence and is not relabeled.

## Local gate snapshot

At the latest local run, contract AST lint passed for both contracts, extension
tests passed `17/17`, signer tests passed `31/31`, Python invariants passed
`12/12`, and Direct Mode passed `51/51`. Extension and signer production builds
also passed. These are local results for this branch, not Studionet live
evidence. The repository-local CLI guard reports GenLayer `0.39.1`.
