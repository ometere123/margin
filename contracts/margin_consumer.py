# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Minimal reference consumer for finalized MARGIN Assured Claims.

This is intentionally not a second product. It demonstrates that a downstream
contract reads the canonical MARGIN state directly and does not trust a browser
badge, caller-supplied status, or signer-side cache.
"""
from genlayer import *


@gl.contract_interface
class MarginInterface:
    class View:
        def get_assured_claim(self, claim_key: str) -> dict: ...

    class Write:
        pass


class MarginConsumer(gl.Contract):
    canonical_margin_address: Address
    executed_claims: TreeMap[str, str]

    def __init__(self, canonical_margin_address: str):
        self.canonical_margin_address = Address(str(canonical_margin_address).strip())

    @gl.public.write
    def execute_if_supported(self, claim_key: str) -> None:
        claim_key = str(claim_key).strip().lower()
        margin = MarginInterface(self.canonical_margin_address)
        receipt = margin.view().get_assured_claim(claim_key)
        if not isinstance(receipt, dict) or receipt.get("state") != "SETTLED":
            raise gl.vm.UserError("assured claim is not finalized")
        if receipt.get("final_status") != "SUPPORTED":
            raise gl.vm.UserError("protected action requires a SUPPORTED assured claim")
        if claim_key in self.executed_claims:
            raise gl.vm.UserError("protected action already executed")
        self.executed_claims[claim_key] = gl.message.sender_address.as_hex

    @gl.public.view
    def has_executed(self, claim_key: str) -> bool:
        return str(claim_key).strip().lower() in self.executed_claims
