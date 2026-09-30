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
- Consumer: [`0x6Bdb12646e054C24b68012560F7472636b395881`](https://explorer-studio.genlayer.com/address/0x6Bdb12646e054C24b68012560F7472636b395881)
- Consumer deployment: [`0x10f861aa287fe9ce0b4dbbacd95fc51cacb14539516d62f9bd6331495609ff0d`](https://explorer-studio.genlayer.com/tx/0x10f861aa287fe9ce0b4dbbacd95fc51cacb14539516d62f9bd6331495609ff0d)
- Consumer source commit: `66b2e2a492bc343df6369c8f6b4779fcb79a128c`
- Consumer source SHA-256: `FBCF9882250D640008B778F0486BDA3FCC892886270704ACB26DFADD2B7FF465`
- Consumer source size: `12869` bytes
- Consumer constructor binding: final MARGIN address above
- Consumer deployment result: `FINALIZED / MAJORITY_AGREE / SUCCESS`

## Production signer and release

- Signer: https://margin-signer.vercel.app/
- Production deployment: `dpl_BYeZLjjx3zP3sUqNZ4jJy1nSuBvh`
- Extension archive: `MARGIN-extension-v0.1.0.zip`
- Extension SHA-256: `15E858358D5F570FD6D965A8E3D6A9F8E26C95DB13FF86F28F6A7BEB4A9D0201`
- Live fixture project: `a` (`prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz`)
- Live fixture production deployment: `dpl_3kz8DchYDXPcowansu1amK5gYtfY`
- Live fixture URL: https://a-murex-one.vercel.app/

The signer uses the injected EIP-1193 wallet and the final configured MARGIN address. The primary browser flow was run successfully by the human operator; browser automation was not run by the agent.

## Verification

- Contract lint: `3/3` for each contract
- Python invariants: `12/12`
- Direct Mode: `43/43` in the current local verification after the consensus trust-boundary test pass
- Extension tests: `17/17`
- Signer tests: `30/30`
- Extension and signer builds: passed
- MARGIN source was not modified in this consumer-only round; its deployed SHA-256 remains unchanged.

## Fresh final-MARGIN normal evidence

- Claim: `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6`
- Submit: `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624`
- Resolve: `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`
- Both: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Canonical verdict: `SUPPORTED`

## Live evidence boundary

The consumer deployment and fresh non-browser evidence above are current. Sequences A and B are recorded in `scripts/live/evidence/` with finalized receipts and canonical readbacks; sequence C is registered and pending its real cancellation window. The human browser matrix is not claimed.

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
- Agent browser automation: `NOT RUN`

### MANUAL BROWSER STATUS

`PRIMARY HUMAN BROWSER FLOW: PASS`

`AGENT BROWSER AUTOMATION: NOT RUN`
