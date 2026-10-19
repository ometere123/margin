import { TransactionHashVariant } from 'genlayer-js/types';
export declare const MARGIN_CONNECT_VERSION: "0.1.0";
export declare const MARGIN_CHAIN_ID: 61999;
export declare const MARGIN_NETWORK: "studionet";
export declare const MARGIN_RPC: "https://studio.genlayer.com/api";
export declare const LATEST_FINAL = TransactionHashVariant.LATEST_FINAL;
export type HexAddress = `0x${string}`;
export type HexDigest = string;
export type VerdictState = 'APPROVED' | 'DENIED' | 'PENDING' | 'UNAVAILABLE';
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
export declare class MarginConnectError extends Error {
    readonly code: 'CONFIGURATION' | 'NETWORK' | 'MALFORMED_READ' | 'UNAVAILABLE';
    constructor(code: MarginConnectError['code'], message: string);
}
export declare function canonicalJson(value: unknown): string;
export declare function sha256Hex(value: string): Promise<string>;
export declare function computePolicyCommitmentHash(commitment: Omit<MarginPolicyCommitment, 'policyHash'>): Promise<string>;
export declare class MarginConnect {
    readonly config: Readonly<MarginConnectConfig>;
    private readonly client;
    constructor(config: MarginConnectConfig);
    private read;
    getNetworkIdentity(): Promise<NetworkIdentity>;
    private verifyContractIdentity;
    getClaim(): Promise<MarginClaim | null>;
    getAssuredClaim(): Promise<MarginAssuredClaim | null>;
    getCoveredClaim(): Promise<MarginCoveredClaim | null>;
    getCoverage(): Promise<MarginCoverage | null>;
    getEvidenceManifest(): Promise<EvidenceManifest | null>;
    private validatePolicyHash;
    evaluatePolicy(expected?: Partial<ArtifactBinding>): Promise<MarginVerdict>;
    getVerdict(): Promise<MarginVerdict>;
}
export declare function createMarginConnect(config: MarginConnectConfig): MarginConnect;
export declare function validateArtifactBinding(binding: ArtifactBinding): void;
