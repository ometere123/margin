"""Direct-mode coverage for deterministic bounds and consensus state updates.

Run with the official GenLayer testing suite:
    pytest tests/direct -v
"""
import hashlib
import json
import copy
import pytest

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
    statement = "The current support matrix appears to require Node 20 or newer." if suffix == "1" else f"The current support matrix appears to require Node 20 or newer ({suffix})."
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


def test_consensus_semantics_tolerate_validator_observation_variation(direct_vm, direct_deploy, direct_alice):
    """Only the bounded verdict must agree; harmless observations may differ."""
    contract = direct_deploy("contracts/margin.py")
    identities = contract._expected_source_identities(
        URL, "", ["https://example.com/docs/support"]
    )

    leader_manifest = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": "a" * 64, "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": "b" * 64, "provenance": "PUBLIC_SOURCE"},
    ]
    validator_manifest = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": "c" * 64, "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": "d" * 64, "provenance": "PUBLIC_SOURCE"},
    ]

    def candidate(manifest, supporting, contradicting, status="SUPPORTED", claim_present=True):
        digest = contract._source_manifest_digest(manifest)
        source_set_digest = contract._source_set_digest(identities)
        return {
            "status": status,
            "rationale": "bounded explanation",
            "claim_present": claim_present,
            "supporting_source_indexes": supporting,
            "contradicting_source_indexes": contradicting,
            "historical_evidence_used": False,
            "source_manifest_digest": digest,
            "source_set_digest": source_set_digest,
            "source_manifest": manifest,
            "adjudication_context_digest": contract._adjudication_context_digest(source_set_digest, "", 0, "NORMAL"),
        }

    leader = candidate(leader_manifest, [0], [])
    validator = candidate(validator_manifest, [1], [])
    assert contract._consensus_candidate_is_valid(leader, "SUPPORTED", identities, "", 0)
    assert contract._consensus_candidate_is_valid(validator, "SUPPORTED", identities, "", 0)

    # A wrong bounded verdict is still rejected even when its own observation
    # and source/index rendering are internally consistent.
    wrong = candidate(leader_manifest, [], [1], status="CONTRADICTED")
    assert not contract._consensus_candidate_is_valid(wrong, "SUPPORTED", identities, "", 0)

    # Status-specific semantic guards remain fail-closed.
    no_support = candidate(leader_manifest, [], [], status="SUPPORTED")
    stale_with_claim = candidate(leader_manifest, [], [], status="STALE", claim_present=True)
    assert not contract._consensus_candidate_is_valid(no_support, "SUPPORTED", identities, "", 0)
    assert not contract._consensus_candidate_is_valid(stale_with_claim, "STALE", identities, "", 0)


def test_consensus_trust_boundary_rejects_wrong_status_semantics_and_tampering(
    direct_vm, direct_deploy
):
    """The validator binds status semantics and all decision-input commitments."""
    contract = direct_deploy("contracts/margin.py")
    identities = contract._expected_source_identities(
        URL, "", ["https://example.com/docs/support"]
    )
    manifest = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": "a" * 64, "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": "b" * 64, "provenance": "PUBLIC_SOURCE"},
    ]

    def candidate(**overrides):
        value = {
            "status": "SUPPORTED",
            "rationale": "A bounded explanation.",
            "claim_present": True,
            "supporting_source_indexes": [0],
            "contradicting_source_indexes": [],
            "historical_evidence_used": False,
            "source_manifest": copy.deepcopy(manifest),
        }
        value.update(overrides)
        if "source_manifest_digest" not in overrides:
            value["source_manifest_digest"] = contract._source_manifest_digest(value["source_manifest"])
        if "source_set_digest" not in overrides:
            value["source_set_digest"] = contract._source_set_digest(identities)
        if "adjudication_context_digest" not in overrides:
            value["adjudication_context_digest"] = contract._adjudication_context_digest(
                value["source_set_digest"], "", 0, "NORMAL"
            )
        return value

    assert contract._consensus_candidate_is_valid(
        candidate(), "SUPPORTED", identities, "", 0
    )
    # A leader cannot replace the independently derived verdict or semantic
    # conditions with a structurally valid but substantively wrong result.
    assert not contract._consensus_candidate_is_valid(
        candidate(status="CONTRADICTED", supporting_source_indexes=[], contradicting_source_indexes=[0]),
        "SUPPORTED", identities, "", 0,
    )
    assert not contract._consensus_candidate_is_valid(
        candidate(supporting_source_indexes=[]), "SUPPORTED", identities, "", 0
    )
    assert not contract._consensus_candidate_is_valid(
        candidate(status="CONTRADICTED", supporting_source_indexes=[], contradicting_source_indexes=[]),
        "CONTRADICTED", identities, "", 0,
    )
    assert not contract._consensus_candidate_is_valid(
        candidate(status="STALE", claim_present=True, supporting_source_indexes=[]),
        "STALE", identities, "", 0,
    )

    # Recomputing a commitment does not let a leader alter the committed input.
    identity_tamper = copy.deepcopy(manifest)
    identity_tamper[0]["url"] = "https://attacker.example/"
    assert not contract._consensus_candidate_is_valid(
        candidate(source_manifest=identity_tamper), "SUPPORTED", identities, "", 0
    )
    assert not contract._consensus_candidate_is_valid(
        candidate(source_set_digest="c" * 64), "SUPPORTED", identities, "", 0
    )
    assert not contract._consensus_candidate_is_valid(
        candidate(adjudication_context_digest="d" * 64), "SUPPORTED", identities, "", 0
    )
    assert not contract._consensus_candidate_is_valid(
        candidate(source_manifest=[manifest[0]]), "SUPPORTED", identities, "", 0
    )


def test_consensus_provenance_variation_cannot_change_status_or_consequences(
    direct_vm, direct_deploy
):
    """Rationale/index attribution is proposal provenance, not settlement input."""
    contract = direct_deploy("contracts/margin.py")
    identities = contract._expected_source_identities(
        URL, "", ["https://example.com/docs/support"]
    )
    manifests = [
        [
            {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": "a" * 64, "provenance": "PUBLIC_SOURCE"},
            {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": "b" * 64, "provenance": "PUBLIC_SOURCE"},
        ],
        [
            {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": "c" * 64, "provenance": "PUBLIC_SOURCE"},
            {"kind": "EVIDENCE", "url": "https://example.com/docs/support", "fetch_status": "OK", "content_digest": "d" * 64, "provenance": "PUBLIC_SOURCE"},
        ],
    ]

    def candidate(manifest, rationale, supporting):
        source_set_digest = contract._source_set_digest(identities)
        return {
            "status": "SUPPORTED",
            "rationale": rationale,
            "claim_present": True,
            "supporting_source_indexes": supporting,
            "contradicting_source_indexes": [],
            "historical_evidence_used": False,
            "source_manifest": manifest,
            "source_manifest_digest": contract._source_manifest_digest(manifest),
            "source_set_digest": source_set_digest,
            "adjudication_context_digest": contract._adjudication_context_digest(
                source_set_digest, "", 0, "NORMAL"
            ),
        }

    leader = candidate(manifests[0], "Leader wording is unrelated but bounded.", [0])
    validator = candidate(manifests[1], "Validator wording independently differs.", [1])
    assert leader["rationale"] != validator["rationale"]
    assert leader["supporting_source_indexes"] != validator["supporting_source_indexes"]
    assert contract._consensus_candidate_is_valid(
        leader, "SUPPORTED", identities, "", 0
    )
    assert contract._consensus_candidate_is_valid(
        validator, "SUPPORTED", identities, "", 0
    )

    # All state-changing downstream decisions consume the agreed status. The
    # same status therefore yields the same SUPPORTED winner and eligibility;
    # rationale/index attribution is retained only as accepted provenance.
    assert leader["status"] == validator["status"] == "SUPPORTED"


def test_network_metadata_is_studionet(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/margin.py")
    network = contract.network()
    assert network["chain_id"] == 61999
    assert network["network"] == "studionet"


def test_normal_refresh_requires_cooldown_but_same_source_is_allowed_afterwards(direct_vm, direct_deploy, direct_alice):
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
    with direct_vm.expect_revert("normal refresh cooldown has not elapsed"):
        contract.resolve_claim(key)
    direct_vm.warp("2999-01-02T00:00:00+00:00")
    contract.resolve_claim(key)
    assert contract.get_claim(key)["revision"] == 2


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
    assert contract.get_claim(key)["latest_manifest"]["context_kind"] == "ASSURED_INITIAL"
    assert contract.get_claim(key)["latest_manifest"]["appeal_count"] == 0
    direct_vm.warp("2999-01-01T02:00:00+00:00")
    contract.settle_assured_claim(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "SETTLED"
    assert assured["settled"] is True
    assert assured["challenger_credit"] == 2
    assert (
        assured["publisher_bond"]
        + assured["challenge_bond"]
        + assured["appeal_bond"]
        + assured["publisher_credit"]
        + assured["challenger_credit"]
        == 2
    )

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
    with direct_vm.expect_revert("proof expiry must be in the future"):
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


def test_assured_appeal_same_source_context_and_settles_once(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
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


def _register_for_lifecycle(contract, direct_vm, direct_alice, key, expiry="2999-01-01T00:00:00+00:00"):
    publisher = "0x" + direct_alice.hex()
    proof = json.dumps({
        "protocol_version": 2,
        "domain": "example.com",
        "publisher_wallet": publisher,
        "nonce": "lifecycle-nonce",
        "claim_key": key,
        "expiry": expiry,
    })
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*example\.com/\.well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.sender = direct_alice
    direct_vm.value = 1
    contract.register_assured_claim(key, "https://example.com/.well-known/margin.json", "lifecycle-nonce", expiry)


def _mock_contradicted_resolution(direct_vm):
    body = "Support matrix: Runtime 4.2 requires Node 20 or newer. Node 18 is unsupported."
    direct_vm.clear_mocks()
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


def test_publisher_can_cancel_unchallenged_assured_claim_once(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    with direct_vm.expect_revert("assured challenge window is still open"):
        contract.cancel_assured_claim(key)
    direct_vm.warp("2999-01-02T00:00:00+00:00")
    contract.cancel_assured_claim(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "CANCELLED"
    assert assured["publisher_credit"] == 1
    assert assured["publisher_bond"] + assured["challenge_bond"] + assured["appeal_bond"] + assured["publisher_credit"] + assured["challenger_credit"] == 1
    with direct_vm.expect_revert("assured claim cannot be cancelled"):
        contract.cancel_assured_claim(key)


def test_registration_window_allows_challenge_but_closes_after_deadline(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix="registration-window")
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    assert contract.get_assured_claim(key)["state"] == "CHALLENGED"

    direct_vm.sender = direct_alice
    key2 = submit(contract, suffix="registration-window-closed")
    _register_for_lifecycle(contract, direct_vm, direct_alice, key2)
    direct_vm.warp("2999-01-02T00:00:00+00:00")
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    with direct_vm.expect_revert("assured challenge window has closed"):
        contract.challenge_assured_claim(key2)
    direct_vm.sender = direct_alice
    contract.cancel_assured_claim(key2)
    assert contract.get_assured_claim(key2)["publisher_credit"] == 1


def test_stalled_challenge_can_abort_and_refund_both_bonds(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    direct_vm.warp("2999-01-03T00:00:00+00:00")
    direct_vm.sender = direct_bob
    contract.abort_stalled(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "ABORTED"
    assert assured["publisher_credit"] == 1
    assert assured["challenger_credit"] == 1
    assert assured["publisher_bond"] + assured["challenge_bond"] + assured["appeal_bond"] + assured["publisher_credit"] + assured["challenger_credit"] == 2


def test_appealed_timeout_has_only_abort_refund_exit(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix="appealed-timeout")
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    _mock_contradicted_resolution(direct_vm)
    contract.resolve_assured_claim(key)
    direct_vm.value = 1
    contract.appeal_assured_claim(key, "A bounded appeal contention for timeout testing.")
    assert contract.get_assured_claim(key)["state"] == "APPEALED"

    with direct_vm.expect_revert("assured resolution timeout has not elapsed"):
        contract.abort_stalled(key)
    with direct_vm.expect_revert("assured claim is not ready for settlement"):
        contract.settle_assured_claim(key)

    direct_vm.warp("2999-01-03T00:00:00+00:00")
    direct_vm.sender = direct_bob
    contract.abort_stalled(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "ABORTED"
    assert assured["publisher_credit"] == 1
    assert assured["challenger_credit"] == 2
    assert assured["publisher_bond"] == 0
    assert assured["challenge_bond"] == 0
    assert assured["appeal_bond"] == 0
    assert assured["publisher_bond"] + assured["challenge_bond"] + assured["appeal_bond"] + assured["publisher_credit"] + assured["challenger_credit"] == 3
    with direct_vm.expect_revert("assured claim is not stalled"):
        contract.abort_stalled(key)
    with direct_vm.expect_revert("assured claim is not ready for settlement"):
        contract.settle_assured_claim(key)


def test_normal_then_assured_resolution_sequence_preserves_bonds(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix="normal-before-assured")
    _mock_contradicted_resolution(direct_vm)
    contract.resolve_claim(key)
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    _mock_contradicted_resolution(direct_vm)
    contract.resolve_assured_claim(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "RESOLVED"
    assert assured["publisher_bond"] == 1
    assert assured["challenge_bond"] == 1


def test_registered_then_normal_then_assured_resolution_sequence_preserves_bonds(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix="registered-before-normal")
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    _mock_contradicted_resolution(direct_vm)
    contract.resolve_claim(key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    _mock_contradicted_resolution(direct_vm)
    contract.resolve_assured_claim(key)
    assured = contract.get_assured_claim(key)
    assert assured["state"] == "RESOLVED"
    assert assured["publisher_bond"] == 1
    assert assured["challenge_bond"] == 1


def test_proof_expiry_requires_timezone_and_normalizes_offsets(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    expiry = "2999-01-01T01:00:00+01:00"
    publisher = "0x" + direct_alice.hex()
    proof = json.dumps({"protocol_version": 2, "domain": "example.com", "publisher_wallet": publisher, "nonce": "offset-nonce", "claim_key": key, "expiry": expiry})
    direct_vm.mock_web(r".*well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.value = 1
    contract.register_assured_claim(key, "https://example.com/.well-known/margin.json", "offset-nonce", expiry)
    assert contract.get_assured_claim(key)["proof_expires_at"] == "2999-01-01T00:00:00+00:00"

    key2 = submit(contract, suffix="naive")
    direct_vm.mock_web(r".*well-known/margin\.json", {"status": 200, "body": proof.replace(key, key2).replace(expiry, "2999-01-01T00:00:00")})
    with direct_vm.expect_revert("proof expiry must include a timezone"):
        contract.register_assured_claim(key2, "https://example.com/.well-known/margin.json", "offset-nonce", "2999-01-01T00:00:00")


def test_proof_expiry_rejects_malformed_and_mismatched_fetch_values(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix="malformed-expiry")
    direct_vm.value = 1
    with direct_vm.expect_revert("proof expiry must be a valid ISO datetime"):
        contract.register_assured_claim(key, "https://example.com/.well-known/margin.json", "malformed-nonce", "9999-not-a-date")

    key2 = submit(contract, suffix="mismatched-expiry")
    submitted = "2999-01-01T00:00:00+00:00"
    fetched = "2999-01-02T00:00:00+00:00"
    publisher = "0x" + direct_alice.hex()
    proof = json.dumps({"protocol_version": 2, "domain": "example.com", "publisher_wallet": publisher, "nonce": "mismatch-nonce", "claim_key": key2, "expiry": fetched})
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*well-known/margin\.json", {"status": 200, "body": proof})
    with direct_vm.expect_revert("domain proof could not be independently verified"):
        contract.register_assured_claim(key2, "https://example.com/.well-known/margin.json", "mismatch-nonce", submitted)


def test_normal_revision_capacity_does_not_consume_assured_slots(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract)
    body = "Support matrix: Runtime 4.2 supports Node 18 in production."

    def resolve_normal():
        direct_vm.clear_mocks()
        direct_vm.mock_web(r".*example\.com.*", {"status": 200, "body": body})
        direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({"status": "SUPPORTED", "rationale": "Evidence supports the claim.", "claim_present": True, "supporting_source_indexes": [0], "contradicting_source_indexes": [], "historical_evidence_used": False}))
        contract.resolve_claim(key)

    resolve_normal()
    direct_vm.warp("2999-01-02T00:00:00+00:00")
    resolve_normal()
    direct_vm.warp("2999-01-03T00:00:00+00:00")
    resolve_normal()
    assert contract.get_claim(key)["revision"] == 3

    _register_for_lifecycle(contract, direct_vm, direct_alice, key, "3000-01-01T00:00:00+00:00")
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*example\.com.*", {"status": 200, "body": body})
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({"status": "SUPPORTED", "rationale": "Assured evidence supports the claim.", "claim_present": True, "supporting_source_indexes": [0], "contradicting_source_indexes": [], "historical_evidence_used": False}))
    direct_vm.sender = direct_bob
    contract.resolve_assured_claim(key)
    assert contract.get_claim(key)["revision"] == 4

    direct_vm.value = 1
    contract.appeal_assured_claim(key, "A bounded appeal contention requires reconsideration.")
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*example\.com.*", {"status": 200, "body": body})
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({"status": "SUPPORTED", "rationale": "The appeal remains supported.", "claim_present": True, "supporting_source_indexes": [0], "contradicting_source_indexes": [], "historical_evidence_used": False}))
    contract.resolve_assured_appeal(key)
    assert contract.get_claim(key)["revision"] == 5
    with direct_vm.expect_revert("maximum normal decision revisions reached"):
        contract.resolve_claim(key)


@pytest.mark.parametrize("status,expected_publisher,expected_challenger", [
    ("SUPPORTED", 2, 0),
    ("INCONCLUSIVE", 1, 1),
    ("STALE", 1, 1),
])
def test_assured_settlement_conserves_bonds_for_supported_inconclusive_and_stale(
    direct_vm, direct_deploy, direct_alice, direct_bob, status, expected_publisher, expected_challenger
):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix=f"conservation-{status}")
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)

    body = "Support matrix: Runtime 4.2 requires Node 20 or newer."
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": body})
    direct_vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": body})
    result = {
        "status": status,
        "rationale": f"{status} conservation fixture.",
        "claim_present": status != "STALE",
        "supporting_source_indexes": [0] if status == "SUPPORTED" else [],
        "contradicting_source_indexes": [],
        "historical_evidence_used": False,
    }
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps(result))
    contract.resolve_assured_claim(key)
    direct_vm.warp("2999-01-01T02:00:00+00:00")
    contract.settle_assured_claim(key)
    assured = contract.get_assured_claim(key)

    # The two incoming one-unit bonds are fully represented by credits or
    # remaining bond state; settlement itself does not lose value.
    assert assured["publisher_bond"] + assured["challenge_bond"] + assured["appeal_bond"] + assured["publisher_credit"] + assured["challenger_credit"] == 2
    assert assured["publisher_credit"] == expected_publisher
    assert assured["challenger_credit"] == expected_challenger

    direct_vm.sender = direct_alice
    if expected_publisher:
        contract.withdraw_assured_credit(key)
    direct_vm.sender = direct_bob
    if expected_challenger:
        contract.withdraw_assured_credit(key)
    settled = contract.get_assured_claim(key)
    assert settled["publisher_bond"] + settled["challenge_bond"] + settled["appeal_bond"] + settled["publisher_credit"] + settled["challenger_credit"] == 0


def test_publisher_appeal_conserves_and_withdraws_all_bonds(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = submit(contract, suffix="publisher-appeal-conservation")
    _register_for_lifecycle(contract, direct_vm, direct_alice, key)
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    contract.challenge_assured_claim(key)
    _mock_contradicted_resolution(direct_vm)
    contract.resolve_assured_claim(key)

    direct_vm.sender = direct_alice
    direct_vm.value = 1
    contract.appeal_assured_claim(key, "Publisher submits bounded new evidence for reconsideration.")
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": "Support matrix confirms Node 18."})
    direct_vm.mock_web(r"https://example\.com/docs/support", {"status": 200, "body": "Support matrix confirms Node 18."})
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "SUPPORTED", "rationale": "The bounded appeal evidence supports the claim.",
        "claim_present": True, "supporting_source_indexes": [0], "contradicting_source_indexes": [],
        "historical_evidence_used": False,
    }))
    contract.resolve_assured_appeal(key)
    direct_vm.warp("2999-01-01T02:00:00+00:00")
    contract.settle_assured_claim(key)
    assured = contract.get_assured_claim(key)
    assert assured["publisher_bond"] + assured["challenge_bond"] + assured["appeal_bond"] + assured["publisher_credit"] + assured["challenger_credit"] == 3
    assert assured["publisher_credit"] == 3
    direct_vm.sender = direct_alice
    contract.withdraw_assured_credit(key)
    settled = contract.get_assured_claim(key)
    assert settled["publisher_bond"] + settled["challenge_bond"] + settled["appeal_bond"] + settled["publisher_credit"] + settled["challenger_credit"] == 0
