import sys
from pathlib import Path

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import api.index as api_index


def test_debug_error_handler_includes_detail(monkeypatch):
    monkeypatch.setenv("DIAGNOSTIC_LOGS", "1")
    monkeypatch.setattr(api_index, "generate_pdf_bytes", lambda **_: (_ for _ in ()).throw(ValueError("boom")))

    client = TestClient(api_index.app)
    response = client.post("/api/generate", data={"module": "brand", "payload_json": "{}"})
    assert response.status_code == 500
    data = response.json()
    assert "boom" in data["detail"]
    assert data["type"] == "ValueError"
    assert response.headers.get("X-Debug-Version")
