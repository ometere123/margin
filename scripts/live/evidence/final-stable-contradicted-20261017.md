# Final deployment Covered lifecycle — CONTRADICTED

- Network: Studionet 61999 (`https://studio.genlayer.com/api`)
- MARGIN: `0x38a12Db824979A1E051792Cd322211FdB24473f3`
- Canonical consumer: `0xD067556b32Ef7D9975d524B942344E4098724541`
- Claim key: `db4fca64e939f315e5e78f20c563b19adf11d592ca134a8a9e6f24d652ab617b`
- Primary rendered digest: `a0f9e483c7fc425dafa70a775f1d1b9c125e600eaf39349d4498902a33ae0e51`
- Evidence digest: `977bf71a4f1f797089d444aca0adbacdf5f9147a83df5797e808cfdd5d67f28b`

Every listed transaction finalized with `FINALIZED / MAJORITY_AGREE / SUCCESS`:

| Operation | Transaction |
|---|---|
| Submit claim | `0x4862e67f01a14367aa980c1a86c1475c71014867e007ce56810297b26091e974` |
| Resolve normal claim | `0x57d2a6a94e2d528ba39e850073ba43a92d67b2f75ee24d74ed524a443afdb04e` |
| Register Covered Claim | `0x982d62fb09fa5f3483dcdd43aca708e59cc8cae3eb88a6b8506cc02b90bed82f` |
| Create protected release | `0xe23fc92703eea0679a09ffa47a71b7fb580412cb0ec6ee52965a53f3b0bf3f3c` |
| Challenge | `0x809021e14664d5a2640a06c4b359f43369fd00326b9ce29eaf8c890a0d763bfd` |
| Resolve Assured Claim | `0x81d65e05f5bcd3ec792d11ecef36c4de2646c2156796e8f7399be4e7b95cb111` |
| Settle after appeal deadline | `0xfef3e027b3e75d88bf400292aad824e41c6a62b3a9bc25855a918d1ad0c365bb` |
| Refund release | `0x4f0e2dfc7d9384a00016de3a95d8e4fe9dd2dd5e78f3555fcd84ce9eebef2616` |
| Withdraw creator release credit | `0x2d01b0db10b917c2a28fd14378768068572ca8b2d872977436507a9772a9a7d3` |
| Withdraw challenger Assured credit | `0x7737c57176ee022c1e95eda51b7d7ea9af2238355c972ed10e6679ac89c3691d` |

Final authoritative readback: Assured `SETTLED`, final status `CONTRADICTED`; release `REFUNDED`, `executed=false`; MARGIN active exposure `0`; consumer exposure `0`; creator credit `0`; publisher credit `0`; challenger credit `0`. The terminal coverage view reports `registration_open=false` and `available_coverage=0`.

The complete machine-readable checkpoint is [final-stable-contradicted-20261017.json](final-stable-contradicted-20261017.json). The separate `*-resume-failure.json` file records a finalized execution-error duplicate attempt caused by an invalid local checkpoint and is not part of the successful sequence.
