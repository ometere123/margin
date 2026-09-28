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
    direct_vm.mock_llm(r".*MARGIN web-claim challenge.*", json.dumps({
        "status": "CONTRADICTED",
        "rationale": "The authoritative support matrix requires Node 20 or newer.",
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
