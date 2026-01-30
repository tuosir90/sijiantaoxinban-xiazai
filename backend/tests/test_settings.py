def test_settings_reads_env(monkeypatch):
    monkeypatch.setenv("UPSTREAM_BASE_URL", "https://jeniya.top/v1/chat/completions")
    monkeypatch.setenv("UPSTREAM_API_KEY", "test-key")

    from app.settings import Settings

    s = Settings()
    assert s.upstream_base_url == "https://jeniya.top/v1/chat/completions"
    assert s.upstream_api_key == "test-key"

