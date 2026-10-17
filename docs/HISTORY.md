# MARGIN historical evidence

These records are retained for auditability only. None of the deployments or transactions below is current evidence for the final MARGIN address in `SUBMISSION.md`.

## Superseded deployments

- Original MARGIN: `0x03fE368186822d745b4DB8e4A49f8F43e867D57C`, deployment `0xde6118bd3f5208c0b01f99ba085c7630e8fefc20811b3cd807d2b69e285082e9`.
- Prior consumer-bound deployment: MARGIN `0x2a22f117bB61f6a123AfA794710cD2D13844Ff6A`, consumer `0x92b0c63c09c2b97aC2b2c2C5b09143cFfd94Fa6D`.
- Warning-fix deployment: MARGIN `0xA188e8314AeEd0C31060725b00bEd20D1feBca19`, consumer `0xb14dBe36C33D716018c343a5E589471A2c0F644C`.
- Previous consumer before multi-release support: `0x3Bc6566Adf5d57d427d73CdDa89b6d105e6A3b5F`, bound to MARGIN `0x0f8D86d56F1b8997475dD048579807fBFe60e227`.

## Historical live records

Earlier normal, Assured, appeal, settlement, withdrawal and consumer transactions remain in `deployment.json` under `historicalEvidence`. They are deliberately not repeated as current evidence in `SUBMISSION.md` or `docs/LIVE_VALIDATION.md`.

The historical consumer path included the former single-release implementation. The current consumer uses `get_releases_for_claim` and preserves every funded release ID.

## Historical browser boundary

Earlier browser annotation and wallet evidence belongs to superseded deployments. The deterministic browser harness is automated; production-wallet browser evidence remains separately labelled as human/manual evidence and is not inferred from the harness.

## Final closeout evidence boundary

The earlier final-deployment `final-v3-supported-20261017.json` and
`final-v3-contradicted-fixed-20261017.json` records remain historical
fail-closed `INCONCLUSIVE` outcomes caused by the committed/runtime primary
render-digest mismatch. The definitive stable-render checkpoints are recorded
in `deployment.json` and linked from `SUBMISSION.md`. The separate
`final-stable-contradicted-20261017-resume-failure.json` file records a
finalized execution-error duplicate tracking attempt with no state mutation; it
is not part of the definitive lifecycle sequence.
