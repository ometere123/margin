# Current live validation

This file records only current deployment evidence. Older deployments, consumer addresses and transactions are in [`HISTORY.md`](HISTORY.md).

## Fixed environment

- Studionet
- Chain ID `61999`
- RPC `https://studio.genlayer.com/api`
- Local CLI `0.39.1`

## Current deployment readback

MARGIN V2 is `0x4E0a75B63D913FC2d39A75F61905CA5973c77491`, deployed by `0xa6917d417dd63f683684acdfe7168c75bad1310172a79d0a91fed21835d5a617`. Its source is commit `ab5bbef32d046cf19e6621275485b57d4268ac87`, SHA-256 `A079E57EA831456721A6982FC5A4FB5B6AA77649D71EC3636BE44540292B41F1`, size 86,605 bytes. `network()` reads Studionet, chain `61999`, and the required RPC. Deployment finalized `MAJORITY_AGREE / SUCCESS`.

The current V2 consumer is `0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F`, deployed by `0x521f944b8274e4f4e5bfe151c3f9a6fdba0fd4f5f4f515dd8f98b5d7976ce01d`. Its source is commit `ab5bbef32d046cf19e6621275485b57d4268ac87`, SHA-256 `4060BFABA93A8B6BF90F6CDA6466D2066A7F1E1ED91036C1DB275047201DF6EC`, size 15,416 bytes. The constructor binding readback is `0x4E0a75B63D913FC2d39A75F61905CA5973c77491`. Consumer deployment finalized `MAJORITY_AGREE / SUCCESS`.

## Current normal claim

Claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6` on the GenLayer architecture article was submitted in `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624` and resolved in `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`. Both finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is `SUPPORTED`, revision `1`. The final resolve emitted no nondeterministic storage-read warning.

## Protocol timing notes

- A resolver may call `resolve_assured_claim` immediately after a valid Assured challenge; waiting does not create a safety escape.
- `abort_stalled` requires the configured 24-hour resolution stall. A losing party cannot avoid adjudication merely by waiting briefly.
- An unresolved `APPEALED` claim cannot be settled using the pre-appeal verdict. After the stall, only the refunding abort path is available.
- Protected releases are pre-settlement commitments and the current consumer permits multiple independent releases per claim.

## Live evidence status

Fresh final-deployment V2 evidence is recorded in `scripts/live/evidence/V2-final-supported.json`, `V2-render-supported.json`, `V2-contradicted.json` and `V2-contradicted-strong.json`. The render-matched fixture reached `SETTLED + SUPPORTED`, executed its pre-settlement release and completed beneficiary withdrawal. The strong contradiction reached `SETTLED + CONTRADICTED`, refunded its release and completed creator withdrawal. The integrity-mismatch and weak-contradiction fixtures reached `SETTLED + INCONCLUSIVE` and completed deterministic refunds/withdrawals. Each write is recorded as `FINALIZED / MAJORITY_AGREE / SUCCESS`, except the explicitly recorded first strong-fixture submit, which finalized with execution `ERROR` and rolled back without state change. The A/B/C JSON records under `scripts/live/evidence/` are historical V1 evidence and are not relabeled. Browser verification remains a manual track; optional/hostile browser checks remain unclaimed unless individually recorded.
