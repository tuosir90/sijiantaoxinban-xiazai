import sys
from pathlib import Path

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.index import app


def test_error_response_contains_debug_headers(monkeypatch):
    monkeypatch.setenv("DIAGNOSTIC_LOGS", "1")
    client = TestClient(app)
    response = client.post("/api/generate", data={"module": "invalid"})
    assert response.status_code == 400
    assert response.headers.get("X-Debug-Version")
    assert response.headers.get("X-Debug-Logs") == "1"
