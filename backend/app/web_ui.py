"""简易 Web UI 渲染。"""


def render_index_html() -> str:
    return (
        "<!DOCTYPE html>"
        "<html lang=\"zh-CN\">"
        "<head><meta charset=\"UTF-8\"><title>PDF生成</title></head>"
        "<body>"
        "<form method=\"post\" action=\"/api/generate\" enctype=\"multipart/form-data\">"
        "<label>模块："
        "<select name=\"module\">"
        "<option value=\"brand\">品牌定位</option>"
        "<option value=\"market\">商圈调研</option>"
        "<option value=\"store-activity\">店铺活动</option>"
        "<option value=\"data-statistics\">数据统计</option>"
        "</select>"
        "</label>"
        "<div>payload_json：</div>"
        "<textarea name=\"payload_json\" rows=\"10\" cols=\"60\">"
        "{\"store_name\":\"示例店\",\"business_line\":\"主营：快餐简餐\",\"period_text\":\"活动周期：2026年01月01日 - 2026年01月31日\",\"plan_date\":\"策划日期：2026年01月\"}"
        "</textarea>"
        "<div>截图（可选，仅商圈调研使用）：</div>"
        "<input type=\"file\" name=\"screenshot\" />"
        "<button type=\"submit\">生成</button>"
        "</form>"
        "</body></html>"
    )
