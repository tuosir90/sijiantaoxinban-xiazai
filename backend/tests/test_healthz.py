from fastapi.testclient import TestClient


def test_healthz_returns_ok():
    from app.main import create_app

    client = TestClient(create_app())
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

