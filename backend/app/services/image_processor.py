"""
截图处理：

将上传图片缩放/压缩为 JPEG，并返回 dataURL（供上游多模态与模板渲染使用）。
"""

from __future__ import annotations

import base64
from io import BytesIO

from PIL import Image


def process_image_to_data_url(
    image_bytes: bytes,
    *,
    max_width: int = 1280,
    max_size_bytes: int = 800_000,
) -> str:
    if not image_bytes:
        raise ValueError("图片内容为空")

    with Image.open(BytesIO(image_bytes)) as img:
        img = img.convert("RGB")

        if img.width > max_width:
            ratio = max_width / img.width
            target = (max_width, max(1, int(img.height * ratio)))
            img = img.resize(target, Image.Resampling.LANCZOS)

        quality = 85
        while True:
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=quality, optimize=True)
            data = buf.getvalue()

            if len(data) <= max_size_bytes or quality <= 60:
                b64 = base64.b64encode(data).decode("ascii")
                return f"data:image/jpeg;base64,{b64}"

            quality -= 5

