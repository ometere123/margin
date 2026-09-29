# Current live validation

This file records only current deployment evidence. Older deployments, consumer addresses and transactions are in [`HISTORY.md`](HISTORY.md).

## Fixed environment

- Studionet
- Chain ID `61999`
- RPC `https://studio.genlayer.com/api`
- Local CLI `0.39.1`

## Current deployment readback

MARGIN is `0x0f8D86d56F1b8997475dD048579807fBFe60e227`, deployed by `0x1f54fb2b8520008a8bf856906a695dd35f6835e28afdedf51bded400744abebd`. Its source is commit `826206bb1825cbcd716e0eb24288e91b8bc6d00a`, SHA-256 `6F5866BCEE5569C3BA0560E172F3FF524CF43F2A7A174189DB05CC03BD9FDEAF`, size 58,790 bytes. `network()` reads Studionet, chain `61999`, and the required RPC. Deployment finalized `MAJORITY_AGREE / SUCCESS`.

The current consumer is `0x388c762f777A10071A13063d71ed0B37CdE2d85a`, deployed by `0xddb1e2b791ccb550e3fcd7b5d1a4203956b8def764b7054310da12306e90ce0f`. Its source is commit `a4b72797e3bb8af617e0fb671bd5191937720cfa`, SHA-256 `C6D96DE8C78232EDA94B6A516341BE893A388F19088D9EDE4863645ACBC20DEF`, size 9,650 bytes. Finalized constructor calldata binds it to the current MARGIN address. Consumer deployment finalized `MAJORITY_AGREE / SUCCESS`.

## Current normal claim

Claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6` on the GenLayer architecture article was submitted in `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624` and resolved in `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`. Both finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is `SUPPORTED`, revision `1`. The final resolve emitted no nondeterministic storage-read warning.

## Protocol timing notes

- A resolver may call `resolve_assured_claim` immediately after a valid Assured challenge; waiting does not create a safety escape.
- `abort_stalled` requires the configured 24-hour resolution stall. A losing party cannot avoid adjudication merely by waiting briefly.
- An unresolved `APPEALED` claim cannot be settled using the pre-appeal verdict. After the stall, only the refunding abort path is available.
- Protected releases are pre-settlement commitments and the current consumer permits multiple independent releases per claim.

## Live evidence status

Fresh cancel, full Assured settlement, and funded protected-release transactions for the current deployment are not claimed until their time-based waits and canonical readbacks have actually completed. No browser automation was run by the agent; the human operator owns the browser matrix.
