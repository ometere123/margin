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
- `npm run verify`: PASS for the corrected source (extension tests: 6; signer tests: 12; source invariant tests: 11; Direct Mode: 11 under WSL stable runner). The extension read scheduler regression suite covers concurrent deduplication, TTL caching, stale-result fallback and cold-cache gateway-failure suppression.
- Direct Mode: 11/11 passed under the repository's stable `v0.2.12` runner in WSL
- Static lint: PASS with `genvm-lint 0.11.1rc2`
- Full linter SDK validation remains environment-limited by the unavailable/corrupt runner archive; no validation pass is claimed here.
- The extension and signer build successfully locally. The signer has no editable contract-address UI and does not accept a contract query override. The production wallet path uses ordinary EIP-1193 directly; the installed `genlayer-js@1.1.8` Snap-oriented `client.connect()` helper is intentionally not used. The signer provider regression test rejects all Snap RPC methods. Its finalization helper uses the actual Studionet receipt shape (`consensus_data.*.execution_result`), because this SDK version does not export `isSuccessful()` and does not populate the older `txExecutionResultName` field for Studio receipts. Transaction IDs are persisted before polling, with explorer links and resumable tracking after polling failures. A real Chromium wallet/annotation session remains unverified in this environment.

The corrected contract has two fresh normal-claim lifecycles recorded. The `/rfc/rfc9110/` claim submitted with `0xe5e82dafcc335f8906efb5854267b524648f9490b81df718129acd63c908ba2e` and resolved with `0x6de269fe99104bed617c1b891b6d191ffe26f9f0ec2c0395539a6598940f3ffd` finalized `SUPPORTED`. The browser-aligned `/info/rfc9110/` claim submitted with `0x3c8172c9919ee95a19f8b55e8f55c5a98304892061efe6581b37942385f263cd` and resolved with `0x42f5004557bc12a3d4f6a7dd2b30532989a4732524196523b92c4ce1e2904247` also finalized `SUPPORTED`, revision `1`, with source-manifest digest `452a5215fca972d2646684809863ba96e059a4ef159f122b71272b25ee84a153`. The controlled Assured Claim registration claim `86260d481ffc15e272e1954c5292bd060a3293a502993333ec4a32c8594a4b72` is confirmed on-chain as `OPEN`; its bond/challenge/settlement lifecycle and visual extension rendering remain unrecorded.

MARGIN's verdict is a bounded result for the challenged claim and independently inspectable public source. It is not a universal truth score or historical proof of what a page previously displayed.
