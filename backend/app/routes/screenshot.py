"""
本地截图工具（FSRecorder）接口。

说明：
- 仅用于本地 Windows 环境提升工作流；生产环境一般不启用该能力。
- 与旧版前端页面兼容：`/api/check-screenshot-app`、`/api/launch-screenshot`
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


def _fs_recorder_path() -> Path:
    # repo_root/FSCapture/FSRecorder.exe
    here = Path(__file__).resolve()
    repo_root = here.parents[4]
    return repo_root / "FSCapture" / "FSRecorder.exe"


@router.get("/api/check-screenshot-app")
def check_screenshot_app():
    exe = _fs_recorder_path()
    available = os.name == "nt" and exe.exists()
    return JSONResponse({"available": bool(available), "path": str(exe)})


@router.post("/api/launch-screenshot")
def launch_screenshot_app():
    exe = _fs_recorder_path()
    if os.name != "nt":
        return JSONResponse({"success": False, "error": "仅支持Windows本地环境"}, status_code=400)
    if not exe.exists():
        return JSONResponse({"success": False, "error": "未找到FSRecorder.exe", "path": str(exe)}, status_code=404)

    try:
        proc = subprocess.Popen(
            [str(exe)],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            close_fds=True,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
    except Exception as e:  # noqa: BLE001 - 返回可读错误
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

    return JSONResponse({"success": True, "pid": proc.pid})

