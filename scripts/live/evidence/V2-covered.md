# V2 Covered Claim live evidence

This record is for the V2 deployments recorded in `deployment.json` only.
Every completed write below reached `FINALIZED / MAJORITY_AGREE / SUCCESS`; the
transaction hashes and canonical readbacks are in `V2-covered.json`.

## Fixture and commitments

- MARGIN: `0x03197B3246a5BF0C28fad07c4E5868F52c601580`
- Consumer: `0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`
- Claim: `327d4778e40708a227e26c52108830b035453d8eaf4e3ab0588150c212c20698`
- Page: `https://a-murex-one.vercel.app/v2-support.html`
- Manifest: `https://a-murex-one.vercel.app/.well-known/margin/claims/327d4778e40708a227e26c52108830b035453d8eaf4e3ab0588150c212c20698.json`
- Precommitted primary artifact SHA-256: `146e27235c63aed2ec7d1ec3b55b88772afbce5586c65baea477ddb388c88d00`
- Accepted primary observation digest: `ce4134a0b55fdf1081c0d47ba3f1a2c61d02b9cde5d48ea79cca34f20fa61d5d`

## Completed sequence

1. `submit_claim`: `0xceb4a68f569aef3c048275c33ea9cab956d561eff5588c74b30575a1130dfa05`
2. normal `resolve_claim`: `0x92aaa0a3660184dae0ba6a50e85047bbc0b75b85ad43483426f288e47828cde7`
3. `register_covered_claim` with coverage `2`: `0xf703ee06bce547e7e17f15c5745640c70f4d0b8359983b2df059a7a84a6f939a`
4. pre-settlement protected release (`1` GEN): `0x99c069ae0aab54668d8077a489acf552278a6473bfed518a7929a29c39e9117e`
5. `challenge_assured_claim` with `2` GEN: `0xe8a7923b6a927af2bacd07775dad3af57ee0a082047ed6b3a2d82f725a23ab40`
6. `resolve_assured_claim`: `0x1b70414d78290e938bfa8ad90a53eb82553048d338f79dd62f2b27e9b398a240`

The canonical Assured readback after step 6 was `RESOLVED` with
`final_status=INCONCLUSIVE`. This is not claimed as a positive execution
path: the accepted primary observation digest differs from the precommitted
primary artifact digest, so the integrity-bound path did not produce a
definitive supported result.

## Post-deadline settlement and refund

The canonical appeal deadline was `2026-10-07T00:07:25.348431+00:00`.
After it elapsed, the following writes each finalized successfully:

7. `settle_assured_claim`: `0xc93a97457a99daf80b94135aaca7156b6d7544e241eb59f0fff3d261a1e92071`
8. `refund_release`: `0xfb34c57352f5ca7144e651f77c28d59d49c64af29da0df9a4da81cd9d9de3f0e`
9. `withdraw_release_credit`: `0xd6153db506ebd95dedff4b8ea91501cf1c40aa79911c42e0680a1d22153ec578`
10. publisher `withdraw_assured_credit`: `0xda197db4f29a6df60a3f06603ea481c3b62ad0880efa87b8eeb52582ae6c031a`
11. challenger `withdraw_assured_credit`: `0x8610e14c4c91e144585d10547dc578eb1f6410609eaa46157f6be1715c9db7d5`

Final canonical readback: Assured state `SETTLED`, `final_status=INCONCLUSIVE`,
publisher and challenger credits `0`, active exposure `0`; the protected
release is `refunded=true`, `executed=false`, and both creator and beneficiary
credits are `0`. The complete structured readbacks are preserved in
`V2-covered.json`.
