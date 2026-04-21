from pathlib import Path
import sys

from fastapi.testclient import TestClient


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


def test_api_entry_accepts_line3():
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path = [p for p in sys.path if p != str(backend_dir)]
    sys.path.insert(0, str(repo_root))

    from api.index import _parse_line_id

    assert _parse_line_id("line3") == "line3"
