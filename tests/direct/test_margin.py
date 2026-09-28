"""Direct-mode coverage for deterministic bounds and consensus state updates.

Run with the official GenLayer testing suite:
    pytest tests/direct -v
"""
import hashlib
import json

URL = "https://example.com/docs/runtime"
PAGE_KEY = hashlib.sha256(URL.encode("utf-8")).hexdigest()
DIGEST = "a" * 64


def claim_key_for(statement, evidence, archive=""):
    payload = {
        "archiveUrl": archive,
        "canonicalUrl": URL,
        "challengeStatement": statement,
        "claimClass": "COMPATIBILITY",
        "exact": "Runtime 4.2 supports Node 18 in production.",
        "evidenceUrls": sorted(evidence),
        "pageDigest": DIGEST,
        "pageKey": PAGE_KEY,
        "prefix": "Compatibility notes say",
        "suffix": "See the support matrix below.",
        "v": 1,
    }
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def submit(contract, suffix="1", evidence=None):
    evidence = evidence if evidence is not None else ["https://example.com/docs/support"]
    statement = "The current support matrix appears to require Node 20 or newer."
    claim_key = claim_key_for(statement, evidence)
    contract.submit_claim(
        claim_key,
        PAGE_KEY,
        URL,
        "Runtime 4.2 supports Node 18 in production.",
        "Compatibility notes say",
        "See the support matrix below.",
        DIGEST,
        "COMPATIBILITY",
        statement,
        json.dumps(evidence),
        "",
    )
    return claim_key


def test_submit_and_read(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    claim = contract.get_claim(key)
    assert claim["claim_key"] == key
    assert claim["page_key"] == PAGE_KEY
    assert claim["status"] == "OPEN"
    assert claim["revision"] == 0
    assert len(contract.get_page_claims(PAGE_KEY)) == 1


def test_rejects_forged_page_key(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("page_key does not match canonical_url"):
        contract.submit_claim(
            hashlib.sha256(b"claim-x").hexdigest(),
            "b" * 64,
            URL,
            "Runtime 4.2 supports Node 18 in production.",
            "",
            "",
            DIGEST,
            "COMPATIBILITY",
            "The current support matrix appears to require Node 20 or newer.",
            "[]",
            "",
        )


def test_rejects_forged_claim_key(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    evidence = ["https://example.com/docs/support"]
    with direct_vm.expect_revert("claim_key does not match claim payload"):
        contract.submit_claim(
            "c" * 64, PAGE_KEY, URL,
            "Runtime 4.2 supports Node 18 in production.",
            "Compatibility notes say", "See the support matrix below.", DIGEST,
            "COMPATIBILITY",
            "The current support matrix appears to require Node 20 or newer.",
            json.dumps(evidence), "",
        )


def test_rejects_duplicate(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    with direct_vm.expect_revert("claim already exists"):
        contract.submit_claim(
            key, PAGE_KEY, URL,
            "Runtime 4.2 supports Node 18 in production.", "Compatibility notes say", "See the support matrix below.", DIGEST,
            "COMPATIBILITY",
            "The current support matrix appears to require Node 20 or newer.",
            json.dumps(["https://example.com/docs/support"]), "",
        )


def test_rejects_duplicate_evidence_urls(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    duplicate = ["https://example.com/docs/support", "https://example.com/docs/support"]
    # The claim key itself is canonical over the supplied sorted list, so the duplicate
    # must be rejected explicitly rather than hidden by hashing.
    key = claim_key_for("The current support matrix appears to require Node 20 or newer.", duplicate)
    with direct_vm.expect_revert("duplicate evidence URL"):
        contract.submit_claim(
            key, PAGE_KEY, URL,
            "Runtime 4.2 supports Node 18 in production.",
            "Compatibility notes say", "See the support matrix below.", DIGEST,
            "COMPATIBILITY",
            "The current support matrix appears to require Node 20 or newer.",
            json.dumps(duplicate), "",
        )


def test_rejects_four_evidence_urls(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("too many evidence URLs"):
        submit(contract, "four", [f"https://example.com/{i}" for i in range(4)])


def test_resolve_stores_independently_validated_status(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    direct_vm.mock_web(r".*example\.com.*", {
        "status": 200,
        "body": "Support matrix: Runtime 4.2 requires Node 20 or newer. Node 18 is unsupported.",
    })
    body = "Support matrix: Runtime 4.2 requires Node 20 or newer. Node 18 is unsupported."
    source_records = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
    ]
    manifest_payload = json.dumps({"v": 2, "sources": source_records}, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    manifest_digest = hashlib.sha256(manifest_payload.encode()).hexdigest()
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "CONTRADICTED",
        "rationale": "The authoritative support matrix requires Node 20 or newer.",
        "claim_present": True,
        "supporting_source_indexes": [],
        "contradicting_source_indexes": [0],
        "historical_evidence_used": False,
        "source_manifest_digest": manifest_digest,
    }))
    contract.resolve_claim(key)
    claim = contract.get_claim(key)
    assert claim["status"] == "CONTRADICTED"
    assert claim["revision"] == 1
    history = contract.get_decision_history(key)
    assert len(history) == 1
    assert history[0]["status"] == "CONTRADICTED"


def test_network_metadata_is_studionet(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/margin.py")
    network = contract.network()
    assert network["chain_id"] == 61999
    assert network["network"] == "studionet"


def test_manifest_is_committed_and_unchanged_refresh_is_rejected(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    body = "Support matrix: Runtime 4.2 requires Node 20 or newer. Node 18 is unsupported."
    direct_vm.mock_web(r".*example\.com.*", {"status": 200, "body": body})
    records = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
    ]
    digest = hashlib.sha256(json.dumps({"v": 2, "sources": records}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "CONTRADICTED", "rationale": "The support matrix contradicts the claim.",
        "claim_present": True, "supporting_source_indexes": [], "contradicting_source_indexes": [0],
        "historical_evidence_used": False, "source_manifest_digest": digest,
    }))
    contract.resolve_claim(key)
    assert contract.get_claim(key)["source_manifest_digest"] == digest
    with direct_vm.expect_revert("source manifest unchanged"):
        contract.resolve_claim(key)


def test_assured_claim_domain_proof_and_bond_lifecycle(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    publisher = "0x" + direct_alice.hex()
    expiry = "2999-01-01T00:00:00+00:00"
    proof = json.dumps({
        "protocol_version": 2,
        "domain": "example.com",
        "publisher_wallet": publisher,
        "nonce": "publisher-nonce-1",
        "claim_key": key,
        "expiry": expiry,
    })
    direct_vm.mock_web(r".*example\.com/\.well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.value = 1
    contract.register_assured_claim(key, "https://example.com/.well-known/margin.json", "publisher-nonce-1", expiry)
    assert contract.get_assured_claim(key)["state"] == "REGISTERED"
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)

    # A third party cannot consume the adjudication before the Assured wrapper
    # resolves it, even though the ordinary resolver remains permissionless for
    # normal claims.
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("ordinary resolution cannot consume an assured lifecycle"):
        contract.resolve_claim(key)
    assert contract.get_assured_claim(key)["state"] == "CHALLENGED"
    assert contract.get_assured_claim(key)["state"] == "CHALLENGED"
    body = "Support matrix: Runtime 4.2 requires Node 20 or newer. Node 18 is unsupported."
    direct_vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body})
    direct_vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body})
    records = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
    ]
    digest = hashlib.sha256(json.dumps({"v": 2, "sources": records}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "CONTRADICTED", "rationale": "The support matrix contradicts the claim.",
        "claim_present": True, "supporting_source_indexes": [], "contradicting_source_indexes": [0],
        "historical_evidence_used": False, "source_manifest_digest": digest,
    }))
    contract.resolve_assured_claim(key)
    assert contract.get_assured_claim(key)["state"] == "RESOLVED"
    direct_vm.warp("2999-01-01T02:00:00+00:00")
    contract.settle_assured_claim(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "SETTLED"
    assert assured["settled"] is True
    assert assured["challenger_credit"] == 2

    # Settlement credits are withdrawable exactly once; a replay cannot pay out
    # again after the canonical credit has been cleared.
    direct_vm.sender = direct_bob
    contract.withdraw_assured_credit(key)
    assert contract.get_assured_claim(key)["challenger_credit"] == 0
    with direct_vm.expect_revert("no assured claim credit"):
        contract.withdraw_assured_credit(key)


def test_assured_claim_rejects_cross_origin_proof_url(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    direct_vm.value = 1
    with direct_vm.expect_revert("domain proof URL must match the canonical origin"):
        contract.register_assured_claim(
            key,
            "https://attacker.example/.well-known/margin.json",
            "cross-origin-nonce",
            "2999-01-01T00:00:00+00:00",
        )


def test_assured_claim_rejects_expired_domain_proof(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    publisher = "0x" + direct_alice.hex()
    expiry = "2000-01-01T00:00:00+00:00"
    proof = json.dumps({
        "protocol_version": 2,
        "domain": "example.com",
        "publisher_wallet": publisher,
        "nonce": "expired-proof-nonce",
        "claim_key": key,
        "expiry": expiry,
    })
    direct_vm.mock_web(r".*example\.com/\.well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.value = 1
    with direct_vm.expect_revert("domain proof could not be independently verified"):
        contract.register_assured_claim(
            key,
            "https://example.com/.well-known/margin.json",
            "expired-proof-nonce",
            expiry,
        )


def test_assured_claim_rejects_wrong_publisher_in_domain_proof(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    expiry = "2999-01-01T00:00:00+00:00"
    proof = json.dumps({
        "protocol_version": 2,
        "domain": "example.com",
        "publisher_wallet": "0x" + direct_bob.hex(),
        "nonce": "wrong-publisher-nonce",
        "claim_key": key,
        "expiry": expiry,
    })
    direct_vm.mock_web(r".*example\.com/\.well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.value = 1
    with direct_vm.expect_revert("domain proof could not be independently verified"):
        contract.register_assured_claim(
            key,
            "https://example.com/.well-known/margin.json",
            "wrong-publisher-nonce",
            expiry,
        )


def test_assured_appeal_requires_new_source_and_settles_once(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    publisher = "0x" + direct_alice.hex()
    expiry = "2999-01-01T00:00:00+00:00"
    proof = json.dumps({"protocol_version": 2, "domain": "example.com", "publisher_wallet": publisher, "nonce": "appeal-nonce", "claim_key": key, "expiry": expiry})
    direct_vm.mock_web(r".*well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.value = 1
    contract.register_assured_claim(key, "https://example.com/.well-known/margin.json", "appeal-nonce", expiry)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)

    body_one = "Initial support matrix contradicts Node 18."
    direct_vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body_one})
    direct_vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body_one})
    records_one = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body_one.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body_one.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
    ]
    digest_one = hashlib.sha256(json.dumps({"v": 2, "sources": records_one}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({"status": "CONTRADICTED", "rationale": "Initial evidence.", "claim_present": True, "supporting_source_indexes": [], "contradicting_source_indexes": [0], "historical_evidence_used": False, "source_manifest_digest": digest_one}))
    contract.resolve_assured_claim(key)

    direct_vm.sender = direct_charlie
    direct_vm.value = 1
    with direct_vm.expect_revert("only the publisher or challenger may appeal"):
        contract.appeal_assured_claim(key, "An unauthorized appeal attempt.")

    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.appeal_assured_claim(key, "A new authoritative support matrix is now available.")
    assert contract.get_assured_claim(key)["state"] == "APPEALED"
    with direct_vm.expect_revert("assured claim is not appealable"):
        contract.appeal_assured_claim(key, "A duplicate appeal must be rejected.")

    # The same third-party front-running protection applies after the appeal is
    # opened; the appeal wrapper owns the next adjudication transition.
    with direct_vm.expect_revert("ordinary resolution cannot consume an assured lifecycle"):
        contract.resolve_claim(key)
    assert contract.get_assured_claim(key)["state"] == "APPEALED"

    # A valid one-shot appeal is meaningful even when the public source
    # manifest is unchanged: the bounded appeal contention is new protocol
    # input and is included in the adjudication context digest.
    body_two = body_one
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body_two})
    direct_vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body_two})
    records_two = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(body_two.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": hashlib.sha256(body_two.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
    ]
    digest_two = hashlib.sha256(json.dumps({"v": 2, "sources": records_two}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({"status": "SUPPORTED", "rationale": "The appeal contention warrants reconsideration.", "claim_present": True, "supporting_source_indexes": [0], "contradicting_source_indexes": [], "historical_evidence_used": False, "source_manifest_digest": digest_two}))
    contract.resolve_assured_appeal(key)
    assert contract.get_assured_claim(key)["final_status"] == "SUPPORTED"
    assert contract.get_assured_claim(key)["appeal_context_digest"]
    direct_vm.warp("2999-01-01T02:00:00+00:00")
    contract.settle_assured_claim(key)
    with direct_vm.expect_revert("not ready for settlement"):
        contract.settle_assured_claim(key)
    with direct_vm.expect_revert("assured claim is not appealable"):
        contract.appeal_assured_claim(key, "A settled claim cannot be appealed.")
