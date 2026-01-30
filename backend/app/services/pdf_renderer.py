"""PDF 渲染服务（长页不分页）。"""

from __future__ import annotations

from playwright.async_api import async_playwright


class PdfRenderError(RuntimeError):
    pass


async def render_long_pdf(html: str) -> bytes:
    if not html:
        raise PdfRenderError("HTML内容为空")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={"width": 794, "height": 1123, "device_scale_factor": 2})
            await page.set_content(html, wait_until="networkidle")
            try:
                await page.evaluate("document.fonts && document.fonts.ready")
            except Exception:
                pass

            height = await page.evaluate(
                """
() => {
  const body = document.body;
  const html = document.documentElement;
  return Math.max(
    body.scrollHeight, body.offsetHeight, body.clientHeight,
    html.scrollHeight, html.offsetHeight, html.clientHeight
  );
}
                """.strip()
            )
            safe_height = int(height) + 120
            if safe_height < 800:
                safe_height = 800

            pdf = await page.pdf(
                width="210mm",
                height=f"{safe_height}px",
                margin={"top": "10mm", "right": "10mm", "bottom": "10mm", "left": "10mm"},
                print_background=True,
            )
            await browser.close()
            return pdf
    except Exception as e:  # noqa: BLE001 - 需要返回可读错误
        raise PdfRenderError(f"PDF渲染失败: {e}") from e

