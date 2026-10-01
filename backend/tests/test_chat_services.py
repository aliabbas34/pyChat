import pytest

from chat.services import ChatError, chat_list, get_history, mark_read, send_message
from friends.services import unfriend


def test_only_friends_can_message(alice, bob):
    with pytest.raises(ChatError):
        send_message(alice, bob, "hi")


def test_unfriend_blocks_chat_but_keeps_history(alice, bob, make_friends):
    make_friends(alice, bob)
    send_message(alice, bob, "hi")
    unfriend(alice, bob)
    with pytest.raises(ChatError):
        send_message(alice, bob, "still there?")

    make_friends(alice, bob)
    assert [m.content for m in get_history(alice, bob)] == ["hi"]


def test_empty_message_rejected(alice, bob, make_friends):
    make_friends(alice, bob)
    with pytest.raises(ChatError):
        send_message(alice, bob, "   ")


def test_history_cursor_pagination(alice, bob, make_friends):
    make_friends(alice, bob)
    messages = [send_message(alice, bob, str(i)) for i in range(5)]

    latest = get_history(alice, bob, limit=2)
    assert [m.content for m in latest] == ["3", "4"]

    older = get_history(alice, bob, before_id=latest[0].id, limit=2)
    assert [m.content for m in older] == ["1", "2"]
    assert older[0].id == messages[1].id


def test_mark_read(alice, bob, make_friends):
    make_friends(alice, bob)
    message = send_message(alice, bob, "hi")
    assert mark_read(bob, alice) == [message.id]
    assert mark_read(bob, alice) == []


def test_chat_list_orders_by_last_message_and_counts_unread(alice, bob, make_user, make_friends):
    carol = make_user("carol")
    make_friends(alice, bob)
    make_friends(alice, carol)
    send_message(bob, alice, "from bob")
    send_message(carol, alice, "from carol 1")
    send_message(carol, alice, "from carol 2")

    rows = list(chat_list(alice))
    assert [r.username for r in rows] == ["carol", "bob"]
    assert rows[0].last_message == "from carol 2"
    assert rows[0].unread_count == 2
