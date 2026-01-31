from pathlib import Path
import sys


def test_api_entry_importable():
    repo_root = Path(__file__).resolve().parents[2]
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path = [p for p in sys.path if p != str(backend_dir)]
    sys.path.insert(0, str(repo_root))
    __import__("api.index")
