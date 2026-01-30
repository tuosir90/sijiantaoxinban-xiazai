from PIL import Image


def test_image_processor_returns_base64_data_url(tmp_path):
    img_path = tmp_path / "a.png"
    Image.new("RGB", (2000, 1200), color=(255, 0, 0)).save(img_path)

    from app.services.image_processor import process_image_to_data_url

    data_url = process_image_to_data_url(img_path.read_bytes())
    assert data_url.startswith("data:image/jpeg;base64,")

