# MARGIN reviewer path

This is a short, evidence-first review path for the current Studionet release.

1. Install dependencies with `npm ci`.
2. Confirm the pinned toolchain with `npm run cli` and `npm exec -- genlayer --version`; both must report GenLayer CLI `0.39.1`.
3. Run `npm run verify` for TypeScript checks, extension/signer tests, Python invariants and both builds.
4. Run `npm run test:direct` from an Ubuntu/WSL environment for the Direct Mode suite. The Windows native Direct Mode runner has a known temporary-file locking limitation; CI runs this same suite on Ubuntu.
5. Inspect [`deployment.json`](deployment.json) for the current Studionet contract, consumer binding, deployment transactions and source hash. Historical deployments are retained below the current record and are not current evidence.
6. Open [`https://margin-signer.vercel.app/`](https://margin-signer.vercel.app/) and inspect `/claim/<claim-key>` for a finalized claim read directly from MARGIN. The signer has no backend and uses the injected EIP-1193 wallet only for writes.
7. Load `extension/dist` as an unpacked MV3 extension, open a public page, highlight a narrow technical claim and choose **Challenge with MARGIN**. The extension opens `/challenge?draft=...`; it does not hold wallet controls.
8. For the complete manual browser and Assured Claim matrix, follow [`docs/MANUAL_BROWSER_VERIFICATION.md`](docs/MANUAL_BROWSER_VERIFICATION.md). It is an observation checklist, not recorded live evidence.

## Claims-to-evidence map

| Claim | Evidence |
| --- | --- |
| Finalized claim state is canonical | `get_claim(..., LATEST_FINAL)` in signer and Direct Mode tests |
| Validator observations need not be byte-identical | `_consensus_candidate_is_valid` tests in `tests/direct/test_margin.py` |
| Revision griefing is bounded | normal three-slot/cooldown and reserved Assured-slot tests |
| Assured lifecycle is bonded and bounded | Direct Mode lifecycle and appeal tests; `deployment.json` live records |
| Consumer uses canonical MARGIN state | bound-address test and `MarginGate` implementation in `contracts/margin_consumer.py` |
| Wallet signing is ordinary EIP-1193 | signer wallet tests and source review; no Snap methods |
| Browser annotation is extension-first | extension anchor/badge tests and the recorded manual browser evidence |

The current release uses Studionet chain `61999`, RPC `https://studio.genlayer.com/api`, and the addresses recorded in `deployment.json`. Browser, wallet and live lifecycle claims remain limited to the transactions and manual checks explicitly recorded there and in `docs/LIVE_VALIDATION.md`.
