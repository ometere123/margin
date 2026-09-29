import pytest


def _install_margin_view_hook(direct_vm, claim_key, margin_address):
    """Expose a canonical MARGIN view fixture through contract calls."""
    from genlayer.py import calldata

    def hook(_vm, request):
        call = request.get("CallContract")
        if not call:
            return None
        address = call.get("address")
        address_hex = address.as_hex if hasattr(address, "as_hex") else str(address)
        if address_hex.lower() != margin_address.lower():
            return bytes([1]) + b"unexpected canonical MARGIN address"
        encoded = call.get("calldata", {})
        method = encoded.get("method")
        args = encoded.get("args", [])
        if method == "get_claim":
            result = {"claim_key": claim_key} if args[0] == claim_key else {}
        elif method == "get_assured_claim":
            result = {"claim_key": claim_key, "state": "REGISTERED", "final_status": "OPEN"} if args[0] == claim_key else {}
        elif method == "is_claim_supported":
            result = False
        else:
            return bytes([1]) + f"unsupported MARGIN view {method}".encode()
        return bytes([0]) + calldata.encode(result)

    direct_vm._gl_call_hook = hook


def _deploy_registered_fixture(direct_vm, direct_deploy, direct_alice, direct_bob):
    key = "a" * 64
    margin_address = "0x" + "22" * 20
    consumer = direct_deploy("contracts/margin_consumer.py", margin_address)
    _install_margin_view_hook(direct_vm, key, margin_address)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    return consumer, key, margin_address


def test_consumer_binds_margin_address_and_rejects_substitution(
    direct_vm, direct_deploy, direct_alice
):
    canonical_address = "0x" + "22" * 20
    consumer = direct_deploy("contracts/margin_consumer.py", canonical_address)
    direct_vm.sender = direct_alice
    assert consumer.canonical_margin_address.as_hex.lower() == canonical_address.lower()

    with pytest.raises(TypeError):
        consumer.execute_if_supported("0x" + "11" * 20, "claim-key")

    with direct_vm.expect_revert("assured claim is not finalized"):
        consumer.execute_if_supported("claim-key")


def test_protected_release_requires_existing_canonical_claim_and_keeps_creator_bound(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    consumer, key, _address = _deploy_registered_fixture(
        direct_vm, direct_deploy, direct_alice, direct_bob
    )
    direct_vm.value = 0
    with direct_vm.expect_revert("release amount must be positive"):
        consumer.create_protected_release(key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00")

    direct_vm.value = 3
    release_id = consumer.create_protected_release(
        key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
    )
    release = consumer.get_release(release_id)
    assert release["creator"].lower() == ("0x" + direct_alice.hex()).lower()
    assert release["beneficiary"].lower() == ("0x" + direct_bob.hex()).lower()
    assert release["amount"] == 3
    assert release["executed"] is False
    assert release["refunded"] is False

    second_id = consumer.create_protected_release(
        key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
    )
    assert second_id != release_id
    releases = consumer.get_releases_for_claim(key)
    assert [item["release_id"] for item in releases] == [release_id, second_id]
    assert consumer.get_release_for_claim(key)["release_id"] == release_id


def test_protected_release_rejects_bad_expiry_and_unauthorised_refund(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    consumer, key, _address = _deploy_registered_fixture(
        direct_vm, direct_deploy, direct_alice, direct_bob
    )
    direct_vm.value = 2
    with direct_vm.expect_revert("release expiry must include a timezone"):
        consumer.create_protected_release(key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00")

    release_id = consumer.create_protected_release(
        key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
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
    consumer, key, _address = _deploy_registered_fixture(
        direct_vm, direct_deploy, direct_alice, direct_bob
    )
    direct_vm.value = 4
    release_id = consumer.create_protected_release(
        key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
    )

    direct_vm.warp("2999-01-02T00:00:00+00:00")
    with direct_vm.expect_revert("protected release has expired"):
        consumer.execute_release(release_id)
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


def test_protected_release_cap_is_per_creator_and_pagination_is_bounded(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    consumer, key, _address = _deploy_registered_fixture(
        direct_vm, direct_deploy, direct_alice, direct_bob
    )
    for _ in range(5):
        direct_vm.value = 1
        consumer.create_protected_release(
            key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
        )
    assert len(consumer.get_releases_for_claim(key)) == 5
    direct_vm.value = 1
    with direct_vm.expect_revert("maximum protected releases reached for creator and claim"):
        consumer.create_protected_release(
            key, "0x" + direct_bob.hex(), "2999-01-01T00:00:00+00:00"
        )
    direct_vm.sender = direct_bob
    direct_vm.value = 1
    other_creator_release = consumer.create_protected_release(
        key, "0x" + direct_alice.hex(), "2999-01-01T00:00:00+00:00"
    )
    assert other_creator_release
    assert len(consumer.get_releases_for_claim_page(key, 0, 25)) == 6
    assert len(consumer.get_releases_for_claim_page(key, 5, 1)) == 1
    assert consumer.get_releases_for_claim_page(key, 6, 1) == []
    with direct_vm.expect_revert("release page limit must be between 1 and 25"):
        consumer.get_releases_for_claim_page(key, 0, 26)
