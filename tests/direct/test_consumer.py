import pytest


def test_consumer_binds_margin_address_and_rejects_substitution(
    direct_vm, direct_deploy, direct_alice
):
    canonical_address = "0x" + "22" * 20
    consumer = direct_deploy("contracts/margin_consumer.py", canonical_address)
    direct_vm.sender = direct_alice
    assert consumer.canonical_margin_address.as_hex.lower() == canonical_address.lower()

    # The write has one public argument: a claim key. A caller cannot nominate
    # the fake contract, so the canonical address remains the only trust anchor.
    with pytest.raises(TypeError):
        consumer.execute_if_supported("0x" + "11" * 20, "claim-key")

    # A canonical claim that is not settled remains rejected, proving the
    # consumer is actually reading the bound MARGIN contract.
    with direct_vm.expect_revert("assured claim is not finalized"):
        consumer.execute_if_supported("claim-key")


def test_protected_release_requires_positive_funding_and_keeps_creator_bound(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    canonical_address = "0x" + "22" * 20
    consumer = direct_deploy("contracts/margin_consumer.py", canonical_address)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert("release amount must be positive"):
        consumer.create_protected_release("claim-key", "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00")

    direct_vm.value = 3
    release_id = consumer.create_protected_release(
        "claim-key", "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
    )
    release = consumer.get_release(release_id)
    assert release["creator"].lower() == ("0x" + direct_alice.hex()).lower()
    assert release["beneficiary"].lower() == ("0x" + direct_bob.hex()).lower()
    assert release["amount"] == 3
    assert release["executed"] is False
    assert release["refunded"] is False
