from pathlib import Path
import json
import sys

from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest


def test_api_entry_importable():
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path = [p for p in sys.path if p != str(backend_dir)]
    sys.path.insert(0, str(repo_root))
    __import__("api.index")


def test_api_entry_serves_split_ui_assets():
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path = [p for p in sys.path if p != str(backend_dir)]
    sys.path.insert(0, str(repo_root))

    from api.index import app

    client = TestClient(app)

    css_res = client.get("/ui/unified-ui.css")
    assert css_res.status_code == 200
    assert "text/css" in css_res.headers["content-type"]

    js_res = client.get("/ui/unified-ui.js")
    assert js_res.status_code == 200
    assert "javascript" in js_res.headers["content-type"]


def test_api_entry_rejects_line3():
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path = [p for p in sys.path if p != str(backend_dir)]
    sys.path.insert(0, str(repo_root))

    from api.index import _parse_line_id

    with pytest.raises(HTTPException):
        _parse_line_id("line3")


def test_api_generate_accepts_data_statistics_without_delivery_fields(monkeypatch):
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path = [p for p in sys.path if p != str(backend_dir)]
    sys.path.insert(0, str(repo_root))

    from api import index as api_index

    seen: dict[str, object] = {}

    async def fake_generate_pdf_bytes(**kwargs):  # noqa: ANN003 - 测试只关心调用载荷
        seen.update(kwargs)
        return b"%PDF-test"

    monkeypatch.setattr(api_index, "generate_pdf_bytes", fake_generate_pdf_bytes)

    client = TestClient(api_index.app)
    payload = {
        "storeName": "示例店",
        "storeAddress": "示例地址",
        "businessCategory": "快餐",
        "businessHours": "10:00-22:00",
        "exposureCount": 1000,
        "visitCount": 100,
        "orderCount": 30,
    }
    res = client.post(
        "/api/generate",
        data={"module": "data-statistics", "payload_json": json.dumps(payload)},
    )

    assert res.status_code == 200
    assert res.headers["content-type"].startswith("application/pdf")
    assert res.content == b"%PDF-test"
    assert seen["module"] == "data-statistics"
    assert "minOrderPrice" not in seen["payload"]
    assert "deliveryFee" not in seen["payload"]
    assert "deliveryRange" not in seen["payload"]
