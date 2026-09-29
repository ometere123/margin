# MARGIN current submission record

This file describes only the current canonical deployment. Historical deployment and transaction records are in [`docs/HISTORY.md`](docs/HISTORY.md).

## Network

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Repository-local CLI: `0.39.1`

## Current deployments

- MARGIN: [`0x0f8D86d56F1b8997475dD048579807fBFe60e227`](https://explorer-studio.genlayer.com/address/0x0f8D86d56F1b8997475dD048579807fBFe60e227)
- MARGIN deployment: [`0x1f54fb2b8520008a8bf856906a695dd35f6835e28afdedf51bded400744abebd`](https://explorer-studio.genlayer.com/tx/0x1f54fb2b8520008a8bf856906a695dd35f6835e28afdedf51bded400744abebd)
- MARGIN source commit: `826206bb1825cbcd716e0eb24288e91b8bc6d00a`
- MARGIN source SHA-256: `6F5866BCEE5569C3BA0560E172F3FF524CF43F2A7A174189DB05CC03BD9FDEAF`
- MARGIN deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Consumer: [`0x7c447BAEaf5ae60Cec2d432BA33860375fEB9994`](https://explorer-studio.genlayer.com/address/0x7c447BAEaf5ae60Cec2d432BA33860375fEB9994)
- Consumer deployment: [`0x97b94e7f7e730a3bf14f4488bc37172f29a33480c5483fdc0ddbb32289092294`](https://explorer-studio.genlayer.com/tx/0x97b94e7f7e730a3bf14f4488bc37172f29a33480c5483fdc0ddbb32289092294)
- Consumer source commit: `b18351d`
- Consumer source SHA-256: `1205EAA5BFC7E4377D03C853B70B334F0575D8664E6B9EDD4FF9940499F13BD4`
- Consumer source size: `9804` bytes
- Consumer constructor binding: final MARGIN address above
- Consumer deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`

## Production signer and release

- Signer: https://margin-signer.vercel.app/
- Production deployment: `dpl_HB5ctN9t8KYg71fBedAST6yGvGAC`
- Extension archive: `MARGIN-extension-v0.1.0.zip`
- Extension SHA-256: `109C2CA42B85DEE0AC1AAAD7DE6F3996DE4B00D56DD334C00C7440BACC4EF3AB`

The signer uses the injected EIP-1193 wallet and the final configured MARGIN address. No browser automation was run by the agent.

## Verification

- Contract lint: `3/3` for each contract
- Python invariants: `12/12`
- Direct Mode: `30/30` in the current CI run after this consumer change
- Extension tests: `16/16`
- Signer tests: `27/27`
- Extension and signer builds: passed
- MARGIN source was not modified in this consumer-only round; its deployed SHA-256 remains unchanged.

## Fresh final-MARGIN normal evidence

- Claim: `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`
- Submit: `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`
- Resolve: `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`
- Both: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Canonical verdict: `SUPPORTED`

## Live evidence boundary

The consumer deployment and non-browser normal evidence above are current. The requested fresh cancel, full Assured, and funded protected-release lifecycles require real time-based waits and additional state-changing transactions; they are not claimed until executed. The human browser matrix is also not claimed.

### MANUAL BROWSER STATUS

`NOT RUN BY AGENT`
