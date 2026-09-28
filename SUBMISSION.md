# MARGIN submission evidence

MARGIN is a browser-native annotation layer: the extension anchors an explicit claim locally, the external signer authorises a write, and the Studionet Intelligent Contract records a bounded validator result. Normal browsing is not uploaded or indexed by a MARGIN backend.

## Current corrected Studionet deployment

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Contract: [`0xb4161203706B2428D5FbC5B7e114b09d1De32960`](https://explorer-studio.genlayer.com/address/0xb4161203706B2428D5FbC5B7e114b09d1De32960)
- Deployment transaction: [`0xe72cb9b184b2cd98f2b86182c7b2bd0df3091ed71bc50417dac6cbffef13e27b`](https://explorer-studio.genlayer.com/tx/0xe72cb9b184b2cd98f2b86182c7b2bd0df3091ed71bc50417dac6cbffef13e27b)
- Result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Source commit: `552a6810742bd28ed0fc9eac80f07e69e95f8791`
- Source: 38,765 bytes; SHA-256 `aaa87487cd226dc665e4ab73405153c583d1757cd80a4b022989df156f9e5993`
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`
- Production signer: [`https://margin-signer.vercel.app/`](https://margin-signer.vercel.app/) — redeployed with the corrected public contract configuration.

The previous contract `0x03fE...D57C` and its earlier live claim evidence remain historical and are not evidence for the corrected storage schema.

## Historical live claim (previous contract only)

The controlled public page was `https://www.rfc-editor.org/rfc/rfc9110`. The selected claim was: “HTTP semantics are defined by the RFC 9110 specification.” The bounded challenge statement disputed that claim, with no additional evidence URLs and a synthetic local page digest.

- Page key: `e593c606c957bfa3dc85eb280e67319b7f5e0060b4404759580d2667b512fe7e`
- Claim key: `72aac182216660f528b586f9e6816a7bb9beaccf5d8419f0050465189a7708e4`
- Submit: [`0x3566ff81712e5b461a1f7e7dfe52a47eac49a6e289aedb6dcaac1f67d2605ed7`](https://explorer-studio.genlayer.com/tx/0x3566ff81712e5b461a1f7e7dfe52a47eac49a6e289aedb6dcaac1f67d2605ed7) — `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Resolve: [`0x9411abcfe550b88b3d4e68bb54e22d1222da64616e7449e27d07aef29a5e013e`](https://explorer-studio.genlayer.com/tx/0x9411abcfe550b88b3d4e68bb54e22d1222da64616e7449e27d07aef29a5e013e) — `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Final readback: `SUPPORTED`, revision `1`, with an RFC-grounded rationale.

The earlier deployment at `0xecE43547EcFbFB082B4Bfb62D3bdEb6dBf0B8059` and its transaction `0x7b2dee2f34c498c939c9ec5b241799908cc110a9c6224e07ff518a3cafc42ba3` are superseded. The first two live submit attempts are retained as tooling diagnostics: one exposed the CLI's bare-hex coercion and one exposed its empty-string/JSON argument coercion. The final deployment added only boundary normalization for those CLI representations.

## Verification status for this revision

- Local CLI: `0.39.1`
- `npm run verify`: PASS for the corrected source (extension tests: 11; signer tests: 15; source invariant tests: 12; Direct Mode: 11 under WSL stable runner). The extension read scheduler regression suite covers concurrent deduplication, TTL caching, stale-result fallback and cold-cache gateway-failure suppression.
- Direct Mode: 11/11 passed under the repository's stable `v0.2.12` runner in WSL
- Static lint: PASS with `genvm-lint 0.11.1rc2`
- Full linter SDK validation remains environment-limited by the unavailable/corrupt runner archive; no validation pass is claimed here.
- The extension and signer build successfully locally. The signer has no editable contract-address UI and does not accept a contract query override. The production wallet path uses ordinary EIP-1193 directly; the installed `genlayer-js@1.1.8` Snap-oriented `client.connect()` helper is intentionally not used. The signer provider regression test rejects all Snap RPC methods. Its finalization helper uses the actual Studionet receipt shape (`consensus_data.*.execution_result`), because this SDK version does not export `isSuccessful()` and does not populate the older `txExecutionResultName` field for Studio receipts. Transaction IDs are persisted before polling, with explorer links and resumable tracking after polling failures. A live Chromium read/anchor check now finds the finalized browser-aligned claim on the RFC page and renders a visible `data-margin-claim` badge; a live wallet-to-chain session remains separate evidence and is not inferred from this read check.
- The production signer response was checked at `https://margin-signer.vercel.app/` after production deployment `dpl_J7KtLx84EyNegfDbvgdhZTwjSYWm` (inspect URL: `https://vercel.com/delealufejoel-4184s-projects/margin-signer/J7KtLx84EyNegfDbvgdhZTwjSYWm`): it returned `200 OK`, the canonical contract address was present in the deployed bundle, and the observed headers included `Content-Security-Policy` with `frame-ancestors 'none'` and only the Studionet RPC in `connect-src`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and the restricted `Permissions-Policy`. The static deployment is configured from the repository-root `vercel.json` so the signer can resolve the shared protocol module.
- A reproducible extension archive was generated with `npm run zip`: `MARGIN-extension-v0.1.0.zip`, SHA-256 `66f245a1a14969b061c11b6bfa43c72140356a2232f447787273b73e86f664d9`. The archive contains only `extension/dist`; running the command twice with unchanged sources produced the same hash. The ZIP is intentionally ignored and is not committed as a generated artifact.

## Live browser annotation evidence

On 2026-09-28, the built unpacked extension was loaded in Chromium and `https://www.rfc-editor.org/info/rfc9110/` was inspected after the finalized contract read. The extension rendered:

- Claim key: `cd77ff5d309f9a6cf60f51b7afbc2ca90b91cdcf80c613da1aee3d9fb191446b`
- Badge attribute: `data-margin-claim="cd77ff5d309f9a6cf60f51b7afbc2ca90b91cdcf80c613da1aee3d9fb191446b"`
- Badge text: `M · SUPPORTED`
- Badge geometry: non-zero (`92.78 × 17.99` CSS pixels in the inspected viewport)
- The exact quote was matched across the RFC Editor's zero-width `<wbr>` split; no synthetic whitespace was introduced.

The browser exposed no CSS Custom Highlight registry in this session, so the independent badge proof is the authoritative visible check here; CSS Highlight remains an optional enhancement. The richer side-panel provenance and real wallet-to-chain lifecycle remain separately account/browser dependent.

The corrected contract has two fresh normal-claim lifecycles recorded. The `/rfc/rfc9110/` claim submitted with `0xe5e82dafcc335f8906efb5854267b524648f9490b81df718129acd63c908ba2e` and resolved with `0x6de269fe99104bed617c1b891b6d191ffe26f9f0ec2c0395539a6598940f3ffd` finalized `SUPPORTED`. The browser-aligned `/info/rfc9110/` claim submitted with `0x3c8172c9919ee95a19f8b55e8f55c5a98304892061efe6581b37942385f263cd` and resolved with `0x42f5004557bc12a3d4f6a7dd2b30532989a4732524196523b92c4ce1e2904247` also finalized `SUPPORTED`, revision `1`, with source-manifest digest `452a5215fca972d2646684809863ba96e059a4ef159f122b71272b25ee84a153`.

The controlled Assured Claim was then exercised live. Registration (`0xbb9b0c865640afff0b6312ffcd49fbdf229584c3b86136ec0ded1534b305d979`) finalized with a 1 GEN publisher bond; a separate funded challenger submitted (`0xac2cc1ce571b4647361b0e84ac47fd5b158b4dc10916a5bf7e65d28971dab240`) with a 1 GEN challenge bond; resolution (`0x0af5540e19cb92de18b8c2c174ea2b7b164abde21a67ddc1a46928daeb5c1f9b`) finalized `MAJORITY_AGREE / SUCCESS`. Settlement (`0xa4bff00ddba0254be669092d1a965ab748d02c091a98c36ec15c64343bd2755b`) and challenger withdrawal (`0x8314aa27ad1a2c95d1be6910cccff22e430495c28691888f0cb828bb2ddf4990`) also finalized `MAJORITY_AGREE / SUCCESS`; canonical readback is now `SETTLED / CONTRADICTED` with both credits zero after withdrawal.

The separate downstream consumer was deployed at `0x2885169713d79cb2FC463Dc624Ea5fc08b59d044` (`0x84ba75b54e4f58b5550388b9a474c31099b8626f55b8c8041081ed886a27c6a4`). Exercising it against the settled contradicted claim (`0xb7c25973b255b6148b0e156db42ef6128bb22c0dc89ba15be828cc440b78ebd0`) finalized with the expected `protected action requires a SUPPORTED assured claim` contract error, and `has_executed` remained false. This is the observed negative consumer gate; no settled SUPPORTED Assured Claim was created for a positive execution proof.

MARGIN's verdict is a bounded result for the challenged claim and independently inspectable public source. It is not a universal truth score or historical proof of what a page previously displayed.
