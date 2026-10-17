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

The coverage cap is a bounded admission ceiling for aggregate active release
principal funded separately by integrators. It is not insurance, indemnity or a
promise that publisher collateral reimburses a release party. A supported
terminal result permits the consumer to credit a beneficiary; a negative
terminal result or permitted expiry credits the release creator. MARGIN's
publisher/challenger/appeal collateral remains governed by its dispute
settlement rules.

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
| Releases were not coupled to a claim-wide value ceiling | One canonical consumer, synchronous MARGIN exposure readback and `MarginConsumer.active_exposure_by_claim` checks | consumer Direct Mode integration; final stable-render SUPPORTED execution and CONTRADICTED refund |
| Arbitrary high-assurance evidence URLs | Derived publisher manifest URL and typed evidence pack | manifest validation tests; V2 live manifest readback |
| Mutable or oversized evidence could be silently truncated | bounded manifest/artifact policy, primary and evidence digest commitments | integrity mutation tests; earlier mismatch fail-closed plus final stable-render definitive paths |
| Ordinary annotations are advisory | explicit distinction between public annotation and Covered Claim | signer/assurance UI and documentation |

## Current limitations

V2 MARGIN is deployed on Studionet at
`0x38a12Db824979A1E051792Cd322211FdB24473f3` and the bound consumer is
`0xD067556b32Ef7D9975d524B942344E4098724541`. Earlier V2 Covered checkpoints
remain historical and the two `final-v3-*` checkpoints remain genuine
fail-closed `SETTLED / INCONCLUSIVE` evidence. The definitive final-deployment
stable-render checkpoints are separately recorded: one is `SETTLED /
SUPPORTED` with an executed release and one is `SETTLED / CONTRADICTED` with a
refunded release. Both end with zero MARGIN/consumer exposure and zero
post-withdrawal credits. The primary human browser record is historical; an
optional manual Covered UI walkthrough is not claimed.

## Local gate snapshot

At the latest local run, contract AST lint passed for both contracts, extension
tests passed `17/17`, signer tests passed `42/42`, Python invariants passed
`12/12`, Direct Mode passed `59/59`, and security mutations passed `15/15 killed`.
Extension and signer production builds
also passed. These are local results for this branch, not Studionet live
evidence. The repository-local CLI guard reports GenLayer `0.39.1`.
