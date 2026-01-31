import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.index import build_debug_headers


def test_build_debug_headers_has_version_and_flag():
    headers = build_debug_headers()
    assert headers["X-Debug-Version"]
    assert headers["X-Debug-Logs"] in {"0", "1"}
