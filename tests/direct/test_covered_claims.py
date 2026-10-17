"""Direct Mode coverage for V2 Covered Claims and value-coupled exposure."""

import hashlib
import json

import pytest


URL = "https://example.com/docs/covered"
PAGE_KEY = hashlib.sha256(URL.encode()).hexdigest()
PAGE_DIGEST = "a" * 64
ALICE = "0x" + "11" * 20
BOB = "0x" + "22" * 20


def _deploy_bound_margin(direct_vm, direct_deploy, direct_alice):
    direct_vm.sender = direct_alice
    margin = direct_deploy("contracts/margin.py")
    consumer_address = "0x" + "44" * 20
    _install_canonical_consumer_hook(direct_vm, consumer_address, margin.address, 0)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    margin.bind_canonical_consumer(consumer_address)
    return margin, consumer_address


def _install_canonical_consumer_hook(
    direct_vm, consumer_address, margin_address, exposure, *, fail_exposure=False
):
    from genlayer.py import calldata

    def hook(_vm, request):
        call = request.get("CallContract")
        if not call:
            return None
        address = call.get("address")
        address_hex = address.as_hex if hasattr(address, "as_hex") else str(address)
        if address_hex.lower() != consumer_address.lower():
            return bytes([1]) + b"unexpected canonical consumer address"
        encoded = call.get("calldata", {})
        method = encoded.get("method")
        if method == "get_canonical_margin_address":
            return bytes([0]) + calldata.encode(margin_address)
        if method == "get_active_exposure":
            if fail_exposure:
                return bytes([1]) + b"canonical exposure read failed"
            return bytes([0]) + calldata.encode(exposure)
        return bytes([1]) + f"unsupported canonical consumer view {method}".encode()

    direct_vm._gl_call_hook = hook


def _claim_key():
    statement = "The covered support matrix establishes the documented runtime guarantee."
    payload = {
        "archiveUrl": "",
        "canonicalUrl": URL,
        "challengeStatement": statement,
        "claimClass": "COMPATIBILITY",
        "exact": "Runtime 4.2 supports Node 18 in production.",
        "evidenceUrls": ["https://example.com/docs/covered-evidence"],
        "pageDigest": PAGE_DIGEST,
        "pageKey": PAGE_KEY,
        "prefix": "The documentation states",
        "suffix": "in the support matrix.",
        "v": 1,
    }
    return hashlib.sha256(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()).hexdigest()


def _submit(contract, key):
    contract.submit_claim(
        key,
        PAGE_KEY,
        URL,
        "Runtime 4.2 supports Node 18 in production.",
        "The documentation states",
        "in the support matrix.",
        PAGE_DIGEST,
        "COMPATIBILITY",
        "The covered support matrix establishes the documented runtime guarantee.",
        json.dumps(["https://example.com/docs/covered-evidence"]),
        "",
    )


def _manifest(key, expiry, publisher, coverage):
    evidence = [{
        "evidence_id": "support-matrix",
        "authority_profile": "CONTENT_HASHED_HTTPS",
        "url": "https://example.com/docs/covered-evidence",
        "expected_sha256": hashlib.sha256(b"The support matrix confirms Runtime 4.2 supports Node 18 in production.").hexdigest(),
        "citation_exact": "Runtime 4.2 supports Node 18 in production.",
        "relation": "SUPPORTS",
        "authority_metadata": {"bounded_bytes": 40000},
    }]
    return json.dumps({
        "protocol_version": 2,
        "claim_key": key,
        "publisher_wallet": publisher,
        "domain": "example.com",
        "canonical_url": URL,
        "primary_artifact_sha256": PAGE_DIGEST,
        "claim_digest": hashlib.sha256(b"Runtime 4.2 supports Node 18 in production.").hexdigest(),
        "anchor_digest": hashlib.sha256(("The documentation states|Runtime 4.2 supports Node 18 in production.|in the support matrix.").encode()).hexdigest(),
        "coverage_cap": coverage,
        "evidence_pack": evidence,
        "issued_at": "2026-01-01T00:00:00+00:00",
        "expires_at": expiry,
        "nonce": "covered-nonce-1",
    }, separators=(",", ":"), sort_keys=True)


def test_covered_registration_requires_one_verified_canonical_consumer(direct_vm, direct_deploy, direct_alice):
    margin = direct_deploy("contracts/margin.py")
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    direct_vm.mock_web(r".*example\.com/\.well-known/margin/claims/.*", {"status": 200, "body": _manifest(key, expiry, "0x" + direct_alice.hex(), 5)})
    direct_vm.value = 5
    with direct_vm.expect_revert("canonical consumer must be bound"):
        margin.register_covered_claim(key, "covered-nonce-1", expiry)


def test_coverage_view_fails_closed_when_canonical_exposure_cannot_be_read(
    direct_vm, direct_deploy, direct_alice
):
    margin, consumer_address = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    direct_vm.mock_web(
        r".*example\.com/\.well-known/margin/claims/.*",
        {"status": 200, "body": _manifest(key, expiry, "0x" + direct_alice.hex(), 5)},
    )
    direct_vm.value = 5
    margin.register_covered_claim(key, "covered-nonce-1", expiry)
    _install_canonical_consumer_hook(
        direct_vm, consumer_address, margin.address, 0, fail_exposure=True
    )
    with direct_vm.expect_revert("canonical consumer exposure could not be read"):
        margin.get_coverage_state(key)


def test_canonical_consumer_binding_is_admin_only_verified_once_and_not_rebindable(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    margin = direct_deploy("contracts/margin.py")
    consumer_address = "0x" + "44" * 20
    _install_canonical_consumer_hook(direct_vm, consumer_address, margin.address, "0")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("deployment administrator"):
        margin.bind_canonical_consumer(consumer_address)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("malformed"):
        margin.bind_canonical_consumer("not-an-address")
    _install_canonical_consumer_hook(direct_vm, consumer_address, "0x" + "33" * 20, "0")
    with direct_vm.expect_revert("another MARGIN"):
        margin.bind_canonical_consumer(consumer_address)
    _install_canonical_consumer_hook(direct_vm, consumer_address, margin.address, "0")
    margin.bind_canonical_consumer(consumer_address)
    assert margin.get_canonical_consumer_address().lower() == consumer_address.lower()
    with direct_vm.expect_revert("already bound"):
        margin.bind_canonical_consumer(consumer_address)


def test_covered_claim_binds_manifest_collateral_and_exposure(direct_vm, direct_deploy, direct_alice, direct_bob):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    body = _manifest(key, expiry, "0x" + direct_alice.hex(), 5)
    direct_vm.mock_web(r".*example\.com/\.well-known/margin/claims/.*", {"status": 200, "body": body})
    direct_vm.value = 4
    with direct_vm.expect_revert("publisher collateral must cover the declared coverage cap"):
        margin.register_covered_claim(key, "covered-nonce-1", expiry)
    direct_vm.value = 5
    margin.register_covered_claim(key, "covered-nonce-1", expiry)
    covered = margin.get_covered_claim(key)
    assert covered["coverage_cap"] == 5
    assert covered["publisher_collateral"] == 5
    assert covered["required_challenge_bond"] == 5
    assert covered["evidence_pack_digest"]

    direct_vm.sender = direct_bob
    direct_vm.value = 4
    with direct_vm.expect_revert("challenge bond is required"):
        margin.challenge_assured_claim(key)
    direct_vm.value = 5
    margin.challenge_assured_claim(key)
    assert margin.get_covered_claim(key)["challenge_bond"] == 5


def test_covered_manifest_rejects_wrong_claim_or_under_collateral(direct_vm, direct_deploy, direct_alice):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    wrong = _manifest("f" * 64, expiry, "0x" + direct_alice.hex(), 5)
    direct_vm.mock_web(r".*example\.com/\.well-known/margin/claims/.*", {"status": 200, "body": wrong})
    direct_vm.value = 5
    with direct_vm.expect_revert("covered claim manifest could not be independently verified"):
        margin.register_covered_claim(key, "covered-nonce-1", expiry)


def test_covered_registration_cannot_overwrite_an_existing_assured_claim(direct_vm, direct_deploy, direct_alice):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    proof_expiry = "2999-01-01T00:00:00+00:00"
    proof = json.dumps({
        "protocol_version": 2,
        "domain": "example.com",
        "publisher_wallet": "0x" + direct_alice.hex(),
        "nonce": "ordinary-nonce",
        "claim_key": key,
        "expiry": proof_expiry,
    })
    direct_vm.mock_web(r".*example\.com/\.well-known/margin\.json", {"status": 200, "body": proof})
    direct_vm.value = 1
    margin.register_assured_claim(key, "https://example.com/.well-known/margin.json", "ordinary-nonce", proof_expiry)
    with direct_vm.expect_revert("assured claim already registered"):
        direct_vm.value = 5
        margin.register_covered_claim(key, "covered-nonce-1", proof_expiry)


def test_covered_manifest_requires_primary_artifact_commitment(direct_vm, direct_deploy, direct_alice):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    parsed = json.loads(_manifest(key, expiry, "0x" + direct_alice.hex(), 5))
    parsed.pop("primary_artifact_sha256")
    direct_vm.mock_web(
        r".*example\.com/\.well-known/margin/claims/.*",
        {"status": 200, "body": json.dumps(parsed, separators=(",", ":"), sort_keys=True)},
    )
    direct_vm.value = 5
    with direct_vm.expect_revert("covered claim manifest could not be independently verified"):
        margin.register_covered_claim(key, "covered-nonce-1", expiry)


def test_covered_manifest_enforces_typed_authority_profile_and_citation(direct_vm, direct_deploy, direct_alice):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    parsed = json.loads(_manifest(key, expiry, "0x" + direct_alice.hex(), 5))
    parsed["evidence_pack"][0]["authority_profile"] = "DOMAIN_CONTROLLED"
    parsed["evidence_pack"][0]["citation_exact"] = ""
    direct_vm.mock_web(
        r".*example\.com/\.well-known/margin/claims/.*",
        {"status": 200, "body": json.dumps(parsed, separators=(",", ":"), sort_keys=True)},
    )
    direct_vm.value = 5
    with direct_vm.expect_revert("covered claim manifest could not be independently verified"):
        margin.register_covered_claim(key, "covered-nonce-1", expiry)


def test_covered_citation_is_checked_against_the_complete_fetched_artifact(direct_vm, direct_deploy, direct_alice):
    margin = direct_deploy("contracts/margin.py")
    assert margin._covered_citation_present("prefix Runtime 4.2 supports Node 18 in production. suffix", "Runtime 4.2 supports Node 18 in production.")
    assert not margin._covered_citation_present("prefix Runtime 4.2 supports Node 20 in production. suffix", "Runtime 4.2 supports Node 18 in production.")
    assert margin._covered_citation_present("Runtime 4.2 supports Node 18 in production.", "Runtime 4.2 supports Node 18 in production.")


def test_covered_digest_mismatch_cannot_finalize_supported(direct_vm, direct_deploy, direct_alice, direct_bob):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    body = _manifest(key, expiry, "0x" + direct_alice.hex(), 5)
    parsed_manifest = json.loads(body)
    parsed_manifest["primary_artifact_sha256"] = hashlib.sha256(b"Support matrix: Runtime 4.2 supports Node 18 in production.").hexdigest()
    parsed_manifest["evidence_pack"][0]["expected_sha256"] = hashlib.sha256(b"different committed artifact").hexdigest()
    body = json.dumps(parsed_manifest, separators=(",", ":"), sort_keys=True)
    direct_vm.mock_web(r".*example\.com/\.well-known/margin/claims/.*", {"status": 200, "body": body})
    direct_vm.value = 5
    margin.register_covered_claim(key, "covered-nonce-1", expiry)
    direct_vm.sender = direct_bob
    direct_vm.value = 5
    margin.challenge_assured_claim(key)

    primary = "Support matrix: Runtime 4.2 supports Node 18 in production."
    # The committed citation is present, but the fetched artifact is not the
    # artifact named by the manifest. This isolates digest verification from
    # citation verification.
    observed_evidence = "The support matrix confirms Runtime 4.2 supports Node 18 in production."
    direct_vm.mock_web(r"https://example\.com/docs/runtime", {"status": 200, "body": primary})
    direct_vm.mock_web(r"https://example\.com/docs/covered-evidence", {"status": 200, "body": observed_evidence})
    records = [
        {"kind": "PRIMARY", "url": URL, "fetch_status": "OK", "content_digest": hashlib.sha256(primary.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE"},
        {"kind": "EVIDENCE", "url": "https://example.com/docs/covered-evidence", "fetch_status": "OK", "content_digest": hashlib.sha256(observed_evidence.encode()).hexdigest(), "provenance": "PUBLIC_SOURCE", "integrity_status": "INTEGRITY_FAILED"},
    ]
    digest = hashlib.sha256(json.dumps({"v": 2, "sources": records}, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "SUPPORTED", "rationale": "Committed evidence changed.", "claim_present": True,
        "supporting_source_indexes": [1], "contradicting_source_indexes": [], "historical_evidence_used": False,
        "source_manifest_digest": digest,
    }))
    margin.resolve_assured_claim(key)
    assert margin.get_claim(key)["status"] == "INCONCLUSIVE"


def test_covered_missing_citation_is_not_definitive(direct_vm, direct_deploy, direct_alice, direct_bob):
    margin, _consumer = _deploy_bound_margin(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    key = _claim_key()
    _submit(margin, key)
    expiry = "2999-01-01T00:00:00+00:00"
    parsed = json.loads(_manifest(key, expiry, "0x" + direct_alice.hex(), 5))
    primary = "Runtime 4.2 supports Node 18 in production."
    missing_citation = "The support matrix contains no version guarantee."
    parsed["primary_artifact_sha256"] = hashlib.sha256(primary.encode()).hexdigest()
    parsed["evidence_pack"][0]["expected_sha256"] = hashlib.sha256(missing_citation.encode()).hexdigest()
    direct_vm.mock_web(
        r".*example\.com/\.well-known/margin/claims/.*",
        {"status": 200, "body": json.dumps(parsed, separators=(",", ":"), sort_keys=True)},
    )
    direct_vm.value = 5
    margin.register_covered_claim(key, "covered-nonce-1", expiry)
    direct_vm.sender = direct_bob
    direct_vm.value = 5
    margin.challenge_assured_claim(key)
    direct_vm.mock_web(r"https://example\.com/docs/covered", {"status": 200, "body": primary})
    direct_vm.mock_web(r"https://example\.com/docs/covered-evidence", {"status": 200, "body": missing_citation})
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "SUPPORTED", "rationale": "The committed citation is absent.", "claim_present": True,
        "supporting_source_indexes": [1], "contradicting_source_indexes": [], "historical_evidence_used": False,
        "material_observations": [{
            "evidence_id": "support-matrix", "authority_profile": "CONTENT_HASHED_HTTPS", "authority_status": "ACCEPTED",
            "integrity_status": "VERIFIED", "citation_digest": hashlib.sha256(b"Runtime 4.2 supports Node 18 in production.").hexdigest(),
            "citation_present": False, "semantic_relation": "SUPPORTS",
        }],
    }))
    margin.resolve_assured_claim(key)
    assert margin.get_claim(key)["status"] == "INCONCLUSIVE"
