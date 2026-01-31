import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.index import build_content_disposition


def test_content_disposition_uses_ascii_fallback():
    header = build_content_disposition("吴家牛羊肉馆_品牌定位分析.pdf")
    assert "filename*=" in header
    ascii_part = header.split('filename="')[1].split('"')[0]
    assert ascii_part
    assert all(ord(ch) < 128 for ch in ascii_part)
