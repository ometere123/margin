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
