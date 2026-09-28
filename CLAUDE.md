# CLAUDE HANDOFF — MARGIN

Finish this repository in place. MARGIN is already architecturally defined; do not scaffold a replacement.

**Hard network rule:** GenLayer Studionet, chain ID **61999**, RPC `https://studio.genlayer.com/api`. Never substitute another network or preview environment.

**Hard CLI rule:** this repository pins the npm package `genlayer` to **exactly `0.39.1` locally**. The user's computer may have global CLI `0.40.0rc2`; do not use it. After `npm install`, run `npm run cli:check` and execute GenLayer commands only through `npm exec -- genlayer ...` (or `npm run genlayer -- ...`).

Read in order:

1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/THREAT_MODEL.md`
4. `docs/LIVE_VALIDATION.md`
5. `CODEX.md` (the execution checklist applies equally here)

Use the official GenLayer developer skill/docs if available. Validate the contract against the live stable 61999-compatible GenVM/toolchain, run all JS/Python tests, repair SDK drift, deploy to 61999, validate consensus + finality + an appeal, load the unpacked extension, validate real webpage anchoring and deploy the static signer if credentials permit.

Do not add a MARGIN backend. Do not turn it into a website-first DApp. Do not weaken independent validator verification. Do not claim historical page truth from the local page digest.

When finished, write `FINAL_HANDOFF.md` containing deployed address, transaction IDs, exact tool versions, tests run, fee measurements, browser test evidence, known limitations and only the remaining account-specific/manual steps.
