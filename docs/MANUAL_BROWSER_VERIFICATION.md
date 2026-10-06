# Manual browser verification

This checklist is for the current release. It does not authorize contract redeployment or duplicate state-changing transactions. Record only observed hashes, screenshots and readbacks.

## Release checks

1. Run `npm ci`, `npm run cli`, `npm exec -- genlayer --version` and `npm run verify`.
2. Run `npm run live:read` and record the finalized `network()` identity. Optionally run `npm run live:read -- --claim=<64-hex-claim-key>` for a canonical claim read.
3. Run `npm run zip` and record the resulting ZIP SHA-256.
4. Load `extension/dist` as an unpacked extension in a fresh Chromium profile.
5. Confirm the toolbar and side-panel icons use the MARGIN assets.
6. Open `https://margin-signer.vercel.app/` and confirm the deployment card shows Studionet `61999`, V2 MARGIN `0x03197B3246a5BF0C28fad07c4E5868F52c601580`, and the bound consumer `0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24` where shown.

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

The primary human browser flow is complete and passed. Record the date, browser version, extension ZIP SHA-256, current git SHA, signer deployment, wallet addresses (public only), current transaction hashes, Explorer links, final canonical readbacks and screenshots. Optional or hostile steps not performed remain `NOT RUN`; do not infer them from tests or an earlier deployment.

## Human browser proof completed

- Status: `PASS`
- Run by: human operator
- Claim key: `259063a89ee24ca0f7cb78ee6158f024db0df1f6c5744dea0c3ec120fee36c33`
- Source: https://www.sqlite.org/serverless.html
- Observed: real-page capture, signer handoff, wallet on Studionet 61999, finalized submission, finalized resolution, `SUPPORTED`, exact quote re-anchor, CSS highlight, visible `M · SUPPORTED` badge, badge persistence after refresh, extension provenance/details, full provenance route, direct claim route and assurance route.
- This was a normal claim only. No Assured Claim lifecycle was executed for this SQLite claim.

## Ready state for manual testing

The following public fixtures are hosted on `https://a-murex-one.vercel.app` and are not the signer origin. They are read-only inspection fixtures for the browser run. The fixture project is Vercel project `a` (`prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz`), production deployment `dpl_DD43w22FgrutZMj15euqzPjaZR14`.

| Fixture | URL | Claim key | Non-browser state |
| --- | --- | --- | --- |
| A | `https://a-murex-one.vercel.app/` | `a379566c75876bd2d6253aabf8daa6d27aed5051e690d323c457e58dc3d0a0b7` | `SETTLED`, `final_status=INCONCLUSIVE`; publisher and challenger each received credit `1`, then withdrew it; credits and bonds are `0`. |
| B | `https://a-murex-one.vercel.app/b.html` | `65f1b09a71526bff2b651e2a61ade05c54c40fdf77f94876b034c8cc1b50399a` | `SETTLED`, `final_status=SUPPORTED`; release `0:65f1b09a71526bff2b651e2a61ade05c54c40fdf77f94876b034c8cc1b50399a` was created before settlement, `executed=true`, `refunded=false`, beneficiary credit `0` after withdrawal, `is_claim_supported=true`, Assured credits `0`. |
| C | `https://a-murex-one.vercel.app/c.html` | `55a4242e0958156bba84c565255ba528b49edd5b5f4974a62783c3cdc5336fcb` | `REGISTERED`, unchallenged; cancellation is not yet possible. Registration state began `2026-09-29T21:00:11.318794Z`; earliest cancel is `2026-09-30T21:01:11.318Z`. |

Public wallet roles used by the historical non-browser evidence are: publisher `0xb29Ead15B1E8A2420faE84de974088f67a15ccC2`, challenger `0xac3AC69dC0Bde389256dD6748C75817ead9286D9`, and integrator `0x951e6B75530774fF82321a5ae54e14F778F0C855`. A fresh V2 lifecycle needs newly recorded role assignments. The current V2 contract is `0x03197B3246a5BF0C28fad07c4E5868F52c601580`; the bound consumer is `0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24`.

The A, B and C fixture routes are read-only against canonical finalized state. They do not require importing the publisher, challenger or integrator keys. A fresh claim submission, resolution, wallet rejection and network-switch test require your own funded injected wallet; you cannot sign as the recorded publisher/challenger/integrator accounts unless you deliberately import those accounts.

## Manual matrix

| Step | Exact page/route | What to do | EXPECTED result | Record proof |
| --- | --- | --- | --- | --- |
| Extension install/icon | Chrome extension management page | Load `extension/dist` unpacked and inspect the toolbar/side-panel icon | MARGIN icon loads without manifest errors | `01-extension-icon.png` |
| Side-panel capture | Any public technical page | Highlight a narrow claim and choose **Challenge with MARGIN** | Side panel opens with the exact quote and no wallet controls | `02-side-panel-capture.png` |
| Challenge form | Side panel | Enter challenge text, evidence URL and optional archive URL | Inputs remain bounded and **Continue to wallet signer** is available | `03-challenge-form.png` |
| Continue to signer | `/challenge?draft=...` | Continue from the extension | Signer opens the routed challenge page with the draft intact | `04-challenge-route.png` |
| Wallet connect | `/challenge?draft=...` or `/` | Click **Connect wallet** with your own account | Header shows the shortened account and Studionet `61999` after authorization | `05-wallet-connect.png` |
| Disconnect/reconnect | `/` | Click **Disconnect**, refresh, then click **Connect wallet** | Explicit disconnect persists across refresh; reconnect requires an explicit click | `06-disconnect-reconnect.png` |
| Wrong network | `/challenge?draft=...` | Switch the wallet away from Studionet and attempt a write | Write is disabled or prompts for `wallet_switchEthereumChain`/`wallet_addEthereumChain`; no transaction is submitted off chain `61999` | `07-wrong-network.png` |
| Submit fresh claim | `/challenge?draft=...` | On your own fresh draft, approve the wallet transaction once | Transaction ID appears immediately with a clickable Studionet Explorer link, then reaches `FINALIZED` | Submit tx hash + `08-submit-finalized.png` |
| Resolve fresh claim | `/challenge?draft=...` | Click **Resolve** after the submit is finalized | A separate resolution transaction is tracked to finality and a verdict is shown | Resolve tx hash + `09-resolve-finalized.png` |
| Fresh annotation/provenance | Original source page, then extension badge | Return to the source page and click the badge | Exact highlight, visible MARGIN badge, side-panel details and provenance link appear | `10-badge-provenance.png` |
| Direct claim A | `/claim/a379566c75876bd2d6253aabf8daa6d27aed5051e690d323c457e58dc3d0a0b7` | Open directly without a draft or wallet | Read-only `SETTLED / INCONCLUSIVE`, quote, rationale, evidence, history and provenance render | `11-claim-A.png` |
| Assurance A | `/claim/a379566c75876bd2d6253aabf8daa6d27aed5051e690d323c457e58dc3d0a0b7/assurance` | Open directly | Read-only settled assurance state and zero credits; no impossible action buttons | `12-assurance-A.png` |
| Direct claim B | `/claim/65f1b09a71526bff2b651e2a61ade05c54c40fdf77f94876b034c8cc1b50399a` | Open directly | Read-only `SETTLED / SUPPORTED` claim provenance renders | `13-claim-B.png` |
| Assurance B/downstream | `/claim/65f1b09a71526bff2b651e2a61ade05c54c40fdf77f94876b034c8cc1b50399a/assurance` | Inspect **Downstream use** | Release shows correct creator/integrator, publisher beneficiary, `executed=true`, `refunded=false`, zero beneficiary credit and no impossible buttons | `14-assurance-B-release.png` |
| Direct claim C assurance | `/claim/55a4242e0958156bba84c565255ba528b49edd5b5f4974a62783c3cdc5336fcb/assurance` | Open directly | `REGISTERED`, unchallenged; no **Cancel** before `2026-09-30T21:01:11.318Z`; after that time, refresh and verify the action appears only if still eligible | `15-assurance-C.png` or later tx hash |
| Decision history | `/claim/<A key>` or `/claim/<B key>` | Expand **Decision history** | Previous revisions show status, rationale, resolved time, resolver and provenance digest | `16-decision-history.png` |
| Activity | `/activity` | Open the Activity route | Local transaction provenance is shown; no centralized activity backend is implied | `17-activity.png` |
| Mobile layout | Any signer route at narrow viewport | Resize to mobile width and scroll | Cards, header, wallet controls, evidence and action buttons remain readable and usable | `18-mobile-layout.png` |
| Rejected wallet request | `/challenge?draft=...` | Reject a wallet request in the injected wallet | Clear rejection text appears; no duplicate submission is created | `19-wallet-rejection.png` |

## Known behaviours to expect

- Sequence A was `SUPPORTED` on its normal resolve and `INCONCLUSIVE` on its Assured resolve. These are separate adjudication contexts, and validators independently judge each one.
- The A and B domain proofs are no longer hosted because only one proof file is deployed at a time; C's proof is the currently hosted proof file. A and B are already finalized read-only fixtures.
- The A, B and C pages are operator-hosted evidence fixtures, not third-party disputes.

Record screenshots and observed transaction hashes alongside the corresponding sequence file in `scripts/live/evidence/`. Do not infer browser rendering from the non-browser evidence.

### MANUAL BROWSER STATUS

`PRIMARY HUMAN BROWSER FLOW: PASS`

The optional/hostile browser matrix remains individually scoped; only performed items should be marked complete.
