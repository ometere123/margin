"""Cross-contract Direct Mode coverage using real MARGIN and consumer instances."""

import hashlib
import json

from glsim.engine import SimEngine
from glsim.state import StateStore


URL = "https://example.com/docs/runtime"
PAGE_KEY = hashlib.sha256(URL.encode("utf-8")).hexdigest()
PAGE_DIGEST = "a" * 64
ALICE = "0x" + "11" * 20
BOB = "0x" + "22" * 20


def _claim_key() -> str:
    statement = "The current support matrix appears to require Node 20 or newer."
    payload = {
        "archiveUrl": "",
        "canonicalUrl": URL,
        "challengeStatement": statement,
        "claimClass": "COMPATIBILITY",
        "exact": "Runtime 4.2 supports Node 18 in production.",
        "evidenceUrls": ["https://example.com/docs/support"],
        "pageDigest": PAGE_DIGEST,
        "pageKey": PAGE_KEY,
        "prefix": "Compatibility notes say",
        "suffix": "See the support matrix below.",
        "v": 1,
    }
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def test_real_margin_and_bound_consumer_support_precommit_and_execution():
    """A funded release is created before settlement and executes from canonical state."""
    state = StateStore(chain_id=61999, seed="margin-consumer-integration")
    engine = SimEngine(state)
    engine.activate()
    try:
        margin_address, margin = engine.deploy("contracts/margin.py", sender=ALICE)
        consumer_address, consumer = engine.deploy(
            "contracts/margin_consumer.py", args=[margin_address], sender=ALICE
        )
        key = _claim_key()
        statement = "The current support matrix appears to require Node 20 or newer."

        engine.call_method(
            margin_address,
            "submit_claim",
            [
                key,
                PAGE_KEY,
                URL,
                "Runtime 4.2 supports Node 18 in production.",
                "Compatibility notes say",
                "See the support matrix below.",
                PAGE_DIGEST,
                "COMPATIBILITY",
                statement,
                json.dumps(["https://example.com/docs/support"]),
                "",
            ],
            sender=ALICE,
        )

        proof_expiry = "2999-01-01T00:00:00+00:00"
        nonce = "publisher-nonce-1"
        proof = json.dumps(
            {
                "protocol_version": 2,
                "domain": "example.com",
                "publisher_wallet": ALICE,
                "nonce": nonce,
                "claim_key": key,
                "expiry": proof_expiry,
            }
        )
        engine.vm.mock_web(
            r".*example\.com/\.well-known/margin\.json",
            {"status": 200, "body": proof},
        )
        engine.vm.value = 1
        engine.call_method(
            margin_address,
            "register_assured_claim",
            [key, "https://example.com/.well-known/margin.json", nonce, proof_expiry],
            sender=ALICE,
        )
        engine.vm.value = 1
        engine.call_method(margin_address, "challenge_assured_claim", [key], sender=BOB)

        body = "Support matrix: Runtime 4.2 supports Node 18 in production."
        engine.vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body})
        engine.vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body})
        records = [
            {
                "kind": "PRIMARY",
                "url": URL,
                "fetch_status": "OK",
                "content_digest": hashlib.sha256(body.encode()).hexdigest(),
                "provenance": "PUBLIC_SOURCE",
            },
            {
                "kind": "EVIDENCE",
                "url": "https://example.com/docs/support",
                "fetch_status": "OK",
                "content_digest": hashlib.sha256(body.encode()).hexdigest(),
                "provenance": "PUBLIC_SOURCE",
            },
        ]
        source_digest = hashlib.sha256(
            json.dumps({"v": 2, "sources": records}, separators=(",", ":"), sort_keys=True).encode()
        ).hexdigest()
        engine.vm.mock_llm(
            r".*MARGIN web-claim challenge.*",
            json.dumps(
                {
                    "status": "SUPPORTED",
                    "rationale": "Evidence supports the claim.",
                    "claim_present": True,
                    "supporting_source_indexes": [0],
                    "contradicting_source_indexes": [],
                    "historical_evidence_used": False,
                    "source_manifest_digest": source_digest,
                }
            ),
        )
        engine.call_method(margin_address, "resolve_assured_claim", [key], sender=BOB)

        # Pre-commit the funded consequence while the Assured claim is only RESOLVED.
        engine.vm.value = 3
        engine.call_method(
            consumer_address,
            "create_protected_release",
            [key, BOB, "2999-01-02T00:00:00+00:00"],
            sender=ALICE,
        )
        release = consumer.get_release_for_claim(key)
        assert release["amount"] == 3
        assert release["executed"] is False

        engine.vm.warp("2999-01-01T02:00:00+00:00")
        engine.call_method(margin_address, "settle_assured_claim", [key], sender=BOB)
        assert margin.get_assured_claim(key)["state"] == "SETTLED"
        assert margin.get_assured_claim(key)["final_status"] == "SUPPORTED"

        engine.call_method(consumer_address, "execute_release", [release["release_id"]], sender=BOB)
        executed = consumer.get_release(release["release_id"])
        assert executed["executed"] is True
        assert executed["beneficiary_credit"] == 3
        assert consumer.is_claim_supported(key) is True

        engine.call_method(
            consumer_address, "withdraw_release_credit", [release["release_id"]], sender=BOB
        )
        assert consumer.get_release(release["release_id"])["beneficiary_credit"] == 0
    finally:
        engine.deactivate()
