import { describe, expect, it } from 'vitest';
import { verifyReleaseBinding } from './validation.js';
import type { MarginPolicyCommitment } from '@margin-connect/sdk';

const commitment: MarginPolicyCommitment = {
  policyId: 'policy-1',
  claimKey: 'a'.repeat(64),
  canonicalUrl: 'https://example.test/claim',
  publisher: '0x1111111111111111111111111111111111111111',
  manifestDigest: 'b'.repeat(64),
  evidencePackDigest: 'c'.repeat(64),
  primaryArtifactSha256: 'd'.repeat(64),
  repository: 'ometere123/margin',
  commitSha: 'e'.repeat(40),
  releaseArtifactSha256: 'f'.repeat(64),
  policyHash: '0'.repeat(64),
};

const valid = {
  commitment,
  repository: commitment.repository,
  githubSha: commitment.commitSha,
  expectedCommit: commitment.commitSha,
  artifactDigest: commitment.releaseArtifactSha256,
};

describe('release-gate binding', () => {
  it('accepts an exact repository, commit and artifact binding', () => {
    expect(() => verifyReleaseBinding(valid)).not.toThrow();
  });

  it.each([
    ['repository', { repository: 'other/repo' }],
    ['GitHub commit', { githubSha: '0'.repeat(40) }],
    ['expected commit', { expectedCommit: '0'.repeat(40) }],
    ['artifact', { artifactDigest: '0'.repeat(64) }],
  ])('blocks a mismatched %s', (_label, override) => {
    expect(() => verifyReleaseBinding({ ...valid, ...override })).toThrow();
  });
});
