# Live sequence C

Final deployment: MARGIN `0x0f8D86d56F1b8997475dD048579807fBFe60e227`, Studionet 61999. Hosted origin: `https://a-murex-one.vercel.app/c.html`.

Claim key: `55a4242e0958156bba84c565255ba528b49edd5b5f4974a62783c3cdc5336fcb`

| Step | Transaction | Finality |
| --- | --- | --- |
| Submit | `0x735bba6827f108de7144a3be5a8b3d25108f1377f8c8af891b86fc2ec4b170d9` | FINALIZED / MAJORITY_AGREE / SUCCESS |
| Normal resolve | `0x018f7a80324e4a0cd20a753d7027fad28eda1ab4d06a55a0a8992426bce3d788` | FINALIZED / MAJORITY_AGREE / SUCCESS |
| Register Assured | `0x1109486bbb5c2761935a54f48a3f4858c7c3a2a7f961b2339a7c7b93aee25d45` | FINALIZED / MAJORITY_AGREE / SUCCESS |

Current canonical state: `REGISTERED`, unchallenged. The finalized registration state began at `2026-09-29T21:01:11.318Z`; the runner derives the earliest cancellation attempt as `2026-09-30T21:01:11.318Z` (24 hours plus the configured safety margin). C is therefore `PENDING`, not completed. Resume with `node scripts/live/resume-C.mjs --state scripts/live/evidence/C.json`; it will re-read state and submit only when legally eligible.
