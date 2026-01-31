import os

from app.services.report_service import _log_diag, _trim_text


def test_trim_text_respects_limit():
    text = "a" * 2500
    trimmed = _trim_text(text, limit=2000)
    assert len(trimmed) == 2000
    assert trimmed == "a" * 2000


def test_log_diag_disabled_no_output(capsys, monkeypatch):
    monkeypatch.delenv("DIAGNOSTIC_LOGS", raising=False)
    _log_diag("测试事件", {"raw": "内容"})
    out = capsys.readouterr().out
    assert out == ""


def test_log_diag_enabled_outputs(capsys, monkeypatch):
    monkeypatch.setenv("DIAGNOSTIC_LOGS", "1")
    _log_diag("测试事件", {"raw": "内容", "module": "brand"})
    out = capsys.readouterr().out
    assert "诊断" in out
    assert "测试事件" in out
    assert "raw" in out
