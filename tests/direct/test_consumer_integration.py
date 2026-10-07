"""Cross-contract Direct Mode coverage using real MARGIN and consumer instances."""

import hashlib
import json
import pytest

from glsim.engine import SimEngine
from glsim.state import StateStore


URL = "https://example.com/docs/runtime"
PAGE_KEY = hashlib.sha256(URL.encode("utf-8")).hexdigest()
PAGE_DIGEST = "a" * 64
ALICE = "0x" + "11" * 20
BOB = "0x" + "22" * 20


def _claim_key(suffix: str = "") -> str:
    statement = "The current support matrix appears to require Node 20 or newer."
    payload = {
        "archiveUrl": "",
        "canonicalUrl": URL,
        "challengeStatement": statement + suffix,
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


CHARLIE = "0x" + "33" * 20


def _submit_real_claim(engine, margin_address, key, suffix=""):
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
            "The current support matrix appears to require Node 20 or newer." + suffix,
            json.dumps(["https://example.com/docs/support"]),
            "",
        ],
        sender=ALICE,
    )


def _prepare_assured(
    engine, margin_address, key, *, status=None, challenge=True,
    proof_expiry="2999-01-01T00:00:00+00:00"
):
    engine.vm.clear_mocks()
    nonce = "publisher-" + key[:8]
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
    if challenge:
        engine.vm.value = 1
        engine.call_method(margin_address, "challenge_assured_claim", [key], sender=BOB)
    if status is None:
        return

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
    candidate = {
        "status": status,
        "rationale": "The independently fetched evidence was adjudicated.",
        "claim_present": status != "STALE",
        "supporting_source_indexes": [0] if status == "SUPPORTED" else [],
        "contradicting_source_indexes": [0] if status == "CONTRADICTED" else [],
        "historical_evidence_used": False,
        "source_manifest_digest": source_digest,
    }
    engine.vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps(candidate))
    engine.call_method(margin_address, "resolve_assured_claim", [key], sender=BOB)


def _new_real_system(seed):
    state = StateStore(chain_id=61999, seed=seed)
    engine = SimEngine(state)
    engine.activate()
    margin_address, margin = engine.deploy("contracts/margin.py", sender=ALICE)
    consumer_address, consumer = engine.deploy(
        "contracts/margin_consumer.py", args=[margin_address], sender=ALICE
    )
    return engine, margin_address, margin, consumer_address, consumer


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

        # Pre-commit two independent funded consequences while the Assured claim is only RESOLVED.
        engine.vm.value = 3
        release_one_id = engine.call_method(
            consumer_address,
            "create_protected_release",
            [key, BOB, "2999-01-02T00:00:00+00:00"],
            sender=ALICE,
        )
        engine.vm.value = 4
        release_two_id = engine.call_method(
            consumer_address,
            "create_protected_release",
            [key, BOB, "2999-01-03T00:00:00+00:00"],
            sender=ALICE,
        )
        releases = consumer.get_releases_for_claim(key)
        assert [release["release_id"] for release in releases] == [release_one_id, release_two_id]
        assert releases[0]["amount"] == 3
        assert releases[1]["amount"] == 4
        assert all(release["executed"] is False for release in releases)

        engine.vm.warp("2999-01-01T02:00:00+00:00")
        engine.call_method(margin_address, "settle_assured_claim", [key], sender=BOB)
        assert margin.get_assured_claim(key)["state"] == "SETTLED"
        assert margin.get_assured_claim(key)["final_status"] == "SUPPORTED"

        engine.call_method(consumer_address, "execute_release", [release_one_id], sender=BOB)
        engine.call_method(consumer_address, "execute_release", [release_two_id], sender=BOB)
        executed = consumer.get_release(release_one_id)
        assert executed["executed"] is True
        assert executed["beneficiary_credit"] == 3
        assert consumer.get_release(release_two_id)["beneficiary_credit"] == 4
        assert consumer.is_claim_supported(key) is True

        with pytest.raises(Exception, match="protected release already completed"):
            engine.call_method(consumer_address, "execute_release", [release_one_id], sender=BOB)
        with pytest.raises(Exception, match="protected release already completed"):
            engine.call_method(consumer_address, "refund_release", [release_one_id], sender=ALICE)
        with pytest.raises(Exception, match="no release credit"):
            engine.call_method(consumer_address, "withdraw_release_credit", [release_one_id], sender=ALICE)

        engine.call_method(
            consumer_address, "withdraw_release_credit", [release_one_id], sender=BOB
        )
        engine.call_method(
            consumer_address, "withdraw_release_credit", [release_two_id], sender=BOB
        )
        assert consumer.get_release(release_one_id)["beneficiary_credit"] == 0
        assert consumer.get_release(release_two_id)["beneficiary_credit"] == 0
    finally:
        engine.deactivate()


@pytest.mark.parametrize("status", ["CONTRADICTED", "INCONCLUSIVE", "STALE"])
def test_real_margin_negative_terminal_release_refund_and_conservation(status):
    engine, margin_address, margin, consumer_address, consumer = _new_real_system(
        "negative-" + status
    )
    try:
        key = _claim_key()
        _submit_real_claim(engine, margin_address, key)
        _prepare_assured(engine, margin_address, key, status=status)
        engine.vm.value = 7
        release_id = engine.call_method(
            consumer_address,
            "create_protected_release",
            [key, BOB, "2999-01-03T00:00:00+00:00"],
            sender=ALICE,
        )
        engine.vm.warp("2999-01-01T02:00:00+00:00")
        engine.call_method(margin_address, "settle_assured_claim", [key], sender=BOB)
        assert margin.get_assured_claim(key)["state"] == "SETTLED"
        assert margin.get_assured_claim(key)["final_status"] == status
        with pytest.raises(Exception, match="protected release requires SETTLED SUPPORTED state"):
            engine.call_method(consumer_address, "execute_release", [release_id], sender=BOB)
        engine.call_method(consumer_address, "refund_release", [release_id], sender=ALICE)
        release = consumer.get_release(release_id)
        assert release["creator_credit"] == 7
        assert release["beneficiary_credit"] == 0
        with pytest.raises(Exception, match="protected release already completed"):
            engine.call_method(consumer_address, "refund_release", [release_id], sender=ALICE)
        with pytest.raises(Exception, match="protected release already completed"):
            engine.call_method(consumer_address, "execute_release", [release_id], sender=BOB)
        with pytest.raises(Exception, match="caller has no release credit"):
            engine.call_method(consumer_address, "withdraw_release_credit", [release_id], sender=CHARLIE)
        engine.call_method(consumer_address, "withdraw_release_credit", [release_id], sender=ALICE)
        assert consumer.get_release(release_id)["creator_credit"] == 0
    finally:
        engine.deactivate()


def test_real_margin_cancelled_and_aborted_release_refunds():
    engine, margin_address, margin, consumer_address, consumer = _new_real_system("cancel-abort")
    try:
        cancelled_key = _claim_key()
        _submit_real_claim(engine, margin_address, cancelled_key)
        _prepare_assured(engine, margin_address, cancelled_key, challenge=False)
        engine.vm.value = 4
        cancelled_release = engine.call_method(
            consumer_address,
            "create_protected_release",
            [cancelled_key, BOB, "2999-01-05T00:00:00+00:00"],
            sender=ALICE,
        )
        engine.vm.warp("2999-01-02T00:00:00+00:00")
        engine.call_method(margin_address, "cancel_assured_claim", [cancelled_key], sender=ALICE)
        engine.call_method(consumer_address, "refund_release", [cancelled_release], sender=ALICE)
        assert consumer.get_release(cancelled_release)["creator_credit"] == 4

        aborted_key = _claim_key("-aborted")
        # This claim is submitted with the same real MARGIN contract but a distinct
        # key; its publisher proof and challenge are independently verified.
        _submit_real_claim(engine, margin_address, aborted_key, suffix="-aborted")
        _prepare_assured(engine, margin_address, aborted_key, proof_expiry="3000-01-01T00:00:00+00:00")
        engine.vm.value = 2
        aborted_release = engine.call_method(
            consumer_address,
            "create_protected_release",
            [aborted_key, BOB, "2999-01-05T00:00:00+00:00"],
            sender=ALICE,
        )
        engine.vm.warp("2999-01-04T00:00:00+00:00")
        engine.call_method(margin_address, "abort_stalled", [aborted_key], sender=BOB)
        assert margin.get_assured_claim(aborted_key)["state"] == "ABORTED"
        engine.call_method(consumer_address, "refund_release", [aborted_release], sender=ALICE)
        assert consumer.get_release(aborted_release)["creator_credit"] == 2
    finally:
        engine.deactivate()


def test_real_margin_unresolved_release_expires_and_refunds():
    engine, margin_address, margin, consumer_address, consumer = _new_real_system("expiry")
    try:
        key = _claim_key()
        _submit_real_claim(engine, margin_address, key)
        _prepare_assured(engine, margin_address, key)
        engine.vm.value = 6
        release_id = engine.call_method(
            consumer_address,
            "create_protected_release",
            [key, BOB, "2999-01-01T01:00:00+00:00"],
            sender=ALICE,
        )
        engine.vm.warp("2999-01-01T02:00:00+00:00")
        with pytest.raises(Exception, match="protected release has expired"):
            engine.call_method(consumer_address, "execute_release", [release_id], sender=BOB)
        engine.call_method(consumer_address, "refund_release", [release_id], sender=ALICE)
        assert consumer.get_release(release_id)["creator_credit"] == 6
        with pytest.raises(Exception, match="protected release already completed"):
            engine.call_method(consumer_address, "execute_release", [release_id], sender=BOB)
    finally:
        engine.deactivate()


def test_real_margin_two_creators_have_independent_releases():
    engine, margin_address, margin, consumer_address, consumer = _new_real_system("two-creators")
    try:
        key = _claim_key()
        _submit_real_claim(engine, margin_address, key)
        _prepare_assured(engine, margin_address, key, status="SUPPORTED")
        engine.vm.value = 3
        first = engine.call_method(
            consumer_address, "create_protected_release", [key, BOB, "2999-01-03T00:00:00+00:00"], sender=ALICE
        )
        engine.vm.value = 5
        second = engine.call_method(
            consumer_address, "create_protected_release", [key, CHARLIE, "2999-01-03T00:00:00+00:00"], sender=BOB
        )
        assert {item["release_id"] for item in consumer.get_releases_for_claim(key)} == {first, second}
        engine.vm.warp("2999-01-01T02:00:00+00:00")
        engine.call_method(margin_address, "settle_assured_claim", [key], sender=BOB)
        engine.call_method(consumer_address, "execute_release", [first], sender=CHARLIE)
        engine.call_method(consumer_address, "execute_release", [second], sender=CHARLIE)
        assert consumer.get_release(first)["beneficiary_credit"] == 3
        assert consumer.get_release(second)["beneficiary_credit"] == 5
        with pytest.raises(Exception, match="caller has no release credit|no release credit"):
            engine.call_method(consumer_address, "withdraw_release_credit", [first], sender=CHARLIE)
        engine.call_method(consumer_address, "withdraw_release_credit", [first], sender=BOB)
        engine.call_method(consumer_address, "withdraw_release_credit", [second], sender=CHARLIE)
        assert consumer.get_release(first)["beneficiary_credit"] == 0
        assert consumer.get_release(second)["beneficiary_credit"] == 0
    finally:
        engine.deactivate()


def test_covered_claim_couples_collateral_and_global_exposure_to_releases():
    """V2 coverage is claim-wide, not merely a per-creator release limit."""
    engine, margin_address, margin, consumer_address, consumer = _new_real_system("covered-exposure")
    try:
        key = _claim_key("-covered")
        _submit_real_claim(engine, margin_address, key, suffix="-covered")
        expiry = "2999-01-01T00:00:00+00:00"
        body = "Support matrix: Runtime 4.2 supports Node 18 in production."
        manifest = {
            "protocol_version": 2,
            "claim_key": key,
            "publisher_wallet": ALICE,
            "domain": "example.com",
            "canonical_url": URL,
            "primary_artifact_sha256": hashlib.sha256(body.encode()).hexdigest(),
            "claim_digest": hashlib.sha256(b"Runtime 4.2 supports Node 18 in production.").hexdigest(),
            "anchor_digest": hashlib.sha256(("Compatibility notes say|Runtime 4.2 supports Node 18 in production.|See the support matrix below.").encode()).hexdigest(),
            "coverage_cap": 10,
            "evidence_pack": [{
                "evidence_id": "support-matrix",
                "authority_profile": "CONTENT_HASHED_HTTPS",
                "url": "https://example.com/docs/support",
                "expected_sha256": hashlib.sha256(b"Support matrix: Runtime 4.2 supports Node 18 in production.").hexdigest(),
                "citation_exact": "Runtime 4.2 supports Node 18 in production.",
                "relation": "SUPPORTS",
                "authority_metadata": {"bounded_bytes": 40000},
            }],
            "issued_at": "2026-01-01T00:00:00+00:00",
            "expires_at": expiry,
            "nonce": "covered-integration-nonce",
        }
        engine.vm.mock_web(
            r".*example\.com/\.well-known/margin/claims/.*",
            {"status": 200, "body": json.dumps(manifest, separators=(",", ":"), sort_keys=True)},
        )
        engine.vm.value = 10
        engine.call_method(
            margin_address, "register_covered_claim", [key, "covered-integration-nonce", expiry], sender=ALICE
        )
        assert margin.get_covered_claim(key)["coverage_cap"] == 10

        engine.vm.value = 10
        engine.call_method(margin_address, "challenge_assured_claim", [key], sender=BOB)
        engine.vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body})
        engine.vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body})
        records = [
            {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
            {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        ]
        source_digest = hashlib.sha256(json.dumps({"v": 2, "sources": records}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
        engine.vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
            "status": "SUPPORTED", "rationale": "The committed evidence supports the claim.", "claim_present": True,
            "supporting_source_indexes": [0], "contradicting_source_indexes": [], "historical_evidence_used": False,
            "source_manifest_digest": source_digest,
            "material_observations": [{"evidence_id": "support-matrix", "authority_profile": "CONTENT_HASHED_HTTPS", "authority_status": "ACCEPTED", "integrity_status": "VERIFIED", "citation_digest": hashlib.sha256(b"Runtime 4.2 supports Node 18 in production.").hexdigest(), "citation_present": True, "semantic_relation": "SUPPORTS"}],
        }))
        engine.call_method(margin_address, "resolve_assured_claim", [key], sender=BOB)

        engine.vm.value = 6
        release_id = engine.call_method(
            consumer_address, "create_protected_release", [key, BOB, "2999-01-03T00:00:00+00:00"], sender=CHARLIE
        )
        assert consumer.get_active_exposure(key) == 6
        engine.vm.value = 5
        with pytest.raises(Exception, match="protected release exceeds available covered claim"):
            engine.call_method(
                consumer_address, "create_protected_release", [key, ALICE, "2999-01-03T00:00:00+00:00"], sender=ALICE
            )

        engine.vm.warp("2999-01-01T02:00:00+00:00")
        engine.call_method(margin_address, "settle_assured_claim", [key], sender=BOB)
        engine.call_method(consumer_address, "execute_release", [release_id], sender=ALICE)
        assert consumer.get_active_exposure(key) == 0
        engine.call_method(consumer_address, "withdraw_release_credit", [release_id], sender=BOB)
        assert consumer.get_release(release_id)["beneficiary_credit"] == 0
    finally:
        engine.deactivate()


def test_covered_claim_release_refund_is_bound_to_canonical_terminal_state():
    engine, margin_address, margin, consumer_address, consumer = _new_real_system("covered-refund")
    try:
        key = _claim_key("-covered-refund")
        _submit_real_claim(engine, margin_address, key, suffix="-covered-refund")
        expiry = "2999-01-01T00:00:00+00:00"
        body = "Contradictory evidence."
        manifest = {
            "protocol_version": 2,
            "claim_key": key,
            "publisher_wallet": ALICE,
            "domain": "example.com",
            "canonical_url": URL,
            "primary_artifact_sha256": hashlib.sha256(body.encode()).hexdigest(),
            "claim_digest": hashlib.sha256(b"Runtime 4.2 supports Node 18 in production.").hexdigest(),
            "anchor_digest": hashlib.sha256(("Compatibility notes say|Runtime 4.2 supports Node 18 in production.|See the support matrix below.").encode()).hexdigest(),
            "coverage_cap": 4,
            "evidence_pack": [{
                "evidence_id": "support-matrix",
                "authority_profile": "CONTENT_HASHED_HTTPS",
                "url": "https://example.com/docs/support",
                "expected_sha256": hashlib.sha256(b"Contradictory evidence.").hexdigest(),
                "citation_exact": "Contradictory evidence.",
                "relation": "CONTRADICTS",
                "authority_metadata": {"bounded_bytes": 40000},
            }],
            "issued_at": "2026-01-01T00:00:00+00:00",
            "expires_at": expiry,
            "nonce": "covered-refund-nonce",
        }
        engine.vm.mock_web(
            r".*example\.com/\.well-known/margin/claims/.*",
            {"status": 200, "body": json.dumps(manifest, separators=(",", ":"), sort_keys=True)},
        )
        engine.vm.value = 4
        engine.call_method(margin_address, "register_covered_claim", [key, "covered-refund-nonce", expiry], sender=ALICE)
        engine.vm.value = 4
        engine.call_method(margin_address, "challenge_assured_claim", [key], sender=BOB)
        engine.vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body})
        engine.vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body})
        records = [
            {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
            {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        ]
        digest = hashlib.sha256(json.dumps({"v": 2, "sources": records}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
        engine.vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
            "status": "CONTRADICTED", "rationale": "The committed evidence contradicts the claim.", "claim_present": True,
            "supporting_source_indexes": [], "contradicting_source_indexes": [0], "historical_evidence_used": False,
            "source_manifest_digest": digest,
            "material_observations": [{"evidence_id": "support-matrix", "authority_profile": "CONTENT_HASHED_HTTPS", "authority_status": "ACCEPTED", "integrity_status": "VERIFIED", "citation_digest": hashlib.sha256(b"Contradictory evidence.").hexdigest(), "citation_present": True, "semantic_relation": "CONTRADICTS"}],
        }))
        engine.call_method(margin_address, "resolve_assured_claim", [key], sender=BOB)
        engine.vm.value = 3
        release_id = engine.call_method(consumer_address, "create_protected_release", [key, BOB, "2999-01-03T00:00:00+00:00"], sender=ALICE)
        engine.vm.warp("2999-01-01T02:00:00+00:00")
        engine.call_method(margin_address, "settle_assured_claim", [key], sender=BOB)
        with pytest.raises(Exception, match="protected release requires SETTLED SUPPORTED state"):
            engine.call_method(consumer_address, "execute_release", [release_id], sender=BOB)
        engine.call_method(consumer_address, "refund_release", [release_id], sender=ALICE)
        assert consumer.get_active_exposure(key) == 0
        engine.call_method(consumer_address, "withdraw_release_credit", [release_id], sender=ALICE)
        assert consumer.get_release(release_id)["creator_credit"] == 0
    finally:
        engine.deactivate()
