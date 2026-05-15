"""Migration-specific tests (MongoDB -> MySQL). Named with `aa_` prefix so
pytest collects this BEFORE test_nammaroad_backend.py to validate the
clean/empty-DB state BEFORE the seed fixture runs.
"""
import os
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://road-report-live.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestMigrationMeta:
    """Verify backend is on MySQL and reports version 2.0"""

    def test_root_reports_mysql_v2(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("version") == "2.0", d
        assert d.get("db") == "MySQL", d


class TestAnalyticsZeroState:
    """DB must start EMPTY -- before any seed call, analytics returns all zeros.
    Note: relies on test ordering; this file is named `test_aa_migration.py`
    to ensure pytest collects it BEFORE test_nammaroad_backend.py (which seeds).
    """

    def test_analytics_all_zeros_pre_seed(self, session):
        r = session.get(f"{API}/analytics", timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["total"] == 0, f"DB not empty pre-seed: {d}"
        assert d["fixed"] == 0
        assert d["pending"] == 0
        assert d["fix_rate"] == 0
        assert d["by_status"] == {
            "reported": 0, "verified": 0, "assigned": 0,
            "work_started": 0, "fixed": 0,
        }
        assert isinstance(d["zone_stats"], list) and len(d["zone_stats"]) == 8
        for z in d["zone_stats"]:
            assert z["total"] == 0 and z["fixed"] == 0 and z["pending"] == 0

    def test_potholes_list_empty_pre_seed(self, session):
        r = session.get(f"{API}/potholes", timeout=10)
        assert r.status_code == 200
        assert r.json() == []


class TestMySQLDurability:
    """Data created via POST /api/potholes must persist across a backend restart
    (verifies MySQL is the actual store, not in-memory state)."""

    def test_create_then_restart_then_read(self, session):
        # Login a fresh citizen
        login = session.post(f"{API}/auth/login", json={
            "name": "TEST_DurabilityCitizen",
            "phone": "9999933001",
            "role": "citizen",
        }, timeout=10)
        assert login.status_code == 200, login.text
        token = login.json()["token"]

        body = {
            "photo_base64": "data:image/png;base64,AAA",
            "latitude": 12.8888,
            "longitude": 77.8888,
            "zone": "RR Nagar Zone",
            "road_name": "TEST_Durability_Road",
            "severity": "high",
            "description": "TEST_durability_marker",
        }
        c = session.post(f"{API}/potholes", json=body,
                         headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert c.status_code == 200, c.text
        pid = c.json()["id"]

        # Restart backend via supervisor
        subprocess.run(
            ["sudo", "supervisorctl", "restart", "backend"],
            check=True, capture_output=True,
        )
        # Wait for backend to come back up
        deadline = time.time() + 30
        while time.time() < deadline:
            try:
                rr = requests.get(f"{API}/", timeout=3)
                if rr.status_code == 200:
                    break
            except Exception:
                pass
            time.sleep(1)
        else:
            pytest.fail("Backend did not come back online after restart")

        # Pothole must still exist
        g = requests.get(f"{API}/potholes/{pid}", timeout=10)
        assert g.status_code == 200, g.text
        assert g.json()["id"] == pid
        assert g.json()["description"] == "TEST_durability_marker"
        # Token must still authenticate (user row persisted)
        me = requests.get(f"{API}/auth/me",
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert me.status_code == 200
        assert me.json()["phone"] == "9999933001"
