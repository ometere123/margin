import { describe, expect, it } from 'vitest';
import {
  LATEST_FINAL,
  MARGIN_CHAIN_ID,
  MARGIN_NETWORK,
  MARGIN_RPC,
  MarginConnectError,
  computePolicyCommitmentHash,
  createMarginConnect,
  type MarginPolicyCommitment,
  type MarginReadClient,
} from './index';

const MARGIN = '0x1111111111111111111111111111111111111111' as const;
const CONSUMER = '0x2222222222222222222222222222222222222222' as const;
const PUBLISHER = '0x3333333333333333333333333333333333333333' as const;
const CLAIM_KEY = 'a'.repeat(64);
const DIGEST = 'b'.repeat(64);
const URL = 'https://example.test/claim.html';

async function commitment(overrides: Partial<Omit<MarginPolicyCommitment, 'policyHash'>> = {}): Promise<MarginPolicyCommitment> {
  const base = {
    policyId: 'policy-1',
    claimKey: CLAIM_KEY,
    canonicalUrl: URL,
    publisher: PUBLISHER,
    manifestDigest: DIGEST,
    evidencePackDigest: 'c'.repeat(64),
    primaryArtifactSha256: 'd'.repeat(64),
    repository: 'ometere123/margin',
    commitSha: 'e'.repeat(40),
    releaseArtifactSha256: 'f'.repeat(64),
    ...overrides,
  };
  return { ...base, policyHash: await computePolicyCommitmentHash(base) };
}

function readClient(mode: 'supported' | 'ordinary' | 'pending' | 'malformed' | 'unavailable' = 'supported') {
  const calls: Array<{ functionName: string; variant: unknown }> = [];
  const client: MarginReadClient = {
    async readContract({ functionName, transactionHashVariant }) {
      calls.push({ functionName, variant: transactionHashVariant });
      if (mode === 'unavailable') throw new Error('RPC unavailable');
      if (functionName === 'network') return { network: MARGIN_NETWORK, chain_id: MARGIN_CHAIN_ID, rpc: MARGIN_RPC };
      if (mode === 'malformed') return { wrong: true };
      if (functionName === 'get_claim') {
        return {
          claim_key: CLAIM_KEY,
          canonical_url: URL,
          status: mode === 'ordinary' ? 'SUPPORTED' : 'SUPPORTED',
          revision: 1,
          source_manifest_digest: DIGEST,
          latest_manifest: { claimKey: CLAIM_KEY },
        };
      }
      if (functionName === 'get_assured_claim') {
        return mode === 'pending'
          ? { claim_key: CLAIM_KEY, state: 'CHALLENGED', final_status: 'UNRESOLVED', settled: false }
          : { claim_key: CLAIM_KEY, state: 'SETTLED', final_status: 'SUPPORTED', settled: true };
      }
      if (functionName === 'get_covered_claim') {
        return mode === 'ordinary'
          ? {}
          : {
              claim_key: CLAIM_KEY,
              publisher: PUBLISHER,
              manifest_digest: DIGEST,
              evidence_pack_digest: 'c'.repeat(64),
              primary_artifact_sha256: 'd'.repeat(64),
              coverage_cap: '10',
              state: 'SETTLED',
              final_status: 'SUPPORTED',
            };
      }
      if (functionName === 'get_coverage_state') {
        return {
          claim_key: CLAIM_KEY,
          canonical_consumer: CONSUMER,
          coverage_cap: '10',
          active_exposure: '0',
          available_coverage: '10',
          registration_open: true,
          state: 'REGISTERED',
          final_status: 'UNRESOLVED',
        };
      }
      throw new Error(`unexpected read ${functionName}`);
    },
  };
  return { client, calls };
}

describe('MARGIN Connect', () => {
  it('reads only finalized state and approves an exact Covered policy', async () => {
    const policy = await commitment();
    const { client, calls } = readClient();
    const connect = createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: policy, client });

    const verdict = await connect.getVerdict();

    expect(verdict.state).toBe('APPROVED');
    expect(verdict.assurance).toBe('COVERED');
    expect(verdict.coverage?.available_coverage).toBe(10n);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every((call) => call.variant === LATEST_FINAL)).toBe(true);
  });

  it.each([
    ['ordinary', 'DENIED'],
    ['pending', 'PENDING'],
  ] as const)('does not approve %s state', async (mode, expected) => {
    const policy = await commitment();
    const { client } = readClient(mode);
    const verdict = await createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: policy, client }).getVerdict();
    expect(verdict.state).toBe(expected);
  });

  it('fails closed when the finalized read is unavailable or malformed', async () => {
    const policy = await commitment();
    for (const mode of ['unavailable', 'malformed'] as const) {
      const { client } = readClient(mode);
      const verdict = await createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: policy, client }).getVerdict();
      expect(verdict.state).toBe('UNAVAILABLE');
      expect(verdict.assurance).toBe('UNAVAILABLE');
    }
  });

  it('denies a policy hash or artifact binding that does not match', async () => {
    const valid = await commitment();
    const invalidHash = { ...valid, policyHash: '0'.repeat(64) };
    const { client } = readClient();
    const invalidHashVerdict = await createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: invalidHash, client }).getVerdict();
    expect(invalidHashVerdict.state).toBe('DENIED');

    const validConnect = createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: valid, client });
    const artifactVerdict = await validConnect.evaluatePolicy({ commitSha: '0'.repeat(40) });
    expect(artifactVerdict.state).toBe('DENIED');
  });

  it('rejects a canonical consumer mismatch and terminal arithmetic inconsistency', async () => {
    const policy = await commitment();
    const { client } = readClient();
    const mismatchClient: MarginReadClient = {
      ...client,
      async readContract(args) {
        const value = await client.readContract(args);
        return args.functionName === 'get_coverage_state' && value && typeof value === 'object'
          ? { ...(value as Record<string, unknown>), canonical_consumer: '0x4444444444444444444444444444444444444444' }
          : value;
      },
    };
    const mismatch = await createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: policy, client: mismatchClient }).getVerdict();
    expect(mismatch.state).toBe('UNAVAILABLE');
    expect(mismatch.reason).toContain('canonical consumer');
  });

  it('exports a typed configuration error for malformed policy inputs', () => {
    expect(() => createMarginConnect({ marginAddress: MARGIN, consumerAddress: CONSUMER, policyCommitment: {} as never })).toThrow(MarginConnectError);
  });
});
