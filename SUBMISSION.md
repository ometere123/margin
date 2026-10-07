# MARGIN current submission record

This file describes only the current canonical deployment. Historical deployment and transaction records are in [`docs/HISTORY.md`](docs/HISTORY.md).

## Network

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Repository-local CLI: `0.39.1`

## Current deployments

- MARGIN: [`0x4E0a75B63D913FC2d39A75F61905CA5973c77491`](https://explorer-studio.genlayer.com/address/0x4E0a75B63D913FC2d39A75F61905CA5973c77491)
- MARGIN deployment: [`0xa6917d417dd63f683684acdfe7168c75bad1310172a79d0a91fed21835d5a617`](https://explorer-studio.genlayer.com/tx/0xa6917d417dd63f683684acdfe7168c75bad1310172a79d0a91fed21835d5a617)
- MARGIN source commit: `ab5bbef32d046cf19e6621275485b57d4268ac87`
- MARGIN source SHA-256: `A079E57EA831456721A6982FC5A4FB5B6AA77649D71EC3636BE44540292B41F1`
- MARGIN deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Consumer: [`0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F`](https://explorer-studio.genlayer.com/address/0x11B5E8457C4Bf77B5F5dc19210FEdBBb7c3fB91F)
- Consumer deployment: [`0x521f944b8274e4f4e5bfe151c3f9a6fdba0fd4f5f4f515dd8f98b5d7976ce01d`](https://explorer-studio.genlayer.com/tx/0x521f944b8274e4f4e5bfe151c3f9a6fdba0fd4f5f4f515dd8f98b5d7976ce01d)
- Consumer source commit: `ab5bbef32d046cf19e6621275485b57d4268ac87`
- Consumer source SHA-256: `4060BFABA93A8B6BF90F6CDA6466D2066A7F1E1ED91036C1DB275047201DF6EC`
- Consumer source size: `15416` bytes
- Consumer constructor binding: final MARGIN address above
- Consumer deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`

## Production signer and release

- Signer: https://margin-signer.vercel.app/
- Production deployment: pending external Vercel rate limit; final configuration is verified in the local signer build
- Extension archive: `MARGIN-extension-v0.1.0.zip`
- Extension SHA-256: `29264999CA6202A184899EA3FBA0E4097BCE25088B88A602FC3622F114FB1079`
- Live fixture project: `a` (`prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz`)
- Live fixture production deployment: `dpl_DD43w22FgrutZMj15euqzPjaZR14`
- Live fixture URL: https://a-murex-one.vercel.app/

The signer uses the injected EIP-1193 wallet and the final configured V2 MARGIN address. Final Covered browser acceptance remains a manual operator task.

## Verification

- Contract lint: `3/3` for each contract
- Python invariants: `12/12`
- Direct Mode: `54/54` in the current local verification after the material-observation and citation tests
- Extension tests: `17/17`
- Signer tests: `33/33`
- Extension and signer builds: passed
- MARGIN source was not modified in this consumer-only round; its deployed SHA-256 remains unchanged.

## Fresh final-MARGIN normal evidence

- Claim: `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`
- Submit: `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`
- Resolve: `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`
- Both: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Canonical verdict: `SUPPORTED`

## Live evidence boundary

The material-observation V2 contract and bound consumer above are current. Final-deployment economic evidence is recorded only in the final checkpoint named below; prior V2 checkpoints are historical. The primary Covered browser acceptance remains manual.

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
