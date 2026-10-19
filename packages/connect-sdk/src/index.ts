import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { z } from 'zod';

export const MARGIN_CONNECT_VERSION = '0.1.0' as const;
export const MARGIN_CHAIN_ID = 61999 as const;
export const MARGIN_NETWORK = 'studionet' as const;
export const MARGIN_RPC = 'https://studio.genlayer.com/api' as const;
export const LATEST_FINAL = TransactionHashVariant.LATEST_FINAL;

export type HexAddress = `0x${string}`;
export type HexDigest = string;
export type VerdictState = 'APPROVED' | 'DENIED' | 'PENDING' | 'UNAVAILABLE';

const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const digestSchema = z.string().regex(/^[0-9a-f]{64}$/i);
const claimKeySchema = digestSchema;

export interface MarginPolicyCommitment {
  policyId: string;
  claimKey: string;
  canonicalUrl: string;
  publisher: HexAddress;
  manifestDigest: HexDigest;
  evidencePackDigest: HexDigest;
  primaryArtifactSha256: HexDigest;
  repository: string;
  commitSha: string;
  releaseArtifactSha256: HexDigest;
  policyHash: HexDigest;
}

export interface MarginConnectConfig {
  marginAddress: HexAddress;
  consumerAddress: HexAddress;
  policyCommitment: MarginPolicyCommitment;
  expectedContractCodeSha256?: HexDigest;
  client?: MarginReadClient;
}

export interface ArtifactBinding {
  repository: string;
  commitSha: string;
  releaseArtifactSha256: HexDigest;
}

export interface MarginReadClient {
  readContract(args: {
    address: HexAddress;
    functionName: string;
    args?: unknown[];
    transactionHashVariant: TransactionHashVariant;
  }): Promise<unknown>;
  getContractCode?: (address: HexAddress) => Promise<string>;
}

export interface NetworkIdentity {
  network: typeof MARGIN_NETWORK;
  chainId: number;
  rpc: typeof MARGIN_RPC;
}

export interface MarginClaim {
  claim_key: string;
  canonical_url: string;
  status: string;
  revision: number | string | bigint;
  source_manifest_digest?: string;
  source_set_digest?: string;
  latest_manifest?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MarginAssuredClaim {
  claim_key: string;
  state: string;
  final_status: string;
  settled?: boolean;
  [key: string]: unknown;
}

export interface MarginCoveredClaim {
  claim_key: string;
  publisher: string;
  manifest_digest: string;
  evidence_pack_digest: string;
  primary_artifact_sha256: string;
  coverage_cap: string | number | bigint;
  state: string;
  final_status: string;
  [key: string]: unknown;
}

export interface MarginCoverage {
  claim_key: string;
  canonical_consumer: string;
  coverage_cap: bigint;
  active_exposure: bigint;
  available_coverage: bigint;
  registration_open: boolean;
  state: string;
  final_status: string;
  [key: string]: unknown;
}

export interface EvidenceManifest {
  source_manifest_digest?: string;
  accepted_observation_manifest?: unknown;
  sources?: unknown;
  [key: string]: unknown;
}

export interface VerdictBase {
  state: VerdictState;
  claimKey: string;
  checkedAt: string;
  chainId: typeof MARGIN_CHAIN_ID;
  marginAddress: HexAddress;
  assurance: 'COVERED' | 'NONE' | 'UNAVAILABLE';
  reason: string;
}

export interface ApprovedVerdict extends VerdictBase {
  state: 'APPROVED';
  assurance: 'COVERED';
  status: 'SUPPORTED';
  assured: MarginAssuredClaim;
  covered: MarginCoveredClaim;
  coverage: MarginCoverage;
}

export interface NonApprovedVerdict extends VerdictBase {
  state: Exclude<VerdictState, 'APPROVED'>;
  assured?: MarginAssuredClaim | null;
  covered?: MarginCoveredClaim | null;
  coverage?: MarginCoverage | null;
}

export type MarginVerdict = ApprovedVerdict | NonApprovedVerdict;

export class MarginConnectError extends Error {
  readonly code: 'CONFIGURATION' | 'NETWORK' | 'MALFORMED_READ' | 'UNAVAILABLE';

  constructor(code: MarginConnectError['code'], message: string) {
    super(message);
    this.name = 'MarginConnectError';
    this.code = code;
  }
}

const commitmentShape = z.object({
  policyId: z.string().min(1).max(160),
  claimKey: claimKeySchema,
  canonicalUrl: z.string().url(),
  publisher: addressSchema,
  manifestDigest: digestSchema,
  evidencePackDigest: digestSchema,
  primaryArtifactSha256: digestSchema,
  repository: z.string().regex(/^[^/\s]+\/[^/\s]+$/),
  commitSha: z.string().regex(/^[0-9a-f]{40}$/i),
  releaseArtifactSha256: digestSchema,
  policyHash: digestSchema,
}).strict();

const configShape = z.object({
  marginAddress: addressSchema,
  consumerAddress: addressSchema,
  policyCommitment: commitmentShape,
  expectedContractCodeSha256: digestSchema.optional(),
  client: z.custom<MarginReadClient>().optional(),
}).strict();

function asAddress(value: string): HexAddress {
  return value as HexAddress;
}

function asDigest(value: string): string {
  return value.toLowerCase();
}

function parseNonNegativeBigInt(value: unknown, field: string): bigint {
  if (typeof value === 'bigint' && value >= 0n) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  throw new MarginConnectError('MALFORMED_READ', `${field} is not a non-negative integer.`);
}

function parseObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MarginConnectError('MALFORMED_READ', `${label} returned a malformed object.`);
  }
  return value as Record<string, unknown>;
}

function isEmptyObject(value: Record<string, unknown>): boolean {
  return Object.keys(value).length === 0;
}

export function canonicalJson(value: unknown): string {
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function sha256Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new MarginConnectError('UNAVAILABLE', 'Web Crypto SHA-256 is unavailable in this runtime.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function computePolicyCommitmentHash(
  commitment: Omit<MarginPolicyCommitment, 'policyHash'>,
): Promise<string> {
  return sha256Hex(canonicalJson(commitment));
}

function parseClaim(value: unknown): MarginClaim | null {
  const object = parseObject(value, 'get_claim');
  if (isEmptyObject(object)) return null;
  if (typeof object.claim_key !== 'string' || !claimKeySchema.safeParse(object.claim_key).success) {
    throw new MarginConnectError('MALFORMED_READ', 'get_claim returned an invalid claim key.');
  }
  if (typeof object.canonical_url !== 'string' || typeof object.status !== 'string') {
    throw new MarginConnectError('MALFORMED_READ', 'get_claim omitted required identity fields.');
  }
  return object as MarginClaim;
}

function parseAssured(value: unknown): MarginAssuredClaim | null {
  const object = parseObject(value, 'get_assured_claim');
  if (isEmptyObject(object)) return null;
  if (typeof object.claim_key !== 'string' || typeof object.state !== 'string' || typeof object.final_status !== 'string') {
    throw new MarginConnectError('MALFORMED_READ', 'get_assured_claim omitted required finality fields.');
  }
  return object as MarginAssuredClaim;
}

function parseCovered(value: unknown): MarginCoveredClaim | null {
  const object = parseObject(value, 'get_covered_claim');
  if (isEmptyObject(object)) return null;
  const required = ['claim_key', 'publisher', 'manifest_digest', 'evidence_pack_digest', 'primary_artifact_sha256', 'state', 'final_status'];
  if (required.some((field) => typeof object[field] !== 'string')) {
    throw new MarginConnectError('MALFORMED_READ', 'get_covered_claim omitted a required commitment.');
  }
  parseNonNegativeBigInt(object.coverage_cap, 'coverage_cap');
  return object as MarginCoveredClaim;
}

export class MarginConnect {
  readonly config: Readonly<MarginConnectConfig>;
  private readonly client: MarginReadClient;

  constructor(config: MarginConnectConfig) {
    const parsed = configShape.safeParse(config);
    if (!parsed.success) {
      throw new MarginConnectError('CONFIGURATION', parsed.error.issues.map((issue) => issue.path.join('.') + ': ' + issue.message).join('; '));
    }
    this.config = {
      ...parsed.data,
      marginAddress: asAddress(parsed.data.marginAddress),
      consumerAddress: asAddress(parsed.data.consumerAddress),
      policyCommitment: {
        ...parsed.data.policyCommitment,
        publisher: asAddress(parsed.data.policyCommitment.publisher),
        manifestDigest: asDigest(parsed.data.policyCommitment.manifestDigest),
        evidencePackDigest: asDigest(parsed.data.policyCommitment.evidencePackDigest),
        primaryArtifactSha256: asDigest(parsed.data.policyCommitment.primaryArtifactSha256),
        releaseArtifactSha256: asDigest(parsed.data.policyCommitment.releaseArtifactSha256),
        policyHash: asDigest(parsed.data.policyCommitment.policyHash),
      },
    };
    this.client = config.client ?? (createClient({ chain: studionet }) as unknown as MarginReadClient);
  }

  private async read(functionName: string, args: unknown[] = []): Promise<unknown> {
    try {
      return await this.client.readContract({
        address: this.config.marginAddress,
        functionName,
        args,
        transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
      });
    } catch (error) {
      throw new MarginConnectError('UNAVAILABLE', `${functionName} could not be read from LATEST_FINAL: ${String(error)}`);
    }
  }

  async getNetworkIdentity(): Promise<NetworkIdentity> {
    const raw = parseObject(await this.read('network'), 'network');
    const chainId = parseNonNegativeBigInt(raw.chain_id, 'network.chain_id');
    if (Number(chainId) !== MARGIN_CHAIN_ID || raw.network !== MARGIN_NETWORK || raw.rpc !== MARGIN_RPC) {
      throw new MarginConnectError('NETWORK', 'The configured MARGIN address is not the exact Studionet 61999 deployment.');
    }
    return { network: MARGIN_NETWORK, chainId: MARGIN_CHAIN_ID, rpc: MARGIN_RPC };
  }

  private async verifyContractIdentity(): Promise<void> {
    await this.getNetworkIdentity();
    const expectedCode = this.config.expectedContractCodeSha256;
    if (expectedCode) {
      if (!this.client.getContractCode) throw new MarginConnectError('UNAVAILABLE', 'The client cannot verify deployed contract code.');
      const code = await this.client.getContractCode(this.config.marginAddress);
      const actual = await sha256Hex(code);
      if (actual.toLowerCase() !== expectedCode.toLowerCase()) {
        throw new MarginConnectError('NETWORK', 'The deployed MARGIN source identity does not match the configured commitment.');
      }
    }
  }

  async getClaim(): Promise<MarginClaim | null> {
    await this.verifyContractIdentity();
    const claim = parseClaim(await this.read('get_claim', [this.config.policyCommitment.claimKey]));
    if (claim && claim.claim_key.toLowerCase() !== this.config.policyCommitment.claimKey.toLowerCase()) {
      throw new MarginConnectError('MALFORMED_READ', 'MARGIN returned a different claim key.');
    }
    return claim;
  }

  async getAssuredClaim(): Promise<MarginAssuredClaim | null> {
    await this.verifyContractIdentity();
    const assured = parseAssured(await this.read('get_assured_claim', [this.config.policyCommitment.claimKey]));
    if (assured && assured.claim_key.toLowerCase() !== this.config.policyCommitment.claimKey.toLowerCase()) {
      throw new MarginConnectError('MALFORMED_READ', 'MARGIN returned a different Assured Claim key.');
    }
    return assured;
  }

  async getCoveredClaim(): Promise<MarginCoveredClaim | null> {
    await this.verifyContractIdentity();
    const covered = parseCovered(await this.read('get_covered_claim', [this.config.policyCommitment.claimKey]));
    if (covered && covered.claim_key.toLowerCase() !== this.config.policyCommitment.claimKey.toLowerCase()) {
      throw new MarginConnectError('MALFORMED_READ', 'MARGIN returned a different Covered Claim key.');
    }
    return covered;
  }

  async getCoverage(): Promise<MarginCoverage | null> {
    await this.verifyContractIdentity();
    const raw = parseObject(await this.read('get_coverage_state', [this.config.policyCommitment.claimKey]), 'get_coverage_state');
    if (isEmptyObject(raw)) return null;
    if (raw.claim_key !== this.config.policyCommitment.claimKey) throw new MarginConnectError('MALFORMED_READ', 'Coverage returned a different claim key.');
    if (typeof raw.canonical_consumer !== 'string' || raw.canonical_consumer.toLowerCase() !== this.config.consumerAddress.toLowerCase()) {
      throw new MarginConnectError('MALFORMED_READ', 'Coverage is not bound to the configured canonical consumer.');
    }
    if (typeof raw.registration_open !== 'boolean' || typeof raw.state !== 'string' || typeof raw.final_status !== 'string') {
      throw new MarginConnectError('MALFORMED_READ', 'Coverage omitted authoritative state fields.');
    }
    const coverageCap = parseNonNegativeBigInt(raw.coverage_cap, 'coverage_cap');
    const activeExposure = parseNonNegativeBigInt(raw.active_exposure, 'active_exposure');
    const availableCoverage = parseNonNegativeBigInt(raw.available_coverage, 'available_coverage');
    if (activeExposure > coverageCap) throw new MarginConnectError('MALFORMED_READ', 'Coverage exposure exceeds the cap.');
    if (!raw.registration_open && availableCoverage !== 0n) throw new MarginConnectError('MALFORMED_READ', 'Terminal coverage returned non-zero availability.');
    if (raw.registration_open && availableCoverage !== coverageCap - activeExposure) throw new MarginConnectError('MALFORMED_READ', 'Coverage arithmetic is inconsistent.');
    return { ...raw, coverage_cap: coverageCap, active_exposure: activeExposure, available_coverage: availableCoverage } as MarginCoverage;
  }

  async getEvidenceManifest(): Promise<EvidenceManifest | null> {
    const claim = await this.getClaim();
    if (!claim) return null;
    const manifest = claim.latest_manifest;
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      throw new MarginConnectError('MALFORMED_READ', 'The finalized claim did not return an evidence manifest.');
    }
    if (typeof claim.source_manifest_digest !== 'string' || claim.source_manifest_digest.toLowerCase() !== this.config.policyCommitment.manifestDigest.toLowerCase()) {
      throw new MarginConnectError('MALFORMED_READ', 'The evidence manifest digest does not match the policy commitment.');
    }
    return manifest as EvidenceManifest;
  }

  private async validatePolicyHash(): Promise<boolean> {
    const { policyHash: supplied, ...withoutHash } = this.config.policyCommitment;
    const expected = await computePolicyCommitmentHash(withoutHash);
    return expected.toLowerCase() === supplied.toLowerCase();
  }

  async evaluatePolicy(expected?: Partial<ArtifactBinding>): Promise<MarginVerdict> {
    const checkedAt = new Date().toISOString();
    const base = { claimKey: this.config.policyCommitment.claimKey, checkedAt, chainId: MARGIN_CHAIN_ID as 61999, marginAddress: this.config.marginAddress };
    try {
      await this.verifyContractIdentity();
      if (!(await this.validatePolicyHash())) return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'The policy commitment hash is invalid.' };
      const binding: ArtifactBinding = {
        repository: expected?.repository ?? this.config.policyCommitment.repository,
        commitSha: expected?.commitSha ?? this.config.policyCommitment.commitSha,
        releaseArtifactSha256: expected?.releaseArtifactSha256 ?? this.config.policyCommitment.releaseArtifactSha256,
      };
      if (binding.repository !== this.config.policyCommitment.repository || binding.commitSha.toLowerCase() !== this.config.policyCommitment.commitSha.toLowerCase() || binding.releaseArtifactSha256.toLowerCase() !== this.config.policyCommitment.releaseArtifactSha256.toLowerCase()) {
        return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'The release artifact or source commit does not match the immutable policy binding.' };
      }
      const claim = await this.getClaim();
      if (!claim) return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'The configured claim does not exist in finalized MARGIN state.' };
      if (claim.canonical_url !== this.config.policyCommitment.canonicalUrl) return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'The canonical URL does not match the immutable policy binding.' };
      const covered = await this.getCoveredClaim();
      if (!covered) return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'An ordinary or unregistered claim cannot authorize this policy.' };
      if (covered.publisher.toLowerCase() !== this.config.policyCommitment.publisher.toLowerCase() || covered.manifest_digest.toLowerCase() !== this.config.policyCommitment.manifestDigest.toLowerCase() || covered.evidence_pack_digest.toLowerCase() !== this.config.policyCommitment.evidencePackDigest.toLowerCase() || covered.primary_artifact_sha256.toLowerCase() !== this.config.policyCommitment.primaryArtifactSha256.toLowerCase()) {
        return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'The Covered Claim commitments do not match the immutable policy binding.', covered };
      }
      const assured = await this.getAssuredClaim();
      if (!assured) return { ...base, state: 'DENIED', assurance: 'NONE', reason: 'The Covered Claim has no Assured Claim lifecycle.', covered };
      const terminal = assured.state === 'SETTLED' && assured.settled === true;
      if (!terminal) return { ...base, state: 'PENDING', assurance: 'COVERED', reason: 'The Assured Claim is not finalized and settled.', assured, covered };
      if (assured.final_status !== 'SUPPORTED' || claim.status !== 'SUPPORTED' || covered.state !== 'SETTLED' || covered.final_status !== 'SUPPORTED') {
        return { ...base, state: 'DENIED', assurance: 'COVERED', reason: 'The finalized Covered Claim is not SUPPORTED.', assured, covered };
      }
      const coverage = await this.getCoverage();
      if (!coverage) return { ...base, state: 'UNAVAILABLE', assurance: 'UNAVAILABLE', reason: 'Canonical coverage state is unavailable.', assured, covered };
      return { ...base, state: 'APPROVED', assurance: 'COVERED', status: 'SUPPORTED', reason: 'Finalized Covered Claim is SUPPORTED and matches the exact policy binding.', assured, covered, coverage };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { ...base, state: 'UNAVAILABLE', assurance: 'UNAVAILABLE', reason };
    }
  }

  async getVerdict(): Promise<MarginVerdict> {
    return this.evaluatePolicy();
  }
}

export function createMarginConnect(config: MarginConnectConfig): MarginConnect {
  return new MarginConnect(config);
}

export function validateArtifactBinding(binding: ArtifactBinding): void {
  const parsed = z.object({ repository: z.string().regex(/^[^/\s]+\/[^/\s]+$/), commitSha: z.string().regex(/^[0-9a-f]{40}$/i), releaseArtifactSha256: digestSchema }).safeParse(binding);
  if (!parsed.success) throw new MarginConnectError('CONFIGURATION', 'Artifact binding is malformed.');
}
