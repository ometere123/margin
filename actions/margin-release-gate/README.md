# MARGIN release-gate action

This is a distributable Node 24 JavaScript Action. It checks the exact GitHub
repository, commit SHA and release-artifact SHA-256 before using
`@converts/margin-connect` to read the existing MARGIN deployment at `LATEST_FINAL`.

The action fails closed for ordinary claims, unresolved claims, negative
verdicts, malformed reads, consumer mismatches and RPC failures. It has no
private key, backend, AI authority or `pull_request_target` path.

Workflows should grant only:

```yaml
permissions:
  contents: read
```

The policy JSON is committed to the repository and must contain the immutable
`MarginPolicyCommitment` fields described in
[`packages/connect-sdk/README.md`](../../packages/connect-sdk/README.md).
The action does not manufacture that commitment.
