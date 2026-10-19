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

The production signer project environment variables are configured for those addresses. GitHub-triggered signer deployment `dpl_6iwqfSVyQCwAaZY3GkpsqyMQiUTw` reached `READY / production / PROMOTED` for commit `84a725dbe3cc89293a60df13809ffa9376080c25`; its public bundle contains both canonical addresses and neither superseded address. A read-only browser visit to the final supported Covered claim route showed `SUPPORTED`, `FINALIZED`, Studionet `61999` and canonical provenance. The earlier human browser run used the MDN Array.prototype.at page and the TC39 indexed-collections evidence URL; its transaction hashes and deployment identity were not committed, so that run remains historical and is not re-attributed to the closeout signer release.

## Current normal claim

Claim `99bbd4ea502c2b56341ec9ba9c08cacbede75d8f1e32e8964b65ec4bec63ebc6` on the GenLayer architecture article was submitted in `0x6db1814f354f8661a9b298af563ee4e2c3b75277ce46df376baaa3987d4da624` and resolved in `0x18fff3266f76cf0c648ba17767bb031bf5536851e6615b436d2a8a7ce448c7ee`. Both finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is `SUPPORTED`, revision `1`. The final resolve emitted no nondeterministic storage-read warning.

## Protocol timing notes

- A resolver may call `resolve_assured_claim` immediately after a valid Assured challenge; waiting does not create a safety escape.
- `abort_stalled` requires the configured 24-hour resolution stall. A losing party cannot avoid adjudication merely by waiting briefly.
- An unresolved `APPEALED` claim cannot be settled using the pre-appeal verdict. After the stall, only the refunding abort path is available.
- Protected releases are pre-settlement commitments and the current consumer permits multiple independent releases per claim.

## Live evidence status

The superseded V2 checkpoints `V2-final-supported.json`, `V2-render-supported.json`, `V2-contradicted.json` and `V2-contradicted-strong.json` are historical and are not evidence for the final material-observation deployment. The earlier `final-v2-economic-contradicted.json` checkpoint is also historical. The final-deployment `final-v3-supported-20261017.json` and `final-v3-contradicted-fixed-20261017.json` checkpoints remain genuine fail-closed `INCONCLUSIVE` evidence after post-deadline settlement/readback. The definitive stable-render checkpoints are [`final-stable-supported-20261017-retry.json`](../scripts/live/evidence/final-stable-supported-20261017-retry.json) and [`final-stable-contradicted-20261017.json`](../scripts/live/evidence/final-stable-contradicted-20261017.json), with summaries in the adjacent Markdown files. The supported path settled `SUPPORTED` and executed the release; the contradicted path settled `CONTRADICTED` and refunded the release. Both ended with zero MARGIN/consumer exposure and zero post-withdrawal credits. The primary human production normal browser flow is a separate historical record; an optional manual Covered UI walkthrough is not claimed.

## Definitive final-deployment Covered evidence

- Supported claim `bd9a74117d96a75f9ffea9402defbb18067d64fcd12356ac1fa77eea30d7349e`: rendered primary digest `e5866f8a9d2c905e3251a3ee53e26c37d5a9a780756a57c896a7fb9decab33c2`; `SETTLED / SUPPORTED`; release `2:bd9a...7349e` executed; MARGIN and consumer exposure `0`; release beneficiary, publisher and challenger credits `0` after withdrawal. Full transaction sequence: [`final-stable-supported-20261017.md`](../scripts/live/evidence/final-stable-supported-20261017.md).
- Contradicted claim `db4fca64e939f315e5e78f20c563b19adf11d592ca134a8a9e6f24d652ab617b`: rendered primary digest `a0f9e483c7fc425dafa70a775f1d1b9c125e600eaf39349d4498902a33ae0e51`; `SETTLED / CONTRADICTED`; release `3:db4f...617b` refunded; MARGIN and consumer exposure `0`; release creator, publisher and challenger credits `0` after withdrawal. Full transaction sequence: [`final-stable-contradicted-20261017.md`](../scripts/live/evidence/final-stable-contradicted-20261017.md).

Both sequences waited for the actual appeal deadline and every claimed successful write finalized as `FINALIZED / MAJORITY_AGREE / SUCCESS`. The raw HTTP page digest and the GenVM-rendered primary digest are intentionally recorded as separate commitments.

## V3 live-evidence boundary

The V3 SDK and reference PolicyGate do not change the V2 lifecycle above. The
separate PolicyGate deployment is
`0xa2Eab1218E09b9d3B28390d4332643Cb3C29ecA1`, deployment transaction
`0x56a7e9bf2aa59fcbcfce02cfcf8de42bbd9cd7b4a627c0e56f501f71ca8350a5`, with
byte-for-byte source parity at SHA-256
`1fd89faff425c133e1cc9c34a65856b60e199a7d769cd10a1dfb411552e80ac3`. Its
finalized `evaluate_policy` read returned `APPROVED` for the existing V2
`SETTLED / SUPPORTED` Covered Claim, and its owner-only action finalized in
`0x59608feba008b9868e88368040cf1bbfd7950e6416fa3f6b227c138046750353`.
The machine-readable receipt and readback are in
[`artifacts/margin_connect_v3_policy_gate.json`](../artifacts/margin_connect_v3_policy_gate.json).

The merged-main verification is GitHub Actions run
[`39262301297`](https://github.com/ometere123/margin/actions/runs/39262301297)
on `a275be880c508a54c0796b709a0cbf6e5b123fdb`. The official SDK migration
target is [`@margin-connect/sdk@0.1.0`](https://www.npmjs.com/package/@margin-connect/sdk);
its clean external ESM/CJS installation is a release gate after publication.
The prior `@converts/margin-connect@0.1.0` release is historical migration
evidence. No external maintainer adoption or production `/integrations`
approval is claimed. A local Direct Mode result is not presented as live
consensus evidence.
