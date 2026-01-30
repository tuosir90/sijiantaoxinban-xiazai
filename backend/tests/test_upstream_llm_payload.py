def test_build_messages_with_image():
    from app.services.upstream_llm import build_messages

    msgs = build_messages(system="S", user_prompt="P", image_data_url="data:image/jpeg;base64,xxx")
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"
    assert isinstance(msgs[1]["content"], list)


def test_build_messages_text_only():
    from app.services.upstream_llm import build_messages

    msgs = build_messages(system="S", user_prompt="P", image_data_url=None)
    assert msgs[1]["content"] == "P"

