These fixtures are copied into signer/dist/fixtures by Vite. Once the signer is deployed publicly, they provide stable URLs for live MARGIN testing.

claim.html contains a deliberately false compatibility statement.
evidence.html contains the contradictory support statement.
prompt-injection.html contains explicit hostile prompt text plus the same support statement.

For a STALE test, deploy a copy of claim.html, submit/resolve a claim, then alter/remove the highlighted sentence and re-resolve without archive evidence.
