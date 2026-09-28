# Threat model

## Malicious webpages

A webpage can manipulate DOM, canonical tags, visible text and prompt-like source content.

Mitigations:

- cross-origin canonical hints are ignored;
- source pages are explicitly delimited as untrusted evidence;
- page content cannot directly set contract status;
- validators independently fetch evidence;
- extension re-reads finalized state from GenLayer;
- ambiguous/missing text anchors are not guessed.

Residual risk: LLM prompt injection from hostile evidence is not eliminated. Independent validators reduce single-model control but do not make adversarial content harmless. Live hostile-page testing is required.

## Forged page keys

The contract recomputes SHA-256 over the submitted canonical URL and rejects a mismatched `page_key`. The extension also filters returned claims by exact canonical URL before rendering, giving a second boundary against index confusion.

## Historical-page claims

A local digest is not independent evidence. MARGIN therefore does not claim it proves historical webpage content.

Mitigation: historical resolution requires a public archive URL that validators can fetch. Without it, changed/missing text may become `STALE` or `INCONCLUSIVE`.

## Wallet surface

A signer webpage is more exposed than an extension UI.

Mitigations:

- signer receives an already formed draft but independently re-derives both `page_key` and `claim_key` before enabling writes;
- it shows the highlighted claim, class, challenge, public evidence, archive and key before signing;
- the production signer uses a release-configured canonical contract address and ignores contract-address query parameters;
- the extension uses the same release configuration and does not expose editable contract/RPC/signer settings to normal users;
- it reads the target contract's `network()` view and refuses writes unless the contract identifies itself as Studionet 61999;
- it uses injected EIP-1193 only;
- network is fixed to Studionet 61999;
- extension never trusts signer-returned verdict data.

Production hardening uses a static Vercel origin with CSP/security headers, `Referrer-Policy: no-referrer`, public build-time contract configuration, and wallet approval. The Vite variable is not a secret; network identity verification and contract-side payload checks remain the security boundaries.

## Spam / state growth

Mitigations:

- 48 claims maximum per page key;
- 3 distinct evidence URLs maximum;
- fetched adjudication material is capped per primary/archive/evidence source;
- strict string bounds;
- 5 resolutions maximum per claim;
- unchanged source manifests are rejected;
- immediate refresh after the first decision is challenger-controlled and other refreshes are cooldown-gated;
- every write costs a GenLayer transaction.

The optional Assured Claim path adds explicit publisher/challenger bonds and one bounded appeal. Settlement is one-shot and liabilities remain reserved until the appeal deadline.

## Evidence-manifest integrity

Each accepted resolution commits the validator-observed ordered source manifest, including URL, fetch status, provenance and bounded content digest. The leader cannot substitute a digest, source index or archive interpretation without failing the validator consistency checks. A browser-local page digest remains only a capture anchor, not historical proof.

## Scope abuse

MARGIN is deliberately not a universal truth oracle. UI and documentation limit v0.1 to technical, licence, compatibility, pricing and documentation claims.

Do not add political persuasion, personal allegations, medical determinations, broad reputation scores or subjective quality ranking to the same contract.
