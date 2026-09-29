# Manual browser verification

This checklist is for the current release. It does not authorize contract redeployment or duplicate state-changing transactions. Record only observed hashes, screenshots and readbacks.

## Release checks

1. Run `npm ci`, `npm run cli`, `npm exec -- genlayer --version` and `npm run verify`.
2. Run `npm run live:read` and record the finalized `network()` identity. Optionally run `npm run live:read -- --claim=<64-hex-claim-key>` for a canonical claim read.
3. Run `npm run zip` and record the resulting ZIP SHA-256.
4. Load `extension/dist` as an unpacked extension in a fresh Chromium profile.
5. Confirm the toolbar and side-panel icons use the MARGIN assets.
6. Open `https://margin-signer.vercel.app/` and confirm the deployment card shows Studionet `61999`, MARGIN `0x0f8D86d56F1b8997475dD048579807fBFe60e227`, and the bound consumer `0x6Bdb12646e054C24b68012560F7472636b395881` where shown.

## Normal claim flow

1. Open a real third-party public page containing a narrow technical, licence, compatibility, pricing or documentation claim.
2. Select the exact claim text, open the context menu and choose **Challenge with MARGIN**.
3. Confirm the signer opens `/challenge?draft=...`, not the root route.
4. Connect the injected EIP-1193 wallet only in the signer. Confirm the wallet is on Studionet `61999`.
5. Enter one precise objection and bounded public evidence. Submit once.
6. Immediately record the displayed transaction ID and Explorer link. Do not resubmit if tracking is interrupted.
7. Wait for `FINALIZED` and successful execution, then record the submission hash and final readback.
8. Resolve once, record the resolution hash, wait for finalization and record the bounded verdict.
9. Return to the original page. Confirm the finalized badge and exact-range highlight appear beside the selected claim.
10. Open the badge/side-panel details, then **View full provenance**. Confirm quote, challenge, verdict, rationale, evidence, revision, source-manifest/provenance data and Explorer links.
11. Open the decision-history section and confirm prior revisions are read from canonical finalized state.

## Assured Claim flow

Use two separately authorised wallets: publisher and challenger. Use a domain proof hosted by a domain different from the signer origin where practical.

1. Open `/claim/<claimKey>/assurance` for an existing normal claim.
2. As publisher, register the Assured Claim with the exact HTTPS well-known proof URL, nonce and ISO expiry. Approve the GEN bond.
3. Refresh and confirm `REGISTERED`, publisher identity and bond state from canonical reads.
4. As challenger, open the same assurance route and submit the precise challenge with the required bond.
5. As an eligible resolver, resolve the Assured Claim. Confirm the final status and appeal deadline.
6. Before the deadline, verify only publisher/challenger see **Appeal**. If exercising it, submit one bounded appeal and resolve it once.
7. After the recorded appeal deadline, refresh canonical state and confirm **Settle** is available. Settle once.
8. As the credited account, withdraw once. Confirm the credit is zero afterward and the terminal state is `SETTLED`.
9. In **Downstream use**, confirm the bound consumer address, canonical eligibility, release state and `has_executed` readback. Use only the displayed current-state actions.

## Recovery and wallet checks

1. Refresh while a transaction is pending. Confirm the same transaction ID remains visible and tracking resumes.
2. Close and reopen the signer with a pending journal entry. Confirm it tracks the existing transaction instead of submitting another one.
3. Click **Disconnect**, refresh, and confirm the signer remains disconnected until explicit **Connect wallet**.
4. Switch accounts and chains. Confirm the header and write controls update immediately and writes remain disabled off Studionet.

## Evidence record

Record the date, browser version, extension ZIP SHA-256, current git SHA, signer deployment, wallet addresses (public only), transaction hashes, Explorer links, final canonical readbacks and screenshots. Mark any step not performed as `NOT RUN`; do not infer it from tests or an earlier deployment.

## Ready state for manual testing

The following public fixtures are hosted on `https://a-murex-one.vercel.app` and are not the signer origin:

| Fixture | URL | Claim key | Non-browser state |
| --- | --- | --- | --- |
| A | `https://a-murex-one.vercel.app/` | `a379566c75876bd2d6253aabf8daa6d27aed5051e690d323c457e58dc3d0a0b7` | Assured lifecycle is `RESOLVED` with final status `INCONCLUSIVE`; settlement is recorded after the real appeal deadline. |
| B | `https://a-murex-one.vercel.app/b.html` | `65f1b09a71526bff2b651e2a61ade05c54c40fdf77f94876b034c8cc1b50399a` | Assured lifecycle is intended to finish `SETTLED + SUPPORTED`, with a pre-settlement protected release and beneficiary withdrawal recorded if the live verdict is supported. |
| C | `https://a-murex-one.vercel.app/c.html` | `55a4242e0958156bba84c565255ba528b49edd5b5f4974a62783c3cdc5336fcb` | `REGISTERED`, unchallenged, cancellation pending until `2026-09-30T21:01:11.318Z`. |

Public wallet roles used by the non-browser evidence are: publisher `0xb29Ead15B1E8A2420faE84de974088f67a15ccC2`, challenger `0xac3AC69dC0Bde389256dD6748C75817ead9286D9`, and integrator `0x951e6B75530774fF82321a5ae54e14F778F0C855`. The current contract is `0x0f8D86d56F1b8997475dD048579807fBFe60e227`; the bound consumer is `0x6Bdb12646e054C24b68012560F7472636b395881`.

For manual browser testing, use A or B to inspect a finalized provenance route and the extension readback; use C only to verify a registered assurance state and that cancellation is not offered before its deadline. Record screenshots and observed transaction hashes alongside the corresponding sequence file in `scripts/live/evidence/`. These fixtures are non-browser evidence inputs; browser rendering remains a separate human check.

### MANUAL BROWSER STATUS

`NOT RUN BY AGENT`

The human operator should now run `docs/MANUAL_BROWSER_VERIFICATION.md`.
