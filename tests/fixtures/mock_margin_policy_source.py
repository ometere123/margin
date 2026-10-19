# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Test-only cross-contract source for the MarginPolicyGate Direct Mode suite."""
from genlayer import *


class MockMarginPolicySource(gl.Contract):
    def __init__(self, mode: str, claim_key: str, canonical_url: str, publisher: str, manifest: str, evidence: str, primary: str):
        self.mode = str(mode)
        self.claim_key = str(claim_key).lower()
        self.canonical_url = str(canonical_url)
        self.publisher = str(publisher)
        self.manifest = str(manifest).lower()
        self.evidence = str(evidence).lower()
        self.primary = str(primary).lower()

    @gl.public.view
    def network(self) -> dict:
        if self.mode == "UNAVAILABLE":
            raise gl.vm.UserError("mock unavailable")
        return {"network": "studionet", "chain_id": u256(61999), "rpc": "https://studio.genlayer.com/api"}

    @gl.public.view
    def get_claim(self, claim_key: str) -> dict:
        if self.mode == "ORDINARY":
            return {"claim_key": self.claim_key, "canonical_url": self.canonical_url, "status": "SUPPORTED"}
        return {"claim_key": self.claim_key, "canonical_url": self.canonical_url, "status": "SUPPORTED"}

    @gl.public.view
    def get_assured_claim(self, claim_key: str) -> dict:
        if self.mode == "PENDING":
            return {"claim_key": self.claim_key, "state": "RESOLVED", "settled": False, "final_status": "SUPPORTED"}
        if self.mode == "NEGATIVE":
            return {"claim_key": self.claim_key, "state": "SETTLED", "settled": True, "final_status": "CONTRADICTED"}
        return {"claim_key": self.claim_key, "state": "SETTLED", "settled": True, "final_status": "SUPPORTED"}

    @gl.public.view
    def get_covered_claim(self, claim_key: str) -> dict:
        if self.mode == "ORDINARY":
            return {}
        return {
            "claim_key": self.claim_key,
            "publisher": self.publisher,
            "manifest_digest": self.manifest,
            "evidence_pack_digest": self.evidence,
            "primary_artifact_sha256": self.primary,
            "coverage_cap": u256(10),
            "state": "SETTLED" if self.mode != "PENDING" else "RESOLVED",
            "final_status": "SUPPORTED" if self.mode != "NEGATIVE" else "CONTRADICTED",
        }

    @gl.public.view
    def get_coverage_state(self, claim_key: str) -> dict:
        if self.mode == "MALFORMED":
            return {"claim_key": self.claim_key, "canonical_consumer": "not-an-address", "coverage_cap": "bad"}
        return {
            "claim_key": self.claim_key,
            "canonical_consumer": "0x" + "44" * 20,
            "coverage_cap": u256(10),
            "active_exposure": u256(0),
            "available_coverage": u256(0) if self.mode == "NEGATIVE" else u256(10),
            "registration_open": self.mode != "NEGATIVE",
            "state": "SETTLED" if self.mode == "NEGATIVE" else "REGISTERED",
            "final_status": "CONTRADICTED" if self.mode == "NEGATIVE" else "SUPPORTED",
        }
