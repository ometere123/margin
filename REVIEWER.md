# MARGIN reviewer path

This is a short, evidence-first review path for the current Studionet release.

1. Install dependencies with `npm ci`.
2. Confirm the pinned toolchain with `npm run cli` and `npm exec -- genlayer --version`; both must report GenLayer CLI `0.39.1`.
3. Run `npm run verify` for TypeScript checks, extension/signer tests, Python invariants and both builds.
4. Run `npm run test:direct` from an Ubuntu/WSL environment for the Direct Mode suite. The Windows native Direct Mode runner has a known temporary-file locking limitation; CI runs this same suite on Ubuntu.
5. Inspect [`deployment.json`](deployment.json) for the current Studionet contract, consumer binding, deployment transactions and source hash. Historical deployments are retained below the current record and are not current evidence.
6. Open [`https://margin-signer.vercel.app/`](https://margin-signer.vercel.app/) and inspect `/claim/<claim-key>` for a finalized claim read directly from the V2 MARGIN deployment. The signer has no backend and uses the injected EIP-1193 wallet only for writes.
7. Load `extension/dist` as an unpacked MV3 extension, open a public page, highlight a narrow technical claim and choose **Challenge with MARGIN**. The extension opens `/challenge?draft=...`; it does not hold wallet controls.
8. For the complete manual browser and Assured Claim matrix, follow [`docs/MANUAL_BROWSER_VERIFICATION.md`](docs/MANUAL_BROWSER_VERIFICATION.md). It is an observation checklist, not recorded live evidence.
9. For a read-only current deployment check, run `npm run live:read` or `npm run live:read -- --claim=<64-hex-claim-key>`. This verifies `network()` at `LATEST_FINAL` and optionally reads a claim; it performs no writes. The consumer binding is verified from deployment construction calldata because the bound storage field is not exposed as a callable public view in this SDK path.
10. Read [`docs/SELF_REVIEW.md`](docs/SELF_REVIEW.md) for the evidence-only limitations across GenLayer fit, contract quality, engineering and frontend/UX.

## Claims-to-evidence map

| Claim | Evidence |
| --- | --- |
| Finalized claim state is canonical | `get_claim(..., LATEST_FINAL)` in signer and Direct Mode tests |
| Validator observations need not be byte-identical | `_consensus_candidate_is_valid` tests in `tests/direct/test_margin.py` |
| Revision griefing is bounded | normal three-slot/cooldown and reserved Assured-slot tests |
| Assured lifecycle is bonded and bounded | Direct Mode lifecycle and appeal tests; `deployment.json` live records |
| Consumer uses canonical MARGIN state | bound-address test and `MarginGate` implementation in `contracts/margin_consumer.py` |
| Multiple funded releases cannot hide one another | `get_releases_for_claim` implementation and real-MARGIN SimEngine integration in `tests/direct/test_consumer_integration.py` |
| Per-creator release spam is bounded without blocking other creators | `test_protected_release_cap_is_per_creator_and_pagination_is_bounded` |
| Per-creator cap is five and creators remain independent | `test_protected_release_cap_is_per_creator_and_pagination_is_bounded`; `test_real_margin_two_creators_have_independent_releases` (Direct Mode only) |
| Claim-wide indexes are bounded and creator queries paginate | `test_protected_release_cap_is_per_creator_and_pagination_is_bounded`; creator-query assertions in consumer integration (Direct Mode only) |
| Negative release outcomes refund exactly once | real-MARGIN integration tests for CONTRADICTED, INCONCLUSIVE, STALE, CANCELLED, ABORTED and expiry |
| CONTRADICTED / INCONCLUSIVE / STALE refund paths | `test_real_margin_negative_terminal_release_refund_and_conservation` (parameterized; Direct Mode only) |
| CANCELLED and ABORTED refund paths | `test_real_margin_cancelled_and_aborted_release_refunds` (Direct Mode only) |
| Expiry refund path | `test_real_margin_unresolved_release_expires_and_refunds` (Direct Mode only) |
| Bond conservation is explicit | MARGIN lifecycle assertions in `tests/direct/test_margin.py` |
| Bond conservation for SUPPORTED, INCONCLUSIVE and STALE | `test_assured_settlement_conserves_bonds_for_supported_inconclusive_and_stale` (new parameterized Direct Mode test) |
| Bond conservation for CONTRADICTED | `test_assured_claim_domain_proof_and_bond_lifecycle` (Direct Mode only) |
| Bond conservation for cancellation and abort | `test_publisher_can_cancel_unchallenged_assured_claim_once`; `test_stalled_challenge_can_abort_and_refund_both_bonds` (Direct Mode only) |
| Bond conservation for publisher and challenger appeals | `test_publisher_appeal_conserves_and_withdraws_all_bonds`; `test_appealed_timeout_has_only_abort_refund_exit` (Direct Mode only) |
| Protected release is pre-settlement and pull-paid | consumer lifecycle tests, `create_protected_release`, `execute_release`, `refund_release` and `withdraw_release_credit` |
| Covered Claim requires a publisher-controlled derived manifest and typed evidence pack | `tests/direct/test_covered_claims.py`; `_validate_covered_manifest` and derived `/.well-known/margin/claims/<claim>.json` path |
| Covered evidence binds complete primary/evidence artifact digests | `test_covered_claim_requires_primary_artifact_commitment`; `test_covered_claim_digest_mismatch_is_not_definitively_supported` |
| Covered collateral and challenge economics are value-coupled | `test_covered_claim_collateral_and_exposure`; covered registration checks in `tests/direct/test_covered_claims.py` |
| Current consumer deployment is bound correctly | current consumer deployment calldata, address and source SHA-256 in `deployment.json` |
| Resolver cannot escape by waiting briefly | `abort_stalled` timeout tests and timing notes in `docs/LIVE_VALIDATION.md` |
| Wallet signing is ordinary EIP-1193 | signer wallet tests and source review; no Snap methods |
| Browser annotation is extension-first | extension anchor/badge tests; current browser matrix remains manual and `NOT RUN BY AGENT` |
| V2 live sequence A — Covered lifecycle | Not yet run against V2; prior `scripts/live/evidence/A.*` is historical V1 evidence |
| V2 live sequence B — Covered protected release | Not yet run against V2; prior `scripts/live/evidence/B.*` is historical V1 evidence |
| V2 live sequence C — Covered cancellation | Not yet run against V2; prior `scripts/live/evidence/C.*` is historical V1 evidence |

The current release uses Studionet chain `61999`, RPC `https://studio.genlayer.com/api`, and the addresses recorded in `deployment.json`. Browser, wallet and live lifecycle claims remain limited to the transactions and manual checks explicitly recorded there and in `docs/LIVE_VALIDATION.md`.
