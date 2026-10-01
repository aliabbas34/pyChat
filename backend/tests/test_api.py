from rest_framework.test import APIClient


def test_signup_returns_tokens(db):
    response = APIClient().post(
        "/api/auth/signup/",
        {
            "username": "dave",
            "display_name": "Dave",
            "email": "dave@example.com",
            "password": "s3cure-pass-123",
        },
    )
    assert response.status_code == 201
    assert {"access", "refresh"} <= response.data.keys()


def test_endpoints_require_auth(db):
    assert APIClient().get("/api/chats/").status_code == 401


def test_search_matches_username_or_display_name_and_excludes_self(
    alice, bob, make_user, client_for
):
    make_user("bobby")
    response = client_for(alice).get("/api/users/search/", {"q": "BOB"})
    assert [u["username"] for u in response.data] == ["bob", "bobby"]
    assert response.data[0]["relationship"] == "none"

    response = client_for(alice).get("/api/users/search/", {"q": "ali"})
    assert response.data == []


def test_friend_request_flow_over_api(alice, bob, client_for):
    assert client_for(alice).post("/api/friends/requests/", {"username": "bob"}).status_code == 201

    requests = client_for(bob).get("/api/friends/requests/").data
    assert [u["username"] for u in requests["incoming"]] == ["alice"]

    assert client_for(bob).post("/api/friends/requests/alice/accept/").status_code == 204
    assert client_for(alice).get("/api/users/bob/").data["relationship"] == "friends"
    assert [c["username"] for c in client_for(alice).get("/api/chats/").data] == ["bob"]


def test_domain_error_returns_400(alice, client_for):
    response = client_for(alice).post("/api/friends/requests/", {"username": "alice"})
    assert response.status_code == 400
    assert response.data["detail"] == "You cannot add yourself."


def test_history_forbidden_for_non_friends(alice, bob, client_for):
    assert client_for(alice).get("/api/chats/bob/messages/").status_code == 400


def test_change_password(alice, client_for):
    client = client_for(alice)
    wrong = client.post(
        "/api/users/me/password/",
        {"current_password": "nope", "new_password": "an0ther-pass-456"},
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/api/users/me/password/",
        {"current_password": "s3cure-pass-123", "new_password": "an0ther-pass-456"},
    )
    assert ok.status_code == 204
    alice.refresh_from_db()
    assert alice.check_password("an0ther-pass-456")
