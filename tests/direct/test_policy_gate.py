"""Direct Mode tests for the separately deployable MARGIN Connect policy gate."""

import hashlib
import pytest

from glsim.engine import SimEngine
from glsim.state import StateStore


OWNER = "0x" + "11" * 20
OUTSIDER = "0x" + "22" * 20
CLAIM_KEY = "a" * 64
CANONICAL_URL = "https://example.com/release.html"
PUBLISHER = "0x" + "33" * 20
MANIFEST = "b" * 64
EVIDENCE = "c" * 64
PRIMARY = "d" * 64
POLICY = "e" * 64
CONSUMER = "0x" + "44" * 20


def _deploy(mode="APPROVED"):
    state = StateStore(chain_id=61999, seed="policy-gate-" + mode)
    engine = SimEngine(state)
    engine.activate()
    source, _ = engine.deploy(
        "tests/fixtures/mock_margin_policy_source.py",
        args=[mode, CLAIM_KEY, CANONICAL_URL, PUBLISHER, MANIFEST, EVIDENCE, PRIMARY],
        sender=OWNER,
    )
    gate_address, gate = engine.deploy(
        "contracts/margin_policy_gate.py",
        args=[source, "release-policy-v1", CLAIM_KEY, CANONICAL_URL, PUBLISHER, MANIFEST, EVIDENCE, PRIMARY, POLICY, "2999-01-01T00:00:00+00:00"],
        sender=OWNER,
    )
    return engine, source, gate_address, gate


def test_approved_policy_performs_one_consequential_action_and_replay_is_rejected():
    engine, _, gate_address, gate = _deploy()
    try:
        decision = gate.evaluate_policy()
        assert decision["state"] == "APPROVED"
        action_digest = hashlib.sha256(b"release-artifact").hexdigest()
        engine.call_method(gate_address, "perform", ["release-123", action_digest], sender=OWNER)
        assert gate.get_action("release-123")["action_digest"] == action_digest
        assert gate.action_count_read() == 1
        with pytest.raises(Exception, match="already been performed"):
            engine.call_method(gate_address, "perform", ["release-123", action_digest], sender=OWNER)
        with pytest.raises(Exception, match="only the policy owner"):
            engine.call_method(gate_address, "perform", ["release-456", action_digest], sender=OUTSIDER)
    finally:
        engine.deactivate()


@pytest.mark.parametrize("mode,expected_state", [("ORDINARY", "DENIED"), ("PENDING", "PENDING"), ("NEGATIVE", "DENIED"), ("MALFORMED", "UNAVAILABLE"), ("UNAVAILABLE", "UNAVAILABLE")])
def test_policy_gate_fails_closed_for_non_approved_or_unavailable_margin_state(mode, expected_state):
    engine, _, gate_address, gate = _deploy(mode)
    try:
        assert gate.evaluate_policy()["state"] == expected_state
        with pytest.raises(Exception, match="policy is not approved"):
            engine.call_method(gate_address, "perform", ["action", "f" * 64], sender=OWNER)
    finally:
        engine.deactivate()


def test_policy_is_immutable_and_policy_identity_is_returned():
    engine, _, gate_address, gate = _deploy()
    try:
        policy = gate.get_policy()
        assert policy["claim_key"] == CLAIM_KEY
        assert policy["canonical_url"] == CANONICAL_URL
        assert policy["publisher"].lower() == PUBLISHER.lower()
        assert policy["canonical_margin"].lower() != ("0x" + "00" * 20)
    finally:
        engine.deactivate()
