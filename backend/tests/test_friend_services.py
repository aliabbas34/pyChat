import pytest

from friends.services import (
    FriendshipError,
    Relationship,
    accept_request,
    are_friends,
    cancel_request,
    get_relationship,
    reject_request,
    send_request,
    unfriend,
)


def test_request_lifecycle_until_friends(alice, bob):
    send_request(alice, bob)
    assert get_relationship(alice, bob) == Relationship.SENT
    assert get_relationship(bob, alice) == Relationship.RECEIVED

    accept_request(bob, alice)
    assert are_friends(alice, bob)
    assert get_relationship(alice, bob) == Relationship.FRIENDS


def test_cannot_request_when_other_side_already_requested(alice, bob):
    send_request(alice, bob)
    with pytest.raises(FriendshipError):
        send_request(bob, alice)


@pytest.mark.parametrize("setup", ["self", "duplicate", "friends"])
def test_invalid_requests_are_rejected(alice, bob, make_friends, setup):
    target = bob
    if setup == "self":
        target = alice
    elif setup == "duplicate":
        send_request(alice, bob)
    else:
        make_friends(alice, bob)
    with pytest.raises(FriendshipError):
        send_request(alice, target)


def test_reject_and_cancel_remove_request(alice, bob):
    send_request(alice, bob)
    reject_request(bob, alice)
    assert get_relationship(alice, bob) == Relationship.NONE

    send_request(alice, bob)
    cancel_request(alice, bob)
    assert get_relationship(alice, bob) == Relationship.NONE


def test_accept_without_request_fails(alice, bob):
    with pytest.raises(FriendshipError):
        accept_request(bob, alice)


def test_unfriend(alice, bob, make_friends):
    make_friends(alice, bob)
    unfriend(bob, alice)
    assert not are_friends(alice, bob)
    with pytest.raises(FriendshipError):
        unfriend(alice, bob)
