# MARGIN Intelligent Contract

Target network is **GenLayer Studionet only for deployment**:

- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Currency: GEN

The contract stores bounded challenge metadata, a per-page index, and revisioned decisions. `resolve_claim` independently fetches the primary page and up to three evidence URLs, then runs a leader decision and an independent validator decision. The decision-bearing `status` must match exactly; rationale text is allowed to differ.

The contract intentionally does **not** claim to preserve historical webpages. `page_digest` is a local integrity anchor for what the extension saw. Historical adjudication requires an explicit public `archive_url` that validators can independently fetch. Otherwise, a changed/missing highlighted claim can become `STALE`.

## Methods

- `submit_claim(...)`
- `resolve_claim(claim_key)`
- `get_claim(claim_key)`
- `get_page_claims(page_key)`
- `get_decision_history(claim_key)`
- `stats()`
- `network()`

## Security boundaries

- Web pages and evidence are untrusted prompt material.
- No page can directly determine the stored status.
- The leader answer is not trusted merely because it has valid JSON; validators independently rerun the source-grounded decision and must match the status.
- Inputs and page index growth are bounded.
- MARGIN is not designed for political claims, personal allegations, medical advice, or general-purpose truth scoring.
