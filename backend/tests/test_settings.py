def test_settings_reads_env(monkeypatch):
    monkeypatch.setenv("UPSTREAM_BASE_URL", "https://jeniya.top/v1/chat/completions")
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key")

    from app.settings import Settings

    s = Settings()
    assert s.upstream_base_url == "https://jeniya.top/v1/chat/completions"
    assert s.upstream_api_key == "test-key"


def test_settings_reads_line2_env(monkeypatch):
    monkeypatch.setenv("UPSTREAM_LINE2_BASE_URL", "https://api.vectorengine.ai/v1/chat/completions")
    monkeypatch.setenv("UPSTREAM_LINE2_API_KEY", "test-key-line2")
    monkeypatch.setenv("UPSTREAM_LINE2_MODEL_DEFAULT", "gemini-3-flash-preview")

    from app.settings import Settings

    s = Settings()
    line2 = s.get_upstream_line("line2")
    assert line2.line_id == "line2"
    assert line2.base_url == "https://api.vectorengine.ai/v1/chat/completions"
    assert line2.api_key == "test-key-line2"
    assert line2.model_default == "gemini-3-flash-preview"


def test_settings_reads_line3_env_with_shared_model(monkeypatch):
    monkeypatch.setenv("UPSTREAM_MODEL_DEFAULT", "gemini-3-flash-preview")
    monkeypatch.setenv("NEW_PICTURE_WALL_128API_BASE_URL", "https://128api.cn/v1")
    monkeypatch.setenv("NEW_PICTURE_WALL_128API_KEY", "test-key-line3")

    from app.settings import Settings

    s = Settings()
    line3 = s.get_upstream_line("line3")
    assert line3.line_id == "line3"
    assert line3.base_url == "https://128api.cn/v1"
    assert line3.api_key == "test-key-line3"
    assert line3.model_default == "gemini-3-flash-preview"
