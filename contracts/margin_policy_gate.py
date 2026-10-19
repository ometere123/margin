# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Reference MARGIN Connect policy gate.

This is deliberately a separate, non-custodial Intelligent Contract.  It does
not replace or compete with the V2 canonical release consumer and never holds
release principal.  A policy is immutable at construction, reads finalized
MARGIN state directly, and records a bounded one-shot application action only
after the exact Covered Claim is settled SUPPORTED.
"""
from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timezone
import typing


EXPECTED_CHAIN_ID = 61999
MAX_POLICY_ID_CHARS = 160
MAX_ACTION_ID_CHARS = 128
MAX_ACTIONS = 64


@allow_storage
@dataclass
class PolicyAction:
    action_id: str
    action_digest: str
    claim_key: str
    policy_hash: str
    actor: Address
    executed_at: str


@gl.contract_interface
class MarginPolicyView:
    class View:
        def network(self) -> dict: ...

        def get_claim(self, claim_key: str) -> dict: ...

        def get_assured_claim(self, claim_key: str) -> dict: ...

        def get_covered_claim(self, claim_key: str) -> dict: ...

        def get_coverage_state(self, claim_key: str) -> dict: ...

    class Write:
        pass


class MarginPolicyGate(gl.Contract):
    """A bounded, immutable policy registration and one-shot action gate."""

    canonical_margin_address: Address
    policy_owner: Address
    policy_id: str
    claim_key: str
    canonical_url: str
    publisher: Address
    manifest_digest: str
    evidence_pack_digest: str
    primary_artifact_sha256: str
    policy_hash: str
    expires_at: str
    actions: TreeMap[str, PolicyAction]
    action_count: u32

    def __init__(
        self,
        canonical_margin_address: str,
        policy_id: str,
        claim_key: str,
        canonical_url: str,
        publisher: str,
        manifest_digest: str,
        evidence_pack_digest: str,
        primary_artifact_sha256: str,
        policy_hash: str,
        expires_at: str,
    ):
        try:
            margin = Address(str(canonical_margin_address).strip())
            owner = gl.message.sender_address
            publisher_address = Address(str(publisher).strip())
            zero = Address("0x" + "00" * 20)
        except Exception:
            raise gl.vm.UserError("policy addresses are malformed")
        if margin == zero or publisher_address == zero:
            raise gl.vm.UserError("policy addresses cannot be zero")
        normalized_policy_id = str(policy_id).strip()
        if len(normalized_policy_id) == 0 or len(normalized_policy_id) > MAX_POLICY_ID_CHARS:
            raise gl.vm.UserError("policy_id has invalid length")
        normalized_claim_key = str(claim_key).strip().lower()
        normalized_url = str(canonical_url).strip()
        if not self._is_hex_digest(normalized_claim_key):
            raise gl.vm.UserError("claim_key must be a 64-character hexadecimal digest")
        if not normalized_url.startswith("https://") or len(normalized_url) > 2048:
            raise gl.vm.UserError("canonical_url must be a bounded HTTPS URL")
        normalized_values = [
            ("manifest_digest", manifest_digest),
            ("evidence_pack_digest", evidence_pack_digest),
            ("primary_artifact_sha256", primary_artifact_sha256),
            ("policy_hash", policy_hash),
        ]
        for label, value in normalized_values:
            if not self._is_hex_digest(str(value).strip().lower()):
                raise gl.vm.UserError(f"{label} must be a 64-character hexadecimal digest")
        expiry = self._parse_expiry(expires_at)
        if expiry <= datetime.now(timezone.utc):
            raise gl.vm.UserError("policy expiry must be in the future")
        self.canonical_margin_address = margin
        self.policy_owner = owner
        self.policy_id = normalized_policy_id
        self.claim_key = normalized_claim_key
        self.canonical_url = normalized_url
        self.publisher = publisher_address
        self.manifest_digest = str(manifest_digest).strip().lower()
        self.evidence_pack_digest = str(evidence_pack_digest).strip().lower()
        self.primary_artifact_sha256 = str(primary_artifact_sha256).strip().lower()
        self.policy_hash = str(policy_hash).strip().lower()
        self.expires_at = expiry.isoformat()
        self.action_count = u32(0)

    def _is_hex_digest(self, value: str) -> bool:
        return len(value) == 64 and all(char in "0123456789abcdef" for char in value)

    def _is_address(self, value: str) -> bool:
        if len(value) != 42 or not value.startswith("0x"):
            return False
        return all(char in "0123456789abcdefABCDEF" for char in value[2:])

    def _parse_expiry(self, value: str) -> datetime:
        try:
            parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except Exception:
            raise gl.vm.UserError("policy expiry must be a valid ISO datetime")
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            raise gl.vm.UserError("policy expiry must include a timezone")
        return parsed.astimezone(timezone.utc)

    def _margin(self):
        return MarginPolicyView(self.canonical_margin_address).view()

    def _policy_dict(self) -> dict[str, typing.Any]:
        return {
            "policy_id": self.policy_id,
            "claim_key": self.claim_key,
            "canonical_url": self.canonical_url,
            "publisher": self.publisher.as_hex,
            "manifest_digest": self.manifest_digest,
            "evidence_pack_digest": self.evidence_pack_digest,
            "primary_artifact_sha256": self.primary_artifact_sha256,
            "policy_hash": self.policy_hash,
            "expires_at": self.expires_at,
            "owner": self.policy_owner.as_hex,
            "canonical_margin": self.canonical_margin_address.as_hex,
        }

    def _unavailable(self, reason: str) -> dict[str, typing.Any]:
        return {
            "state": "UNAVAILABLE",
            "reason": reason,
            "claim_key": self.claim_key,
            "policy_hash": self.policy_hash,
        }

    def _evaluate(self) -> dict[str, typing.Any]:
        if datetime.now(timezone.utc) >= self._parse_expiry(self.expires_at):
            return {"state": "DENIED", "reason": "policy has expired", "claim_key": self.claim_key, "policy_hash": self.policy_hash}
        try:
            margin = self._margin()
            network = margin.network()
            if not isinstance(network, dict) or int(network.get("chain_id", -1)) != EXPECTED_CHAIN_ID or network.get("network") != "studionet" or network.get("rpc") != "https://studio.genlayer.com/api":
                return self._unavailable("MARGIN network identity is not stable StudioNet 61999")
            claim = margin.get_claim(self.claim_key)
            if not isinstance(claim, dict) or str(claim.get("claim_key", "")).lower() != self.claim_key:
                return {"state": "DENIED", "reason": "configured claim does not exist", "claim_key": self.claim_key, "policy_hash": self.policy_hash}
            if str(claim.get("canonical_url", "")) != self.canonical_url:
                return {"state": "DENIED", "reason": "canonical URL does not match immutable policy", "claim_key": self.claim_key, "policy_hash": self.policy_hash}
            covered = margin.get_covered_claim(self.claim_key)
            if not isinstance(covered, dict) or str(covered.get("claim_key", "")).lower() != self.claim_key:
                return {"state": "DENIED", "reason": "ordinary or unregistered claim cannot authorize this policy", "claim_key": self.claim_key, "policy_hash": self.policy_hash}
            if (
                str(covered.get("publisher", "")).lower() != self.publisher.as_hex.lower()
                or str(covered.get("manifest_digest", "")).lower() != self.manifest_digest
                or str(covered.get("evidence_pack_digest", "")).lower() != self.evidence_pack_digest
                or str(covered.get("primary_artifact_sha256", "")).lower() != self.primary_artifact_sha256
            ):
                return {"state": "DENIED", "reason": "Covered Claim commitments do not match immutable policy", "claim_key": self.claim_key, "policy_hash": self.policy_hash}
            assured = margin.get_assured_claim(self.claim_key)
            if not isinstance(assured, dict) or str(assured.get("claim_key", "")).lower() != self.claim_key:
                return {"state": "DENIED", "reason": "Covered Claim has no Assured lifecycle", "claim_key": self.claim_key, "policy_hash": self.policy_hash}
            state = str(assured.get("state", ""))
            final_status = str(assured.get("final_status", ""))
            if state != "SETTLED" or assured.get("settled") is not True:
                return {"state": "PENDING", "reason": "Assured Claim is not finalized and settled", "claim_key": self.claim_key, "policy_hash": self.policy_hash, "assured_state": state, "final_status": final_status}
            if final_status != "SUPPORTED" or str(claim.get("status", "")) != "SUPPORTED" or str(covered.get("state", "")) != "SETTLED" or str(covered.get("final_status", "")) != "SUPPORTED":
                return {"state": "DENIED", "reason": "finalized Covered Claim is not SUPPORTED", "claim_key": self.claim_key, "policy_hash": self.policy_hash, "assured_state": state, "final_status": final_status}
            coverage = margin.get_coverage_state(self.claim_key)
            if not isinstance(coverage, dict) or str(coverage.get("claim_key", "")).lower() != self.claim_key:
                return self._unavailable("canonical coverage state is unreadable")
            active = int(coverage.get("active_exposure", -1))
            cap = int(coverage.get("coverage_cap", -1))
            available = int(coverage.get("available_coverage", -1))
            canonical_consumer = str(coverage.get("canonical_consumer", ""))
            registration_open = coverage.get("registration_open")
            if (
                active < 0
                or cap < 0
                or available < 0
                or active > cap
                or not self._is_address(canonical_consumer)
                or not isinstance(registration_open, bool)
                or (registration_open and available != cap - active)
                or (not registration_open and available != 0)
            ):
                return self._unavailable("canonical coverage state is malformed")
            return {
                "state": "APPROVED",
                "reason": "finalized Covered Claim is SUPPORTED and policy commitments match",
                "claim_key": self.claim_key,
                "policy_hash": self.policy_hash,
                "assured_state": state,
                "final_status": final_status,
                "coverage_cap": u256(cap),
                "active_exposure": u256(active),
                "available_coverage": u256(available),
                "registration_open": registration_open,
                "canonical_consumer": canonical_consumer,
            }
        except Exception:
            return self._unavailable("required finalized MARGIN state could not be read safely")

    @gl.public.view
    def get_policy(self) -> dict[str, typing.Any]:
        return self._policy_dict()

    @gl.public.view
    def evaluate_policy(self) -> dict[str, typing.Any]:
        return self._evaluate()

    @gl.public.view
    def get_action(self, action_id: str) -> dict[str, typing.Any]:
        normalized = str(action_id).strip()
        if normalized not in self.actions:
            return {}
        record = self.actions[normalized]
        return {
            "action_id": record.action_id,
            "action_digest": record.action_digest,
            "claim_key": record.claim_key,
            "policy_hash": record.policy_hash,
            "actor": record.actor.as_hex,
            "executed_at": record.executed_at,
        }

    @gl.public.view
    def action_count_read(self) -> u32:
        return self.action_count

    @gl.public.write
    def perform(self, action_id: str, action_digest: str) -> None:
        if gl.message.sender_address != self.policy_owner:
            raise gl.vm.UserError("only the policy owner may perform the downstream action")
        normalized_id = str(action_id).strip()
        normalized_digest = str(action_digest).strip().lower()
        if len(normalized_id) == 0 or len(normalized_id) > MAX_ACTION_ID_CHARS:
            raise gl.vm.UserError("action_id has invalid length")
        if not self._is_hex_digest(normalized_digest):
            raise gl.vm.UserError("action_digest must be a 64-character hexadecimal digest")
        if normalized_id in self.actions:
            raise gl.vm.UserError("action has already been performed")
        if int(self.action_count) >= MAX_ACTIONS:
            raise gl.vm.UserError("policy action capacity reached")
        decision = self._evaluate()
        if decision.get("state") != "APPROVED":
            raise gl.vm.UserError("policy is not approved")
        self.actions[normalized_id] = PolicyAction(
            action_id=normalized_id,
            action_digest=normalized_digest,
            claim_key=self.claim_key,
            policy_hash=self.policy_hash,
            actor=gl.message.sender_address,
            executed_at=datetime.now(timezone.utc).isoformat(),
        )
        self.action_count = u32(int(self.action_count) + 1)
