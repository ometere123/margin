# Current-deployment live evidence scripts

This directory contains reproducible non-browser Studionet evidence scripts for the V2 MARGIN and consumer deployments. Existing A/B/C JSON records were produced against the prior V1 deployment and remain historical; do not relabel them as V2 evidence. The scripts use only public addresses in their checkpoints; private keys remain in the local CLI keychain and are never written to evidence.

Environment invariant for every command:

```text
network: studionet
chain: 61999
rpc: https://studio.genlayer.com/api
cli: npm exec -- genlayer (0.39.1)
margin: 0x03197B3246a5BF0C28fad07c4E5868F52c601580
consumer: 0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24
```

The executable `run-current-sequences.mjs` creates durable checkpoints for sequences A, B and C. It accepts `--dry-run` and uses the existing JSON file as a resume journal; `--resume` never resubmits a recorded hash. `resume-C.mjs` invokes the same runner and can cancel only after the deadline derived from finalized registration state. These scripts never substitute Direct Mode output for live receipts, retry a write, or invent a transaction hash.

Each write must be followed by `npm exec -- genlayer receipt <hash>` and the record must include `FINALIZED`, execution result, canonical readback and the public account used. Do not reuse historical hashes.

## A. Normal-resolve-first Assured lifecycle

1. Submit a fresh claim.
2. Resolve it normally.
3. Register Assured with a valid domain proof and publisher bond.
4. Challenge from a second wallet.
5. Resolve Assured immediately; waiting is not a valid escape path.
6. Wait the appeal window.
7. Settle and withdraw the credited account.
8. Read `get_assured_claim` and record `SETTLED`.

## B. Protected release

1. Use an integrator wallet to create a funded release before settlement.
2. Use separate publisher and challenger wallets for the Assured lifecycle.
3. After canonical `SETTLED + SUPPORTED`, execute the release.
4. Withdraw as beneficiary and read the release plus canonical credit state.

## C. Cancellation

1. Register Assured with a valid domain proof and publisher bond.
2. Wait the full 24-hour registration challenge window.
3. Call `cancel_assured_claim`.
4. Call `withdraw_assured_credit` as publisher.
5. Read `get_assured_claim` and record publisher credit `0` and `CANCELLED`.

If a sequence cannot be completed because its real deadline has not elapsed, record it as pending rather than substituting Direct Mode evidence.

## V2 Covered Claim sequence

`run-v2-covered.mjs` is the V2 runner for the hosted fixture at
`https://a-murex-one.vercel.app/v2-support.html`. It records the V2 claim,
publisher/challenger/integrator public accounts, every transaction hash,
`FINALIZED / MAJORITY_AGREE / SUCCESS` receipt, and canonical readbacks in
`scripts/live/evidence/V2-covered.json`. It uses a publisher-derived manifest,
value-coupled collateral, a pre-settlement protected release, and the real
appeal deadline. `--dry-run` prints the plan without writing; rerunning after
an interruption reconciles a recorded hash before continuing and never blindly
resubmits it.
