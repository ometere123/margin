# Current-deployment live evidence scripts

This directory is reserved for reproducible non-browser Studionet evidence. The agent did not execute the time-based sequences in this round, so this file records the exact required order without inventing transaction hashes.

Environment invariant for every command:

```text
network: studionet
chain: 61999
rpc: https://studio.genlayer.com/api
cli: npm exec -- genlayer (0.39.1)
margin: 0x0f8D86d56F1b8997475dD048579807fBFe60e227
consumer: 0x603FF16d4ba5d9Ac8bb66af8fF6869EbFA272254

The executable `run-current-sequences.ps1` records CLI output for sequences A, B and C. It never substitutes Direct Mode output for live receipts. Sequence A remains pending until the 24-hour registration window elapses; sequences B and C require fresh claim/domain-proof inputs and separate wallet accounts.
```

Each write must be followed by `npm exec -- genlayer receipt <hash>` and the record must include `FINALIZED`, execution result, canonical readback and the public account used. Do not reuse historical hashes.

## A. Cancellation

1. Submit a fresh claim.
2. Register Assured with a valid domain proof and publisher bond.
3. Wait the full 24-hour registration challenge window.
4. Call `cancel_assured_claim`.
5. Call `withdraw_assured_credit` as publisher.
6. Read `get_assured_claim` and record publisher credit `0` and `CANCELLED`.

## B. Normal then Assured

1. Submit and resolve a fresh claim normally.
2. Register Assured.
3. Challenge from a second wallet.
4. Resolve Assured immediately; waiting is not a valid escape path.
5. Wait the appeal window, settle, withdraw the credited account and read `SETTLED`.

## C. Protected release

1. Use an integrator wallet to create a funded release before settlement.
2. Use separate publisher and challenger wallets for the Assured lifecycle.
3. After canonical `SETTLED + SUPPORTED`, execute the release.
4. Withdraw as beneficiary and read the release plus canonical credit state.
5. Verify a second release on the same claim remains independently readable and executable/refundable.

If a sequence cannot be completed because its real deadline has not elapsed, record it as pending rather than substituting Direct Mode evidence.
