# MARGIN Intelligent Contract

Target network is **GenLayer Studionet only for deployment**:

- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Currency: GEN

The contract stores bounded challenge metadata, a per-page index, revisioned decisions and validator-observed source manifests. `resolve_claim` independently fetches the primary page and up to three evidence URLs, then runs a leader decision and independent validator checks over the same bounded source set. The decision-bearing structured fields and source manifest must be consistent; rationale text is human-readable and may differ.

The contract intentionally does **not** claim to preserve historical webpages. `page_digest` is a local integrity anchor for what the extension saw. Historical adjudication requires an explicit public `archive_url` that validators can independently fetch. Otherwise, a changed/missing highlighted claim can become `STALE`.

## Methods

- `submit_claim(...)`
- `resolve_claim(claim_key)`
- `get_claim(claim_key)`
- `get_page_claims(page_key)`
- `get_decision_history(claim_key)`
- `stats()`
- `network()`
- `get_claim_status(claim_key)`
- `get_revision_manifest(claim_key, revision)`
- `register_assured_claim(...)`
- `challenge_assured_claim(claim_key)`
- `resolve_assured_claim(claim_key)`
- `appeal_assured_claim(claim_key, reason)`
- `resolve_assured_appeal(claim_key)`
- `settle_assured_claim(claim_key)`
- `withdraw_assured_credit(claim_key)`
- `get_assured_claim(claim_key)`
- `is_assured_claim_final(claim_key)`

## Security boundaries

- Web pages and evidence are untrusted prompt material.
- No page can directly determine the stored status.
- The leader answer is not trusted merely because it has valid JSON; validators independently rerun the source-grounded decision and must match the status.
- Every accepted revision commits the ordered validator-observed source manifest and digest.
- Assured Claims require an exact HTTPS domain proof, funded publisher/challenger bonds, one bounded appeal and one-shot settlement.
- Inputs and page index growth are bounded.
- MARGIN is not designed for political claims, personal allegations, medical advice, or general-purpose truth scoring.
