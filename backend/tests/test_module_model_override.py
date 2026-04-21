import pytest
from fastapi.testclient import TestClient
import asyncio


@pytest.mark.parametrize(
    ("module", "env_name", "expected_model"),
    [
        ("brand", "UPSTREAM_MODEL_BRAND", "model-brand"),
        ("market", "UPSTREAM_MODEL_MARKET", "model-market"),
        ("store-activity", "UPSTREAM_MODEL_STORE_ACTIVITY", "model-store"),
        ("data-statistics", "UPSTREAM_MODEL_DATA_STATISTICS", "model-data"),
    ],
)
def test_generate_report_uses_module_specific_model(monkeypatch, module: str, env_name: str, expected_model: str):
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key")
    monkeypatch.setenv("UPSTREAM_MODEL_DEFAULT", "model-default")
    monkeypatch.setenv(env_name, expected_model)

    seen: dict[str, str] = {}

    async def fake_chat_completions(_client, *, cfg, **_kwargs):  # noqa: ANN001 - 测试仅关心cfg
        seen["model"] = cfg.model
        return "# ok"

    import app.routes.reports_generate as reports_generate

    monkeypatch.setattr(reports_generate, "chat_completions", fake_chat_completions)

    from app.main import create_app

    client = TestClient(create_app())
    res = client.post("/api/reports/generate", data={"module": module, "payload_json": "{}"})
    assert res.status_code == 200
    assert seen["model"] == expected_model


def test_generate_report_falls_back_to_default_model(monkeypatch):
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key")
    monkeypatch.setenv("UPSTREAM_MODEL_DEFAULT", "model-default")
    monkeypatch.delenv("UPSTREAM_MODEL_BRAND", raising=False)

    seen: dict[str, str] = {}

    async def fake_chat_completions(_client, *, cfg, **_kwargs):  # noqa: ANN001 - 测试仅关心cfg
        seen["model"] = cfg.model
        return "# ok"

    import app.routes.reports_generate as reports_generate

    monkeypatch.setattr(reports_generate, "chat_completions", fake_chat_completions)

    from app.main import create_app

    client = TestClient(create_app())
    res = client.post("/api/reports/generate", data={"module": "brand", "payload_json": "{}"})
    assert res.status_code == 200
    assert seen["model"] == "model-default"


def test_generate_pdf_bytes_uses_line2_model(monkeypatch):
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key-line1")
    monkeypatch.setenv("UPSTREAM_MODEL_DEFAULT", "model-default-line1")
    monkeypatch.setenv("UPSTREAM_LINE2_API_KEY", "test-key-line2")
    monkeypatch.setenv("UPSTREAM_LINE2_MODEL_DEFAULT", "model-default-line2")
    monkeypatch.setenv("UPSTREAM_LINE2_MODEL_MARKET", "model-market-line2")

    import app.services.report_service as report_service

    seen: dict[str, str] = {}

    async def fake_chat_completions(_client, *, cfg, **_kwargs):  # noqa: ANN001 - 测试仅关心cfg
        seen["model"] = cfg.model
        return """
        {
          "cover": {
            "store_name": "测试店铺",
            "report_title": "测试报告",
            "report_subtitle": "测试副标题",
            "business_line": "快餐",
            "period_text": "2026年04月",
            "plan_date": "2026-04-16"
          },
          "sections": [
            {
              "title": "概览",
              "summary": "摘要",
              "blocks": [
                {"type": "paragraph", "text": "内容"}
              ]
            }
          ]
        }
        """

    monkeypatch.setattr(report_service, "chat_completions", fake_chat_completions)
    monkeypatch.setattr(report_service, "build_pdf_bytes", lambda report, module: b"%PDF-test")

    pdf_bytes = asyncio.run(
        report_service.generate_pdf_bytes(module="market", payload={}, line_id="line2")
    )

    assert pdf_bytes == b"%PDF-test"
    assert seen["model"] == "model-market-line2"


def test_generate_pdf_bytes_uses_line3_shared_model(monkeypatch):
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key-line1")
    monkeypatch.setenv("UPSTREAM_MODEL_DEFAULT", "model-default-shared")
    monkeypatch.setenv("UPSTREAM_MODEL_MARKET", "model-market-shared")
    monkeypatch.setenv("NEW_PICTURE_WALL_128API_BASE_URL", "https://128api.cn/v1")
    monkeypatch.setenv("NEW_PICTURE_WALL_128API_KEY", "test-key-line3")

    import app.services.report_service as report_service

    seen: dict[str, str] = {}

    async def fake_chat_completions(_client, *, cfg, **_kwargs):  # noqa: ANN001 - 测试仅关心cfg
        seen["model"] = cfg.model
        return """
        {
          "cover": {
            "store_name": "测试店铺",
            "report_title": "测试报告",
            "report_subtitle": "测试副标题",
            "business_line": "快餐",
            "period_text": "2026年04月",
            "plan_date": "2026-04-16"
          },
          "sections": [
            {
              "title": "概览",
              "summary": "摘要",
              "blocks": [
                {"type": "paragraph", "text": "内容"}
              ]
            }
          ]
        }
        """

    monkeypatch.setattr(report_service, "chat_completions", fake_chat_completions)
    monkeypatch.setattr(report_service, "build_pdf_bytes", lambda report, module: b"%PDF-test")

    pdf_bytes = asyncio.run(
        report_service.generate_pdf_bytes(module="market", payload={}, line_id="line3")
    )

    assert pdf_bytes == b"%PDF-test"
    assert seen["model"] == "model-market-shared"
