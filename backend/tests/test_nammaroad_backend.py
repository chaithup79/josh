"""NammaRoad backend integration tests"""
import os
import json
import asyncio
import pytest
import requests
import websockets

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://road-report-live.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
# WebSocket endpoint - use local backend (Kubernetes ingress may not proxy websockets reliably)
WS_URL = "ws://localhost:8001/api/ws"
INVITE_CODE = "BBMP-2026"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def seeded(session):
    r = session.post(f"{API}/seed", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- AUTH ----------
class TestAuth:
    def test_login_citizen(self, session):
        r = session.post(f"{API}/auth/login", json={"name": "TEST_CitizenA", "phone": "9999900001", "role": "citizen"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["role"] == "citizen" and d.get("token")

    def test_login_engineer(self, session):
        r = session.post(f"{API}/auth/login", json={"name": "TEST_EngA", "phone": "9999900002", "role": "engineer", "invite_code": INVITE_CODE})
        assert r.status_code == 200
        assert r.json()["role"] == "engineer"

    def test_login_admin(self, session):
        r = session.post(f"{API}/auth/login", json={"name": "TEST_AdminA", "phone": "9999900003", "role": "admin", "invite_code": INVITE_CODE})
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_with_token(self, session):
        login = session.post(f"{API}/auth/login", json={"name": "TEST_MeUser", "phone": "9999900004", "role": "citizen"}).json()
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {login['token']}"})
        assert r.status_code == 200
        assert r.json()["phone"] == "9999900004"

    def test_me_missing_token(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, session):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid-xyz"})
        assert r.status_code == 401


# ---------- SEED ----------
class TestSeed:
    def test_seed_endpoint(self, seeded):
        assert seeded["ok"] is True
        assert seeded["potholes_count"] == 8
        assert seeded["users"]["admin"]["token"] == "bbmp-admin-token"
        assert seeded["users"]["engineer"]["token"] == "engineer-token"
        assert seeded["users"]["citizen"]["token"] == "citizen-token"


# ---------- POTHOLES ----------
class TestPotholes:
    def test_list_all(self, seeded, session):
        r = session.get(f"{API}/potholes")
        assert r.status_code == 200
        assert len(r.json()) >= 8

    def test_filter_by_status(self, seeded, session):
        r = session.get(f"{API}/potholes", params={"status": "fixed"})
        assert r.status_code == 200
        assert all(p["status"] == "fixed" for p in r.json())

    def test_filter_by_zone(self, seeded, session):
        r = session.get(f"{API}/potholes", params={"zone": "South Zone"})
        assert r.status_code == 200
        assert all(p["zone"] == "South Zone" for p in r.json())

    def test_mine_filter_citizen(self, seeded, session):
        r = session.get(f"{API}/potholes", params={"mine": "true"}, headers={"Authorization": "Bearer citizen-token"})
        assert r.status_code == 200
        assert len(r.json()) >= 8  # seeded by citizen

    def test_create_pothole_citizen(self, seeded, session):
        body = {
            "photo_base64": "data:image/png;base64,AAA",
            "latitude": 12.5,
            "longitude": 77.5,
            "zone": "East Zone",
            "road_name": "TEST_Road",
            "severity": "high",
        }
        r = session.post(f"{API}/potholes", json=body, headers={"Authorization": "Bearer citizen-token"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "reported"
        assert d["zone"] == "East Zone"
        # persistence via GET
        g = session.get(f"{API}/potholes/{d['id']}")
        assert g.status_code == 200
        assert g.json()["id"] == d["id"]
        pytest.created_id = d["id"]

    def test_duplicate_detection(self, session):
        body = {
            "photo_base64": "data:image/png;base64,AAA",
            "latitude": 12.50001,
            "longitude": 77.50001,
            "zone": "East Zone",
            "severity": "medium",
        }
        r = session.post(f"{API}/potholes", json=body, headers={"Authorization": "Bearer citizen-token"})
        assert r.status_code == 200
        assert r.json()["is_duplicate_of"] is not None

    def test_get_pothole_404(self, session):
        r = session.get(f"{API}/potholes/nonexistent-id-xxx")
        assert r.status_code == 404

    def test_create_unauthenticated(self, session):
        r = requests.post(f"{API}/potholes", json={"photo_base64": "x", "latitude": 0, "longitude": 0, "zone": "East Zone"})
        assert r.status_code == 401


# ---------- STATUS TRANSITIONS ----------
class TestStatus:
    def test_admin_can_update(self, seeded, session):
        plist = session.get(f"{API}/potholes", params={"status": "reported"}).json()
        pid = plist[0]["id"]
        r = session.patch(f"{API}/potholes/{pid}/status",
                          json={"new_status": "verified", "comment": "TEST_verified"},
                          headers={"Authorization": "Bearer bbmp-admin-token"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "verified"

    def test_citizen_cannot_update(self, seeded, session):
        plist = session.get(f"{API}/potholes").json()
        pid = plist[0]["id"]
        r = session.patch(f"{API}/potholes/{pid}/status",
                          json={"new_status": "verified"},
                          headers={"Authorization": "Bearer citizen-token"})
        assert r.status_code == 403

    def test_invalid_status(self, seeded, session):
        plist = session.get(f"{API}/potholes").json()
        pid = plist[0]["id"]
        r = session.patch(f"{API}/potholes/{pid}/status",
                          json={"new_status": "bogus"},
                          headers={"Authorization": "Bearer bbmp-admin-token"})
        assert r.status_code == 400

    def test_status_history_ascending(self, seeded, session):
        plist = session.get(f"{API}/potholes").json()
        pid = plist[0]["id"]
        # add an update
        session.patch(f"{API}/potholes/{pid}/status",
                      json={"new_status": "verified", "comment": "TEST_hist"},
                      headers={"Authorization": "Bearer bbmp-admin-token"})
        r = session.get(f"{API}/potholes/{pid}/status-history")
        assert r.status_code == 200
        hist = r.json()
        assert len(hist) >= 1
        timestamps = [h["timestamp"] for h in hist]
        assert timestamps == sorted(timestamps), "history not ascending"


# ---------- UPVOTE ----------
class TestUpvote:
    def test_upvote_once_and_idempotent(self, seeded, session):
        # use engineer token (different user from citizen who seeded upvotes)
        plist = session.get(f"{API}/potholes").json()
        pid = plist[0]["id"]
        r1 = session.post(f"{API}/potholes/{pid}/upvote",
                          headers={"Authorization": "Bearer engineer-token"})
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        # second call
        r2 = session.post(f"{API}/potholes/{pid}/upvote",
                          headers={"Authorization": "Bearer engineer-token"})
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["already"] is True
        assert d2["upvotes"] == d1["upvotes"]


# ---------- ANALYTICS ----------
class TestAnalytics:
    def test_analytics_shape(self, seeded, session):
        r = session.get(f"{API}/analytics")
        assert r.status_code == 200
        d = r.json()
        for k in ("total", "fixed", "pending", "by_status", "zone_stats"):
            assert k in d
        assert d["total"] >= 8
        assert isinstance(d["zone_stats"], list) and len(d["zone_stats"]) == 8
        assert set(d["by_status"].keys()) == {"reported", "verified", "assigned", "work_started", "fixed"}


# ---------- INVITE CODE (BBMP-2026) ----------
class TestInviteCode:
    """Admin/engineer must supply a valid BBMP invite code; citizens unaffected."""

    def test_admin_login_without_code_forbidden(self, session):
        r = session.post(f"{API}/auth/login", json={
            "name": "TEST_AdminNoCode", "phone": "9999911101", "role": "admin"
        })
        assert r.status_code == 403, r.text
        assert "invite" in r.text.lower()

    def test_engineer_login_with_wrong_code_forbidden(self, session):
        r = session.post(f"{API}/auth/login", json={
            "name": "TEST_EngWrong", "phone": "9999911102",
            "role": "engineer", "invite_code": "WRONG"
        })
        assert r.status_code == 403, r.text

    def test_admin_login_with_correct_code_succeeds(self, session):
        r = session.post(f"{API}/auth/login", json={
            "name": "TEST_AdminOK", "phone": "9999911103",
            "role": "admin", "invite_code": INVITE_CODE
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["role"] == "admin"
        assert d.get("token")
        # verify token works
        me = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {d['token']}"})
        assert me.status_code == 200
        assert me.json()["phone"] == "9999911103"

    def test_citizen_login_without_code_still_works(self, session):
        r = session.post(f"{API}/auth/login", json={
            "name": "TEST_CitizenNoCode", "phone": "9999911104", "role": "citizen"
        })
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "citizen"

    def test_engineer_login_with_correct_code_succeeds(self, session):
        r = session.post(f"{API}/auth/login", json={
            "name": "TEST_EngOK", "phone": "9999911105",
            "role": "engineer", "invite_code": INVITE_CODE
        })
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "engineer"


# ---------- WEBSOCKETS ----------
async def _recv_until(ws, predicate, timeout=5.0):
    """Receive messages until predicate(msg_dict) is True or timeout."""
    end = asyncio.get_event_loop().time() + timeout
    while True:
        remaining = end - asyncio.get_event_loop().time()
        if remaining <= 0:
            raise asyncio.TimeoutError("predicate not matched in time")
        raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if predicate(msg):
            return msg


class TestWebSocket:
    """WebSocket /api/ws connection + broadcast on pothole events."""

    def test_ws_hello_on_connect(self, seeded):
        async def run():
            async with websockets.connect(WS_URL, open_timeout=5) as ws:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
                msg = json.loads(raw)
                assert msg.get("type") == "hello"
                assert msg.get("message") == "connected"
        asyncio.run(run())

    def test_ws_broadcast_pothole_created(self, seeded, session):
        async def run():
            async with websockets.connect(WS_URL, open_timeout=5) as ws:
                # consume hello
                await asyncio.wait_for(ws.recv(), timeout=5)
                # trigger create via HTTP in a thread to avoid blocking event loop
                loop = asyncio.get_event_loop()
                body = {
                    "photo_base64": "data:image/png;base64,AAA",
                    "latitude": 12.61, "longitude": 77.61,
                    "zone": "West Zone", "severity": "high",
                    "road_name": "TEST_WS_Road",
                }
                fut = loop.run_in_executor(
                    None,
                    lambda: session.post(f"{API}/potholes", json=body,
                                         headers={"Authorization": "Bearer citizen-token"})
                )
                msg = await _recv_until(ws, lambda m: m.get("type") == "pothole_created", timeout=10)
                resp = await fut
                assert resp.status_code == 200
                created_id = resp.json()["id"]
                assert msg["pothole_id"] == created_id
                assert msg["zone"] == "West Zone"
                assert msg["status"] == "reported"
                assert msg["severity"] == "high"
                pytest.ws_created_id = created_id
        asyncio.run(run())

    def test_ws_broadcast_status_updated(self, seeded, session):
        # ensure we have a target pothole id
        pid = getattr(pytest, "ws_created_id", None)
        if not pid:
            plist = session.get(f"{API}/potholes", params={"status": "reported"}).json()
            pid = plist[0]["id"]

        async def run():
            async with websockets.connect(WS_URL, open_timeout=5) as ws:
                await asyncio.wait_for(ws.recv(), timeout=5)  # hello
                loop = asyncio.get_event_loop()
                fut = loop.run_in_executor(
                    None,
                    lambda: session.patch(
                        f"{API}/potholes/{pid}/status",
                        json={"new_status": "verified", "comment": "TEST_WS_verify"},
                        headers={"Authorization": "Bearer bbmp-admin-token"},
                    ),
                )
                msg = await _recv_until(ws, lambda m: m.get("type") == "status_updated"
                                       and m.get("pothole_id") == pid, timeout=10)
                resp = await fut
                assert resp.status_code == 200
                assert msg["new_status"] == "verified"
                assert msg["old_status"] in ("reported", "verified", "assigned", "work_started", "fixed")
                assert msg.get("updated_by")
        asyncio.run(run())

    def test_ws_broadcast_upvoted(self, seeded, session):
        # create a fresh citizen who has not upvoted anything
        login = session.post(f"{API}/auth/login", json={
            "name": "TEST_WS_Upvoter", "phone": "9999922201", "role": "citizen"
        }).json()
        token = login["token"]

        # pick a pothole this user hasn't upvoted
        plist = session.get(f"{API}/potholes").json()
        pid = plist[0]["id"]

        async def run():
            async with websockets.connect(WS_URL, open_timeout=5) as ws:
                await asyncio.wait_for(ws.recv(), timeout=5)  # hello
                loop = asyncio.get_event_loop()
                fut = loop.run_in_executor(
                    None,
                    lambda: session.post(
                        f"{API}/potholes/{pid}/upvote",
                        headers={"Authorization": f"Bearer {token}"},
                    ),
                )
                resp = await fut
                assert resp.status_code == 200
                if resp.json().get("already"):
                    pytest.skip("user already upvoted this pothole - no broadcast expected")
                msg = await _recv_until(ws, lambda m: m.get("type") == "upvoted"
                                       and m.get("pothole_id") == pid, timeout=10)
                assert isinstance(msg["upvotes"], int)
                assert msg["upvotes"] >= 1
        asyncio.run(run())

