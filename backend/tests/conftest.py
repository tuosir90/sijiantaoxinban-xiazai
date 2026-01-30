"""
测试配置。

说明：将 backend 目录加入 sys.path，便于 `from app...` 导入。
"""

import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

