from fastapi.testclient import TestClient


def test_preview_returns_html():
    from app.main import create_app

    client = TestClient(create_app())
    res = client.post("/api/reports/preview", json={"module": "brand", "markdown": "# 标题\n内容"})
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "<h1" in res.text

