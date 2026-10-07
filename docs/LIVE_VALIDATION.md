# Current live validation

This file records only current deployment evidence. Older deployments, consumer addresses and transactions are in [`HISTORY.md`](HISTORY.md).

## Fixed environment

- Studionet
- Chain ID `61999`
- RPC `https://studio.genlayer.com/api`
- Local CLI `0.39.1`

## Current deployment readback

MARGIN V2 is `0x03197B3246a5BF0C28fad07c4E5868F52c601580`, deployed by `0x84a4b0a159205e4ba2be9c913a9d3698cb43d5bbcfe66502f24093b50fc67250`. Its source is commit `54605dae812afca03a0f9b2dacaf91e23ccdac95`, SHA-256 `F880EA25C950135FE51BBABFD9DF84C408B490216D9B4A8263638660EC6D7B01`, size 80,340 bytes. `network()` reads Studionet, chain `61999`, and the required RPC. Deployment finalized `MAJORITY_AGREE / SUCCESS`.

The current V2 consumer is `0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`, deployed by `0xebc599b8d667f6fc39787057cf261273f24a566a60f62d194e5c0821365a3ba3`. Its source is commit `54605dae812afca03a0f9b2dacaf91e23ccdac95`, SHA-256 `4060BFABA93A8B6BF90F6CDA6466D2066A7F1E1ED91036C1DB275047201DF6EC`, size 15,416 bytes. The constructor binding readback is `0x03197B3246a5BF0C28fad07c4E5868F52c601580`. Consumer deployment finalized `MAJORITY_AGREE / SUCCESS`.

## Current normal claim

Claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6` on the GenLayer architecture article was submitted in `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624` and resolved in `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`. Both finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is `SUPPORTED`, revision `1`. The final resolve emitted no nondeterministic storage-read warning.

## Protocol timing notes

- A resolver may call `resolve_assured_claim` immediately after a valid Assured challenge; waiting does not create a safety escape.
- `abort_stalled` requires the configured 24-hour resolution stall. A losing party cannot avoid adjudication merely by waiting briefly.
- An unresolved `APPEALED` claim cannot be settled using the pre-appeal verdict. After the stall, only the refunding abort path is available.
- Protected releases are pre-settlement commitments and the current consumer permits multiple independent releases per claim.

## Live evidence status

The fresh V2 Covered lifecycle is recorded in `scripts/live/evidence/V2-covered.json` and `V2-covered.md`. It includes normal resolution, Covered registration, a pre-settlement protected release, challenge, Assured resolution, the real appeal wait, settlement, refund and withdrawals. The canonical result was `SETTLED + INCONCLUSIVE` because the accepted primary observation digest differed from the precommitted primary artifact digest; no positive `SUPPORTED` release execution is claimed. The A/B/C JSON records under `scripts/live/evidence/` are historical V1 evidence and are not relabeled. The primary human browser flow recorded in the V1 handoff is not claimed as V2 proof. Optional/hostile browser checks remain unclaimed unless individually recorded.
