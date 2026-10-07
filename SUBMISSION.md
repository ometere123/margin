# MARGIN current submission record

This file describes only the current canonical deployment. Historical deployment and transaction records are in [`docs/HISTORY.md`](docs/HISTORY.md).

## Network

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Repository-local CLI: `0.39.1`

## Current deployments

- MARGIN: [`0x03197B3246a5BF0C28fad07c4E5868F52c601580`](https://explorer-studio.genlayer.com/address/0x03197B3246a5BF0C28fad07c4E5868F52c601580)
- MARGIN deployment: [`0x84a4b0a159205e4ba2be9c913a9d3698cb43d5bbcfe66502f24093b50fc67250`](https://explorer-studio.genlayer.com/tx/0x84a4b0a159205e4ba2be9c913a9d3698cb43d5bbcfe66502f24093b50fc67250)
- MARGIN source commit: `54605dae812afca03a0f9b2dacaf91e23ccdac95`
- MARGIN source SHA-256: `F880EA25C950135FE51BBABFD9DF84C408B490216D9B4A8263638660EC6D7B01`
- MARGIN deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Consumer: [`0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`](https://explorer-studio.genlayer.com/address/0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24)
- Consumer deployment: [`0xebc599b8d667f6fc39787057cf261273f24a566a60f62d194e5c0821365a3ba3`](https://explorer-studio.genlayer.com/tx/0xebc599b8d667f6fc39787057cf261273f24a566a60f62d194e5c0821365a3ba3)
- Consumer source commit: `54605dae812afca03a0f9b2dacaf91e23ccdac95`
- Consumer source SHA-256: `4060BFABA93A8B6BF90F6CDA6466D2066A7F1E1ED91036C1DB275047201DF6EC`
- Consumer source size: `15416` bytes
- Consumer constructor binding: final MARGIN address above
- Consumer deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`

## Production signer and release

- Signer: https://margin-signer.vercel.app/
- Production deployment: `dpl_99CS5PiZNHKfkwgqmzBNBVYmC3QL`
- Extension archive: `MARGIN-extension-v0.1.0.zip`
- Extension SHA-256: `A1121399097C9F5D425C41BDE718453D587BEE9F15A459A97DA14DF508625803`
- Live fixture project: `a` (`prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz`)
- Live fixture production deployment: `dpl_DD43w22FgrutZMj15euqzPjaZR14`
- Live fixture URL: https://a-murex-one.vercel.app/

The signer uses the injected EIP-1193 wallet and the final configured V2 MARGIN address. A fresh V2 browser flow remains manual and is not claimed here.

## Verification

- Contract lint: `3/3` for each contract
- Python invariants: `12/12`
- Direct Mode: `51/51` in the current local verification after the Covered Claim test pass
- Extension tests: `17/17`
- Signer tests: `31/31`
- Extension and signer builds: passed
- MARGIN source was not modified in this consumer-only round; its deployed SHA-256 remains unchanged.

## Fresh final-MARGIN normal evidence

- Claim: `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`
- Submit: `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`
- Resolve: `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`
- Both: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Canonical verdict: `SUPPORTED`

## Live evidence boundary

The V2 contract and consumer deployments above are current. The fresh V2 Covered Claim lifecycle and three follow-up attempts are recorded in `scripts/live/evidence/`: each pre-settlement release reached a genuine `SETTLED + INCONCLUSIVE` integrity outcome, was refunded, and all credits were withdrawn. No positive V2 `SUPPORTED` protected-release execution is claimed. The older A/B/C records remain historical and are not V2 evidence. The primary human browser flow recorded above belongs to the previous canonical deployment and is not claimed as V2 proof.

## Live sequence labels

- **A — Normal-resolve-first Assured lifecycle:** submit, normal resolve, register, challenge, assured resolve, wait the appeal window, settle, withdraw.
- **B — Protected release:** create the release before settlement, settle `SUPPORTED`, execute, beneficiary withdraw.
- **C — Cancellation:** register, wait the 24-hour challenge window, cancel, withdraw.

## Primary human browser proof

- Status: `PASS`
- Run by: human operator
- Claim: `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33`
- Source: https://www.sqlite.org/serverless.html
- Observed: capture, signer handoff, Studionet 61999 connection, finalized submission, finalized resolution, `SUPPORTED`, exact re-anchor, highlight, visible `M · SUPPORTED` badge, refresh persistence, extension provenance/details, full provenance route, direct claim route and assurance route.
- The SQLite claim was a normal claim only; no Assured lifecycle was executed for it.

### MANUAL BROWSER STATUS

`PRIMARY HUMAN BROWSER FLOW: PASS`
