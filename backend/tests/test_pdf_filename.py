import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.index import build_pdf_filename


def test_build_pdf_filename_brand():
    payload = {"storeName": "吴家牛羊肉馆"}
    assert build_pdf_filename("brand", payload) == "吴家牛羊肉馆_品牌定位分析.pdf"
