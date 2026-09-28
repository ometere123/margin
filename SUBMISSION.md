# MARGIN submission evidence

MARGIN is a browser-native annotation layer: the extension anchors an explicit claim locally, the external signer authorises a write, and the Studionet Intelligent Contract records a bounded validator result. Normal browsing is not uploaded or indexed by a MARGIN backend.

## Final Studionet deployment

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Contract: [`0x03fE368186822d745b4DB8e4A49f8F43e867D57C`](https://explorer-studio.genlayer.com/address/0x03fE368186822d745b4DB8e4A49f8F43e867D57C)
- Deployment transaction: [`0xde6118bd3f5208c0b01f99ba085c7630e8fefc20811b3cd807d2b69e285082e9`](https://explorer-studio.genlayer.com/tx/0xde6118bd3f5208c0b01f99ba085c7630e8fefc20811b3cd807d2b69e285082e9)
- Result: `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Source commit: `a18eba60cdb1b26c55692cb8dbc6f26d08ea1359`
- Source: 16,762 bytes; SHA-256 `5d4330301fa51c8ae7f7253c1f4d6730d0a91746e5479e8b269c60a7f52b954b`
- Runtime identity: `chain_id=61999`, `network=studionet`, `rpc=https://studio.genlayer.com/api`
- Production signer: [`https://margin-signer.vercel.app/`](https://margin-signer.vercel.app/) — verified HTTP 200, MARGIN signer page, CSP/security headers, and production `VITE_MARGIN_CONTRACT_ADDRESS` configuration.

## Finalized live claim

The controlled public page was `https://www.rfc-editor.org/rfc/rfc9110`. The selected claim was: “HTTP semantics are defined by the RFC 9110 specification.” The bounded challenge statement disputed that claim, with no additional evidence URLs and a synthetic local page digest.

- Page key: `e593c606c957bfa3dc85eb280e67319b7f5e0060b4404759580d2667b512fe7e`
- Claim key: `72aac182216660f528b586f9e6816a7bb9beaccf5d8419f0050465189a7708e4`
- Submit: [`0x3566ff81712e5b461a1f7e7dfe52a47eac49a6e289aedb6dcaac1f67d2605ed7`](https://explorer-studio.genlayer.com/tx/0x3566ff81712e5b461a1f7e7dfe52a47eac49a6e289aedb6dcaac1f67d2605ed7) — `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Resolve: [`0x9411abcfe550b88b3d4e68bb54e22d1222da64616e7449e27d07aef29a5e013e`](https://explorer-studio.genlayer.com/tx/0x9411abcfe550b88b3d4e68bb54e22d1222da64616e7449e27d07aef29a5e013e) — `FINALIZED / MAJORITY_AGREE / SUCCESS`
- Final readback: `SUPPORTED`, revision `1`, with an RFC-grounded rationale.

The earlier deployment at `0xecE43547EcFbFB082B4Bfb62D3bdEb6dBf0B8059` and its transaction `0x7b2dee2f34c498c939c9ec5b241799908cc110a9c6224e07ff518a3cafc42ba3` are superseded. The first two live submit attempts are retained as tooling diagnostics: one exposed the CLI's bare-hex coercion and one exposed its empty-string/JSON argument coercion. The final deployment added only boundary normalization for those CLI representations.

## Verification status

- Local CLI: `0.39.1`
- `npm run verify`: PASS (extension tests: 3; signer transaction/wallet tests: 6; source invariant tests: 8)
- Direct Mode: 8/8 passed under the repository's stable `v0.2.12` runner in WSL
- Static lint: PASS with `genvm-lint 0.11.1rc2`
- Full linter SDK validation remains environment-limited by the unavailable/corrupt runner archive; no validation pass is claimed here.
- Browser extension and signer bundles build successfully. The signer is deployed at `https://margin-signer.vercel.app/`; the built signer has no editable contract-address UI and does not accept a contract query override. The production wallet path uses ordinary EIP-1193 directly; the installed `genlayer-js@1.1.8` Snap-oriented `client.connect()` helper is intentionally not used. The signer provider regression test exercises write preparation and rejects all Snap RPC methods. Its finalization helper uses the actual Studionet receipt shape (`consensus_data.*.execution_result`), because this SDK version does not export `isSuccessful()` and does not populate the older `txExecutionResultName` field for Studio receipts. Transaction IDs are persisted before polling, with explorer links and resumable tracking after polling failures. A Chromium wallet/annotation session remains a separate manual verification step.

MARGIN's verdict is a bounded result for the challenged claim and independently inspectable public source. It is not a universal truth score or historical proof of what a page previously displayed.
