# Current live validation

This file records only current deployment evidence. Older deployments, consumer addresses and transactions are in [`HISTORY.md`](HISTORY.md).

## Fixed environment

- Studionet
- Chain ID `61999`
- RPC `https://studio.genlayer.com/api`
- Local CLI `0.39.1`

## Current deployment readback

MARGIN V2 is `0x38a12Db824979A1E051792Cd322211FdB24473f3`, deployed by `0x6b7c5bd6ec5a458ce668e9908ac0c9111ec8dbbf90fdda8f281992ecc707f9e9`. Its source is commit `6798b2e748d7ef6f1e41538de4e33f84d9c7ae68`, SHA-256 `3A23F33952A35E3C848694887BB1C8D8DB03D3E1AEB10999F8A1518A9870BA12`, size 91,516 bytes. `network()` reads Studionet, chain `61999`, and the required RPC. Deployment finalized `MAJORITY_AGREE / SUCCESS`.

The current V2 consumer is `0xD067556b32Ef7D9975d524B942344E4098724541`, deployed by `0xbdc8d87ef3185dab1dfdd1103f1ba2a14dda4c1c2d47284eb737dd39f2692fa8`. Its source is commit `6798b2e748d7ef6f1e41538de4e33f84d9c7ae68`, SHA-256 `FBDC44E60CEAC4BFB0F63C8A6F4E78443382D6E6904BC33CE494AEC9C95DD9DA`, size 16,742 bytes. The constructor binding readback is `0x38a12Db824979A1E051792Cd322211FdB24473f3`; the canonical binding transaction is `0x3da7c5b731733ce69ac6dba9d4a3f91f074a465ddd3d6975aac80c9c4b14f77a`. Consumer deployment finalized `MAJORITY_AGREE / SUCCESS`.

The production signer project environment variables have been updated to those addresses, but its public deployment remains the prior verified build until a final deployment is intentionally initiated. The prior human browser run used the MDN Array.prototype.at page and the TC39 indexed-collections evidence URL; submission and resolution finalized with `SUPPORTED`, and exact re-anchoring, highlight, badge and provenance were observed against the prior final deployment. The transaction hashes were not committed, so they are not reproduced here.

## Current normal claim

Claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6` on the GenLayer architecture article was submitted in `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624` and resolved in `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`. Both finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is `SUPPORTED`, revision `1`. The final resolve emitted no nondeterministic storage-read warning.

## Protocol timing notes

- A resolver may call `resolve_assured_claim` immediately after a valid Assured challenge; waiting does not create a safety escape.
- `abort_stalled` requires the configured 24-hour resolution stall. A losing party cannot avoid adjudication merely by waiting briefly.
- An unresolved `APPEALED` claim cannot be settled using the pre-appeal verdict. After the stall, only the refunding abort path is available.
- Protected releases are pre-settlement commitments and the current consumer permits multiple independent releases per claim.

## Live evidence status

The superseded V2 checkpoints `V2-final-supported.json`, `V2-render-supported.json`, `V2-contradicted.json` and `V2-contradicted-strong.json` are historical and are not evidence for the final material-observation deployment. The earlier `final-v2-economic-contradicted.json` checkpoint is also historical. The new final-deployment checkpoints `final-v3-supported-20261017.json` and `final-v3-contradicted-fixed-20261017.json` are retained separately and completed authoritative post-deadline settlement/readback: both settled `INCONCLUSIVE`, refunded the protected release, and ended with zero MARGIN/consumer exposure. The primary human production normal browser flow passed. Only an optional manual Covered UI walkthrough is not claimed.
