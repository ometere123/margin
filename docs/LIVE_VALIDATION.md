# Current live validation

This file records only current deployment evidence. Older deployments, consumer addresses and transactions are in [`HISTORY.md`](HISTORY.md).

## Fixed environment

- Studionet
- Chain ID `61999`
- RPC `https://studio.genlayer.com/api`
- Local CLI `0.39.1`

## Current deployment readback

MARGIN is `0x0f8D86d56F1b8997475dD048579807fBFe60e227`, deployed by `0x1f54fb2b8520008a8bf856906a695dd35f6835e28afdedf51bded400744abebd`. Its source is commit `826206bb1825cbcd716e0eb24288e91b8bc6d00a`, SHA-256 `6F5866BCEE5569C3BA0560E172F3FF524CF43F2A7A174189DB05CC03BD9FDEAF`, size 58,790 bytes. `network()` reads Studionet, chain `61999`, and the required RPC. Deployment finalized `MAJORITY_AGREE / SUCCESS`.

The current consumer is `0x603FF16d4ba5d9Ac8bb66af8fF6869EbFA272254`, deployed by `0x54fdeda4f6f0f4e3c5af9adf4eb3a1955757d818c83bdd51e8271e418c82bac6`. Its source is commit `944994949655e994a7909777b079409750607a75`, SHA-256 `8CF090D85013415BB0FFADAB74E900C40029F38F0B5ED54E84AA79D6FB70DDD7`, size 11,496 bytes. Finalized constructor calldata binds it to the current MARGIN address. Consumer deployment finalized `MAJORITY_AGREE / SUCCESS`.

## Current normal claim

Claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6` on the GenLayer architecture article was submitted in `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624` and resolved in `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`. Both finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is `SUPPORTED`, revision `1`. The final resolve emitted no nondeterministic storage-read warning.

## Protocol timing notes

- A resolver may call `resolve_assured_claim` immediately after a valid Assured challenge; waiting does not create a safety escape.
- `abort_stalled` requires the configured 24-hour resolution stall. A losing party cannot avoid adjudication merely by waiting briefly.
- An unresolved `APPEALED` claim cannot be settled using the pre-appeal verdict. After the stall, only the refunding abort path is available.
- Protected releases are pre-settlement commitments and the current consumer permits multiple independent releases per claim.

## Live evidence status

Fresh cancel, full Assured settlement, and funded protected-release transactions for the current deployment are not claimed until their time-based waits and canonical readbacks have actually completed. No browser automation was run by the agent; the human operator owns the browser matrix.
