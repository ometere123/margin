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

The canonical Assured readback after step 6 is `RESOLVED` with
`final_status=INCONCLUSIVE`. This is not claimed as a positive execution
path: the accepted primary observation digest differs from the precommitted
primary artifact digest, so the integrity-bound path did not produce a
definitive supported result. The protected release remains unexecuted.

## Pending deadline-gated continuation

The canonical appeal deadline is `2026-10-07T00:07:25.348431+00:00`. The
runner must be resumed only after that time. It will settle the resolved
`INCONCLUSIVE` claim, refund the protected release, withdraw the resulting
credits, and save the final canonical readbacks. No write is to be retried;
the durable runner reconciles the hashes above before continuing.
