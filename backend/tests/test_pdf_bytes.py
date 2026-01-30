from fastapi.testclient import TestClient


def test_pdf_returns_pdf_bytes():
    from app.main import create_app

    client = TestClient(create_app())
    res = client.post("/api/reports/pdf", json={"module": "brand", "markdown": "# 中文测试\n内容"})
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("application/pdf")
    assert res.content[:4] == b"%PDF"

