import pytest
from fastapi.testclient import TestClient


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

