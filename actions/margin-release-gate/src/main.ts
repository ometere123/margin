import * as core from '@actions/core';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createMarginConnect, type MarginPolicyCommitment } from '@margin-connect/sdk';
import { verifyReleaseBinding } from './validation.js';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function sha256File(path: string): Promise<string> {
  const content = await readFile(path);
  return createHash('sha256').update(content).digest('hex');
}

async function run(): Promise<void> {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const repository = requiredEnv('GITHUB_REPOSITORY');
  const githubSha = requiredEnv('GITHUB_SHA');
  const expectedCommit = (core.getInput('expected-commit') || githubSha).trim();
  const policyPath = resolve(workspace, core.getInput('policy-file', { required: true }));
  const artifactPath = resolve(workspace, core.getInput('artifact-path', { required: true }));
  const marginAddress = core.getInput('margin-address', { required: true }).trim() as `0x${string}`;
  const consumerAddress = core.getInput('consumer-address', { required: true }).trim() as `0x${string}`;

  const parsed = JSON.parse(await readFile(policyPath, 'utf8')) as { commitment?: MarginPolicyCommitment } & MarginPolicyCommitment;
  const commitment = parsed.commitment ?? parsed;
  const artifactDigest = await sha256File(artifactPath);

  verifyReleaseBinding({ commitment, repository, githubSha, expectedCommit, artifactDigest });

  const connect = createMarginConnect({
    marginAddress,
    consumerAddress,
    policyCommitment: commitment,
  });
  const verdict = await connect.evaluatePolicy({
    repository,
    commitSha: expectedCommit,
    releaseArtifactSha256: artifactDigest,
  });
  core.setOutput('state', verdict.state);
  core.setOutput('claim-key', verdict.claimKey);
  core.setOutput('reason', verdict.reason);
  core.info(`MARGIN policy decision: ${verdict.state} — ${verdict.reason}`);
  if (verdict.state !== 'APPROVED') {
    core.setFailed(`MARGIN release gate blocked: ${verdict.state}. ${verdict.reason}`);
  }
}

run().catch((error) => core.setFailed(error instanceof Error ? error.message : String(error)));
