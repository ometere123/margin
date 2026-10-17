# Final deployment Covered lifecycle — SUPPORTED

- Network: Studionet 61999 (`https://studio.genlayer.com/api`)
- MARGIN: `0x38a12Db824979A1E051792Cd322211FdB24473f3`
- Canonical consumer: `0xD067556b32Ef7D9975d524B942344E4098724541`
- Claim key: `bd9a74117d96a75f9ffea9402defbb18067d64fcd12356ac1fa77eea30d7349e`
- Primary rendered digest: `e5866f8a9d2c905e3251a3ee53e26c37d5a9a780756a57c896a7fb9decab33c2`
- Evidence digest: `ff840f3812095e56a5a7458d9a2fb1411767bf7a4b50ae2eab0f6a73f304a248`

Every listed transaction finalized with `FINALIZED / MAJORITY_AGREE / SUCCESS`:

| Operation | Transaction |
|---|---|
| Submit claim | `0xea27e86421e62e9ddce612dd3302fb8d2b408e679a88ec480e909fc279a27ad6` |
| Resolve normal claim | `0xe8a66b8f8f9e1ed20f4f0b8d4afe85b6fec250e5bf01f01604053e806f2b3cdf` |
| Register Covered Claim | `0xffe51aed5c59c36c2a93af4fd898ccc539b90bb4306f97aa01d379a530451d27` |
| Create protected release | `0xbd7948e9cbd42c161546857b604b2a4e35b717e9721931a26b2c13d607c36be3` |
| Challenge | `0x799ae226a0529736204fe1e72a56013163c768baa3772c506601504248787325` |
| Resolve Assured Claim | `0x4574387a344a69caa0074c3e2137f63a5ddb4cc7f5b49221d229a4c1b1b06d5b` |
| Settle after appeal deadline | `0x49617a415b0119b9daa7cb0b9a21d9c223ecba689881af1410b568a7ee8f2c2b` |
| Execute release | `0x9cb53e399e909d955ba239bdd064ddca7b490ed0aa1bfd9791c2ea2cf6213e39` |
| Withdraw beneficiary release credit | `0x19e9c344c5613a607727420375e224836bbe8a10512186079cc6c54bab251481` |
| Withdraw publisher Assured credit | `0x93baecc77fc18193d8d5c72e56ae58b8da095ecec3fef0279af22ee5fb905d6b` |

Final authoritative readback: Assured `SETTLED`, final status `SUPPORTED`; release `EXECUTED`, `refunded=false`; MARGIN active exposure `0`; consumer exposure `0`; beneficiary credit `0`; publisher credit `0`; challenger credit `0`. The terminal coverage view reports `registration_open=false` and `available_coverage=0`.

The complete machine-readable checkpoint is [final-stable-supported-20261017-retry.json](final-stable-supported-20261017-retry.json). The first failed attempt remains separately recorded as fail-closed evidence and is not used as the definitive result.
