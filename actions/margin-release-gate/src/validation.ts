import { validateArtifactBinding, type MarginPolicyCommitment } from '@converts/margin-connect';

export function verifyReleaseBinding(input: {
  commitment: MarginPolicyCommitment;
  repository: string;
  githubSha: string;
  expectedCommit: string;
  artifactDigest: string;
}): void {
  const { commitment, repository, githubSha, expectedCommit, artifactDigest } = input;
  if (commitment.repository !== repository) throw new Error('The policy repository does not match GITHUB_REPOSITORY.');
  if (commitment.commitSha.toLowerCase() !== expectedCommit.toLowerCase() || githubSha.toLowerCase() !== expectedCommit.toLowerCase()) {
    throw new Error('The policy is not bound to the exact GitHub commit being evaluated.');
  }
  if (commitment.releaseArtifactSha256.toLowerCase() !== artifactDigest.toLowerCase()) {
    throw new Error('The release artifact digest does not match the immutable policy commitment.');
  }
  validateArtifactBinding({ repository, commitSha: expectedCommit, releaseArtifactSha256: artifactDigest });
}
