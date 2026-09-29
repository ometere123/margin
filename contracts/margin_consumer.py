# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Small downstream gate and protected-release reference consumer for MARGIN."""
from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timezone
import json


@allow_storage
@dataclass
class ProtectedRelease:
    release_id: str
    claim_key: str
    creator: Address
    beneficiary: Address
    amount: u256
    expiry: str
    executed: bool
    refunded: bool
    beneficiary_credit: u256
    creator_credit: u256


@gl.contract_interface
class MarginGate:
    class View:
        def get_claim(self, claim_key: str) -> dict: ...

        def get_assured_claim(self, claim_key: str) -> dict: ...

        def is_claim_supported(self, claim_key: str) -> bool: ...

    class Write:
        pass


@gl.evm.contract_interface
class ReleaseRecipient:
    class View:
        pass

    class Write:
        pass


class MarginConsumer(gl.Contract):
    MAX_RELEASES_PER_CREATOR_PER_CLAIM = 5
    canonical_margin_address: Address
    executed_claims: TreeMap[str, str]
    releases: TreeMap[str, ProtectedRelease]
    # JSON-encoded release-id lists keep the index bounded by the number of
    # funded releases without allowing a later release to hide an earlier one.
    release_ids_by_claim: TreeMap[str, str]
    release_ids_by_creator_claim: TreeMap[str, str]
    release_count: u256

    def __init__(self, canonical_margin_address: str):
        self.canonical_margin_address = Address(str(canonical_margin_address).strip())
        self.release_count = u256(0)

    def _margin(self):
        return MarginGate(self.canonical_margin_address)

    def _release_dict(self, record: ProtectedRelease) -> dict:
        return {
            "release_id": record.release_id,
            "claim_key": record.claim_key,
            "creator": record.creator.as_hex,
            "beneficiary": record.beneficiary.as_hex,
            "amount": record.amount,
            "expiry": record.expiry,
            "executed": record.executed,
            "refunded": record.refunded,
            "beneficiary_credit": record.beneficiary_credit,
            "creator_credit": record.creator_credit,
        }

    def _expiry(self, value: str) -> datetime:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            raise gl.vm.UserError("release expiry must include a timezone")
        return parsed.astimezone(timezone.utc)

    def _creator_claim_index_key(self, claim_key: str, creator: Address) -> str:
        return f"{str(claim_key).strip().lower()}:{creator.as_hex.lower()}"

    @gl.public.view
    def is_claim_supported(self, claim_key: str) -> bool:
        return bool(self._margin().view().is_claim_supported(str(claim_key).strip().lower()))

    @gl.public.write
    def execute_if_supported(self, claim_key: str) -> None:
        """Legacy compatibility gate; funded releases are the primary consumer path."""
        claim_key = str(claim_key).strip().lower()
        receipt = self._margin().view().get_assured_claim(claim_key)
        if not isinstance(receipt, dict) or receipt.get("state") != "SETTLED":
            raise gl.vm.UserError("assured claim is not finalized")
        if receipt.get("final_status") != "SUPPORTED":
            raise gl.vm.UserError("protected action requires a SUPPORTED assured claim")
        if claim_key in self.executed_claims:
            raise gl.vm.UserError("protected action already executed")
        self.executed_claims[claim_key] = gl.message.sender_address.as_hex

    @gl.public.write.payable
    def create_protected_release(self, claim_key: str, beneficiary: str, expiry: str) -> str:
        claim_key = str(claim_key).strip().lower()
        if claim_key == "":
            raise gl.vm.UserError("claim key is required")
        if int(gl.message.value) <= 0:
            raise gl.vm.UserError("release amount must be positive")
        beneficiary_address = Address(str(beneficiary).strip())
        expiry_dt = self._expiry(expiry)
        if expiry_dt <= datetime.now(timezone.utc):
            raise gl.vm.UserError("release expiry must be in the future")
        margin = self._margin().view()
        claim = margin.get_claim(claim_key)
        if not isinstance(claim, dict) or str(claim.get("claim_key", "")).strip().lower() != claim_key:
            raise gl.vm.UserError("protected release requires an existing MARGIN claim")
        assured = margin.get_assured_claim(claim_key)
        if not isinstance(assured, dict) or str(assured.get("claim_key", "")).strip().lower() != claim_key:
            raise gl.vm.UserError("protected release requires an existing Assured Claim")
        if assured.get("state") not in ("REGISTERED", "CHALLENGED", "RESOLVED", "APPEALED"):
            raise gl.vm.UserError("protected release must be committed before final settlement")
        release_ids = self._release_ids_for_claim(claim_key)
        creator_key = self._creator_claim_index_key(claim_key, gl.message.sender_address)
        creator_release_ids = self._release_ids_for_creator_claim(creator_key)
        if len(creator_release_ids) >= self.MAX_RELEASES_PER_CREATOR_PER_CLAIM:
            raise gl.vm.UserError("maximum protected releases reached for creator and claim")
        release_id = f"{int(self.release_count)}:{claim_key}"
        self.release_count = u256(int(self.release_count) + 1)
        zero = u256(0)
        self.releases[release_id] = ProtectedRelease(
            release_id=release_id,
            claim_key=claim_key,
            creator=gl.message.sender_address,
            beneficiary=beneficiary_address,
            amount=u256(gl.message.value),
            expiry=expiry_dt.isoformat(),
            executed=False,
            refunded=False,
            beneficiary_credit=zero,
            creator_credit=zero,
        )
        release_ids.append(release_id)
        self.release_ids_by_claim[claim_key] = json.dumps(release_ids, separators=(",", ":"))
        creator_release_ids.append(release_id)
        self.release_ids_by_creator_claim[creator_key] = json.dumps(creator_release_ids, separators=(",", ":"))
        return release_id

    @gl.public.write
    def execute_release(self, release_id: str) -> None:
        release_id = str(release_id).strip()
        if release_id not in self.releases:
            raise gl.vm.UserError("unknown protected release")
        record = gl.storage.copy_to_memory(self.releases[release_id])
        if record.executed or record.refunded:
            raise gl.vm.UserError("protected release already completed")
        if datetime.now(timezone.utc) >= self._expiry(record.expiry):
            raise gl.vm.UserError("protected release has expired")
        if not self.is_claim_supported(record.claim_key):
            raise gl.vm.UserError("protected release requires SETTLED SUPPORTED state")
        record.executed = True
        record.beneficiary_credit = record.beneficiary_credit + record.amount
        self.releases[release_id] = record

    @gl.public.write
    def refund_release(self, release_id: str) -> None:
        release_id = str(release_id).strip()
        if release_id not in self.releases:
            raise gl.vm.UserError("unknown protected release")
        record = gl.storage.copy_to_memory(self.releases[release_id])
        if gl.message.sender_address != record.creator:
            raise gl.vm.UserError("only the release creator may refund")
        if record.executed or record.refunded:
            raise gl.vm.UserError("protected release already completed")
        receipt = self._margin().view().get_assured_claim(record.claim_key)
        negative_terminal = isinstance(receipt, dict) and receipt.get("state") in ("SETTLED", "CANCELLED", "ABORTED") and receipt.get("final_status") != "SUPPORTED"
        if not negative_terminal and datetime.now(timezone.utc) < self._expiry(record.expiry):
            raise gl.vm.UserError("release is not refundable yet")
        record.refunded = True
        record.creator_credit = record.creator_credit + record.amount
        self.releases[release_id] = record

    @gl.public.write
    def withdraw_release_credit(self, release_id: str) -> None:
        release_id = str(release_id).strip()
        if release_id not in self.releases:
            raise gl.vm.UserError("unknown protected release")
        record = gl.storage.copy_to_memory(self.releases[release_id])
        sender = gl.message.sender_address
        if sender == record.beneficiary:
            amount = record.beneficiary_credit
            record.beneficiary_credit = u256(0)
        elif sender == record.creator:
            amount = record.creator_credit
            record.creator_credit = u256(0)
        else:
            raise gl.vm.UserError("caller has no release credit")
        if amount == u256(0):
            raise gl.vm.UserError("no release credit")
        self.releases[release_id] = record
        ReleaseRecipient(sender).emit_transfer(value=amount)

    @gl.public.view
    def get_release(self, release_id: str) -> dict:
        release_id = str(release_id).strip()
        if release_id not in self.releases:
            return {}
        return self._release_dict(self.releases[release_id])

    def _release_ids_for_claim(self, claim_key: str) -> list:
        encoded = self.release_ids_by_claim.get(str(claim_key).strip().lower(), "[]")
        try:
            value = json.loads(encoded)
        except Exception:
            raise gl.vm.UserError("protected release index is malformed")
        if not isinstance(value, list):
            raise gl.vm.UserError("protected release index is malformed")
        return [str(item) for item in value]

    def _release_ids_for_creator_claim(self, creator_key: str) -> list:
        encoded = self.release_ids_by_creator_claim.get(str(creator_key), "[]")
        try:
            value = json.loads(encoded)
        except Exception:
            raise gl.vm.UserError("protected creator release index is malformed")
        if not isinstance(value, list):
            raise gl.vm.UserError("protected creator release index is malformed")
        return [str(item) for item in value]

    @gl.public.view
    def get_releases_for_claim(self, claim_key: str) -> list:
        return [self.get_release(release_id) for release_id in self._release_ids_for_claim(claim_key)]

    @gl.public.view
    def get_releases_for_claim_page(self, claim_key: str, offset: int, limit: int) -> list:
        offset_value = int(offset)
        limit_value = int(limit)
        if offset_value < 0:
            raise gl.vm.UserError("release page offset must not be negative")
        if limit_value <= 0 or limit_value > 25:
            raise gl.vm.UserError("release page limit must be between 1 and 25")
        release_ids = self._release_ids_for_claim(claim_key)
        return [
            self.get_release(release_id)
            for release_id in release_ids[offset_value:offset_value + limit_value]
        ]

    @gl.public.view
    def get_release_for_claim(self, claim_key: str) -> dict:
        """Compatibility view returning the first release, if one exists."""
        releases = self.get_releases_for_claim(claim_key)
        return releases[0] if releases else {}

    @gl.public.view
    def has_executed(self, claim_key: str) -> bool:
        return str(claim_key).strip().lower() in self.executed_claims
