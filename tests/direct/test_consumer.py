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


def test_protected_release_rejects_bad_expiry_and_unauthorised_refund(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    consumer = direct_deploy("contracts/margin_consumer.py", "0x" + "22" * 20)
    direct_vm.sender = direct_alice
    direct_vm.value = 2
    with direct_vm.expect_revert("release expiry must include a timezone"):
        consumer.create_protected_release(
            "claim-key", "0x" + direct_bob.hex(), "2999-01-01T00:00:00"
        )

    release_id = consumer.create_protected_release(
        "claim-key", "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
    )
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only the release creator may refund"):
        consumer.refund_release(release_id)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("release is not refundable yet"):
        consumer.refund_release(release_id)


def test_protected_release_expiry_refund_is_single_use_and_pull_payment(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    consumer = direct_deploy("contracts/margin_consumer.py", "0x" + "22" * 20)
    direct_vm.sender = direct_alice
    direct_vm.value = 4
    release_id = consumer.create_protected_release(
        "claim-key", "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
    )

    direct_vm.warp("2999-01-02T00:00:00+00:00")
    consumer.refund_release(release_id)
    release = consumer.get_release(release_id)
    assert release["refunded"] is True
    assert release["creator_credit"] == 4

    with direct_vm.expect_revert("protected release already completed"):
        consumer.refund_release(release_id)
    with direct_vm.expect_revert("protected release already completed"):
        consumer.execute_release(release_id)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("no release credit"):
        consumer.withdraw_release_credit(release_id)

    direct_vm.sender = direct_alice
    consumer.withdraw_release_credit(release_id)
    assert consumer.get_release(release_id)["creator_credit"] == 0
    with direct_vm.expect_revert("no release credit"):
        consumer.withdraw_release_credit(release_id)
