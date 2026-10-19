"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
__export(index_exports, {
  LATEST_FINAL: () => LATEST_FINAL,
  MARGIN_CHAIN_ID: () => MARGIN_CHAIN_ID,
  MARGIN_CONNECT_VERSION: () => MARGIN_CONNECT_VERSION,
  MARGIN_NETWORK: () => MARGIN_NETWORK,
  MARGIN_RPC: () => MARGIN_RPC,
  MarginConnect: () => MarginConnect,
  MarginConnectError: () => MarginConnectError,
  canonicalJson: () => canonicalJson,
  computePolicyCommitmentHash: () => computePolicyCommitmentHash,
  createMarginConnect: () => createMarginConnect,
  sha256Hex: () => sha256Hex,
  validateArtifactBinding: () => validateArtifactBinding
});
module.exports = __toCommonJS(index_exports);
var import_genlayer_js = require("genlayer-js");
var import_chains = require("genlayer-js/chains");
var import_types = require("genlayer-js/types");
var import_zod = require("zod");
const MARGIN_CONNECT_VERSION = "0.1.0";
const MARGIN_CHAIN_ID = 61999;
const MARGIN_NETWORK = "studionet";
const MARGIN_RPC = "https://studio.genlayer.com/api";
const LATEST_FINAL = import_types.TransactionHashVariant.LATEST_FINAL;
const addressSchema = import_zod.z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const digestSchema = import_zod.z.string().regex(/^[0-9a-f]{64}$/i);
const claimKeySchema = digestSchema;
class MarginConnectError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "MarginConnectError";
    this.code = code;
  }
}
const commitmentShape = import_zod.z.object({
  policyId: import_zod.z.string().min(1).max(160),
  claimKey: claimKeySchema,
  canonicalUrl: import_zod.z.string().url(),
  publisher: addressSchema,
  manifestDigest: digestSchema,
  evidencePackDigest: digestSchema,
  primaryArtifactSha256: digestSchema,
  repository: import_zod.z.string().regex(/^[^/\s]+\/[^/\s]+$/),
  commitSha: import_zod.z.string().regex(/^[0-9a-f]{40}$/i),
  releaseArtifactSha256: digestSchema,
  policyHash: digestSchema
}).strict();
const configShape = import_zod.z.object({
  marginAddress: addressSchema,
  consumerAddress: addressSchema,
  policyCommitment: commitmentShape,
  expectedContractCodeSha256: digestSchema.optional(),
  client: import_zod.z.custom().optional()
}).strict();
function asAddress(value) {
  return value;
}
function asDigest(value) {
  return value.toLowerCase();
}
function parseNonNegativeBigInt(value, field) {
  if (typeof value === "bigint" && value >= 0n) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  throw new MarginConnectError("MALFORMED_READ", `${field} is not a non-negative integer.`);
}
function parseObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MarginConnectError("MALFORMED_READ", `${label} returned a malformed object.`);
  }
  return value;
}
function isEmptyObject(value) {
  return Object.keys(value).length === 0;
}
function canonicalJson(value) {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) {
    throw new MarginConnectError("UNAVAILABLE", "Web Crypto SHA-256 is unavailable in this runtime.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function computePolicyCommitmentHash(commitment) {
  return sha256Hex(canonicalJson(commitment));
}
function parseClaim(value) {
  const object = parseObject(value, "get_claim");
  if (isEmptyObject(object)) return null;
  if (typeof object.claim_key !== "string" || !claimKeySchema.safeParse(object.claim_key).success) {
    throw new MarginConnectError("MALFORMED_READ", "get_claim returned an invalid claim key.");
  }
  if (typeof object.canonical_url !== "string" || typeof object.status !== "string") {
    throw new MarginConnectError("MALFORMED_READ", "get_claim omitted required identity fields.");
  }
  return object;
}
function parseAssured(value) {
  const object = parseObject(value, "get_assured_claim");
  if (isEmptyObject(object)) return null;
  if (typeof object.claim_key !== "string" || typeof object.state !== "string" || typeof object.final_status !== "string") {
    throw new MarginConnectError("MALFORMED_READ", "get_assured_claim omitted required finality fields.");
  }
  return object;
}
function parseCovered(value) {
  const object = parseObject(value, "get_covered_claim");
  if (isEmptyObject(object)) return null;
  const required = ["claim_key", "publisher", "manifest_digest", "evidence_pack_digest", "primary_artifact_sha256", "state", "final_status"];
  if (required.some((field) => typeof object[field] !== "string")) {
    throw new MarginConnectError("MALFORMED_READ", "get_covered_claim omitted a required commitment.");
  }
  parseNonNegativeBigInt(object.coverage_cap, "coverage_cap");
  return object;
}
class MarginConnect {
  config;
  client;
  constructor(config) {
    const parsed = configShape.safeParse(config);
    if (!parsed.success) {
      throw new MarginConnectError("CONFIGURATION", parsed.error.issues.map((issue) => issue.path.join(".") + ": " + issue.message).join("; "));
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
        policyHash: asDigest(parsed.data.policyCommitment.policyHash)
      }
    };
    this.client = config.client ?? (0, import_genlayer_js.createClient)({ chain: import_chains.studionet });
  }
  async read(functionName, args = []) {
    try {
      return await this.client.readContract({
        address: this.config.marginAddress,
        functionName,
        args,
        transactionHashVariant: import_types.TransactionHashVariant.LATEST_FINAL
      });
    } catch (error) {
      throw new MarginConnectError("UNAVAILABLE", `${functionName} could not be read from LATEST_FINAL: ${String(error)}`);
    }
  }
  async getNetworkIdentity() {
    const raw = parseObject(await this.read("network"), "network");
    const chainId = parseNonNegativeBigInt(raw.chain_id, "network.chain_id");
    if (Number(chainId) !== MARGIN_CHAIN_ID || raw.network !== MARGIN_NETWORK || raw.rpc !== MARGIN_RPC) {
      throw new MarginConnectError("NETWORK", "The configured MARGIN address is not the exact Studionet 61999 deployment.");
    }
    return { network: MARGIN_NETWORK, chainId: MARGIN_CHAIN_ID, rpc: MARGIN_RPC };
  }
  async verifyContractIdentity() {
    await this.getNetworkIdentity();
    const expectedCode = this.config.expectedContractCodeSha256;
    if (expectedCode) {
      if (!this.client.getContractCode) throw new MarginConnectError("UNAVAILABLE", "The client cannot verify deployed contract code.");
      const code = await this.client.getContractCode(this.config.marginAddress);
      const actual = await sha256Hex(code);
      if (actual.toLowerCase() !== expectedCode.toLowerCase()) {
        throw new MarginConnectError("NETWORK", "The deployed MARGIN source identity does not match the configured commitment.");
      }
    }
  }
  async getClaim() {
    await this.verifyContractIdentity();
    const claim = parseClaim(await this.read("get_claim", [this.config.policyCommitment.claimKey]));
    if (claim && claim.claim_key.toLowerCase() !== this.config.policyCommitment.claimKey.toLowerCase()) {
      throw new MarginConnectError("MALFORMED_READ", "MARGIN returned a different claim key.");
    }
    return claim;
  }
  async getAssuredClaim() {
    await this.verifyContractIdentity();
    const assured = parseAssured(await this.read("get_assured_claim", [this.config.policyCommitment.claimKey]));
    if (assured && assured.claim_key.toLowerCase() !== this.config.policyCommitment.claimKey.toLowerCase()) {
      throw new MarginConnectError("MALFORMED_READ", "MARGIN returned a different Assured Claim key.");
    }
    return assured;
  }
  async getCoveredClaim() {
    await this.verifyContractIdentity();
    const covered = parseCovered(await this.read("get_covered_claim", [this.config.policyCommitment.claimKey]));
    if (covered && covered.claim_key.toLowerCase() !== this.config.policyCommitment.claimKey.toLowerCase()) {
      throw new MarginConnectError("MALFORMED_READ", "MARGIN returned a different Covered Claim key.");
    }
    return covered;
  }
  async getCoverage() {
    await this.verifyContractIdentity();
    const raw = parseObject(await this.read("get_coverage_state", [this.config.policyCommitment.claimKey]), "get_coverage_state");
    if (isEmptyObject(raw)) return null;
    if (raw.claim_key !== this.config.policyCommitment.claimKey) throw new MarginConnectError("MALFORMED_READ", "Coverage returned a different claim key.");
    if (typeof raw.canonical_consumer !== "string" || raw.canonical_consumer.toLowerCase() !== this.config.consumerAddress.toLowerCase()) {
      throw new MarginConnectError("MALFORMED_READ", "Coverage is not bound to the configured canonical consumer.");
    }
    if (typeof raw.registration_open !== "boolean" || typeof raw.state !== "string" || typeof raw.final_status !== "string") {
      throw new MarginConnectError("MALFORMED_READ", "Coverage omitted authoritative state fields.");
    }
    const coverageCap = parseNonNegativeBigInt(raw.coverage_cap, "coverage_cap");
    const activeExposure = parseNonNegativeBigInt(raw.active_exposure, "active_exposure");
    const availableCoverage = parseNonNegativeBigInt(raw.available_coverage, "available_coverage");
    if (activeExposure > coverageCap) throw new MarginConnectError("MALFORMED_READ", "Coverage exposure exceeds the cap.");
    if (!raw.registration_open && availableCoverage !== 0n) throw new MarginConnectError("MALFORMED_READ", "Terminal coverage returned non-zero availability.");
    if (raw.registration_open && availableCoverage !== coverageCap - activeExposure) throw new MarginConnectError("MALFORMED_READ", "Coverage arithmetic is inconsistent.");
    return { ...raw, coverage_cap: coverageCap, active_exposure: activeExposure, available_coverage: availableCoverage };
  }
  async getEvidenceManifest() {
    const claim = await this.getClaim();
    if (!claim) return null;
    const manifest = claim.latest_manifest;
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      throw new MarginConnectError("MALFORMED_READ", "The finalized claim did not return an evidence manifest.");
    }
    if (typeof claim.source_manifest_digest !== "string" || claim.source_manifest_digest.toLowerCase() !== this.config.policyCommitment.manifestDigest.toLowerCase()) {
      throw new MarginConnectError("MALFORMED_READ", "The evidence manifest digest does not match the policy commitment.");
    }
    return manifest;
  }
  async validatePolicyHash() {
    const { policyHash: supplied, ...withoutHash } = this.config.policyCommitment;
    const expected = await computePolicyCommitmentHash(withoutHash);
    return expected.toLowerCase() === supplied.toLowerCase();
  }
  async evaluatePolicy(expected) {
    const checkedAt = (/* @__PURE__ */ new Date()).toISOString();
    const base = { claimKey: this.config.policyCommitment.claimKey, checkedAt, chainId: MARGIN_CHAIN_ID, marginAddress: this.config.marginAddress };
    try {
      await this.verifyContractIdentity();
      if (!await this.validatePolicyHash()) return { ...base, state: "DENIED", assurance: "NONE", reason: "The policy commitment hash is invalid." };
      const binding = {
        repository: expected?.repository ?? this.config.policyCommitment.repository,
        commitSha: expected?.commitSha ?? this.config.policyCommitment.commitSha,
        releaseArtifactSha256: expected?.releaseArtifactSha256 ?? this.config.policyCommitment.releaseArtifactSha256
      };
      if (binding.repository !== this.config.policyCommitment.repository || binding.commitSha.toLowerCase() !== this.config.policyCommitment.commitSha.toLowerCase() || binding.releaseArtifactSha256.toLowerCase() !== this.config.policyCommitment.releaseArtifactSha256.toLowerCase()) {
        return { ...base, state: "DENIED", assurance: "NONE", reason: "The release artifact or source commit does not match the immutable policy binding." };
      }
      const claim = await this.getClaim();
      if (!claim) return { ...base, state: "DENIED", assurance: "NONE", reason: "The configured claim does not exist in finalized MARGIN state." };
      if (claim.canonical_url !== this.config.policyCommitment.canonicalUrl) return { ...base, state: "DENIED", assurance: "NONE", reason: "The canonical URL does not match the immutable policy binding." };
      const covered = await this.getCoveredClaim();
      if (!covered) return { ...base, state: "DENIED", assurance: "NONE", reason: "An ordinary or unregistered claim cannot authorize this policy." };
      if (covered.publisher.toLowerCase() !== this.config.policyCommitment.publisher.toLowerCase() || covered.manifest_digest.toLowerCase() !== this.config.policyCommitment.manifestDigest.toLowerCase() || covered.evidence_pack_digest.toLowerCase() !== this.config.policyCommitment.evidencePackDigest.toLowerCase() || covered.primary_artifact_sha256.toLowerCase() !== this.config.policyCommitment.primaryArtifactSha256.toLowerCase()) {
        return { ...base, state: "DENIED", assurance: "NONE", reason: "The Covered Claim commitments do not match the immutable policy binding.", covered };
      }
      const assured = await this.getAssuredClaim();
      if (!assured) return { ...base, state: "DENIED", assurance: "NONE", reason: "The Covered Claim has no Assured Claim lifecycle.", covered };
      const terminal = assured.state === "SETTLED" && assured.settled === true;
      if (!terminal) return { ...base, state: "PENDING", assurance: "COVERED", reason: "The Assured Claim is not finalized and settled.", assured, covered };
      if (assured.final_status !== "SUPPORTED" || claim.status !== "SUPPORTED" || covered.state !== "SETTLED" || covered.final_status !== "SUPPORTED") {
        return { ...base, state: "DENIED", assurance: "COVERED", reason: "The finalized Covered Claim is not SUPPORTED.", assured, covered };
      }
      const coverage = await this.getCoverage();
      if (!coverage) return { ...base, state: "UNAVAILABLE", assurance: "UNAVAILABLE", reason: "Canonical coverage state is unavailable.", assured, covered };
      return { ...base, state: "APPROVED", assurance: "COVERED", status: "SUPPORTED", reason: "Finalized Covered Claim is SUPPORTED and matches the exact policy binding.", assured, covered, coverage };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { ...base, state: "UNAVAILABLE", assurance: "UNAVAILABLE", reason };
    }
  }
  async getVerdict() {
    return this.evaluatePolicy();
  }
}
function createMarginConnect(config) {
  return new MarginConnect(config);
}
function validateArtifactBinding(binding) {
  const parsed = import_zod.z.object({ repository: import_zod.z.string().regex(/^[^/\s]+\/[^/\s]+$/), commitSha: import_zod.z.string().regex(/^[0-9a-f]{40}$/i), releaseArtifactSha256: digestSchema }).safeParse(binding);
  if (!parsed.success) throw new MarginConnectError("CONFIGURATION", "Artifact binding is malformed.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LATEST_FINAL,
  MARGIN_CHAIN_ID,
  MARGIN_CONNECT_VERSION,
  MARGIN_NETWORK,
  MARGIN_RPC,
  MarginConnect,
  MarginConnectError,
  canonicalJson,
  computePolicyCommitmentHash,
  createMarginConnect,
  sha256Hex,
  validateArtifactBinding
});
//# sourceMappingURL=index.cjs.map
