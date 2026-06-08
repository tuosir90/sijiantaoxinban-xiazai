"""
后端配置管理(Configuration Management)。

说明：
- 统一从环境变量读取上游接口与密钥，避免在前端/仓库内硬编码。
"""

from dataclasses import dataclass

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


@dataclass(frozen=True)
class UpstreamLine:
    line_id: str
    label: str
    base_url: str
    api_key: str
    model_default: str
    model_brand: str = ""
    model_market: str = ""
    model_store_activity: str = ""
    model_data_statistics: str = ""

    def resolve_model(self, module: str) -> str:
        overrides = {
            "brand": self.model_brand,
            "market": self.model_market,
            "store-activity": self.model_store_activity,
            "data-statistics": self.model_data_statistics,
        }
        return (overrides.get(module, "") or "").strip() or self.model_default.strip()

    def ensure_configured(self) -> None:
        if self.base_url.strip() and self.api_key.strip() and self.model_default.strip():
            return
        raise ValueError(f"{self.label}未配置完整，请检查环境变量")


class Settings(BaseSettings):
    upstream_base_url: str = "https://jeniya.top/v1/chat/completions"
    upstream_api_key: str = ""
    upstream_model_default: str = "gemini-2.5-flash-lite"
    upstream_model_brand: str = ""
    upstream_model_market: str = ""
    upstream_model_store_activity: str = ""
    upstream_model_data_statistics: str = ""
    upstream_line2_base_url: str = ""
    upstream_line2_api_key: str = ""
    upstream_line2_model_default: str = ""
    upstream_line2_model_brand: str = ""
    upstream_line2_model_market: str = ""
    upstream_line2_model_store_activity: str = ""
    upstream_line2_model_data_statistics: str = ""
    report_ttl_seconds: int = 86400
    cors_allow_origins: str = "*"
    max_upload_mb: int = 10
    diagnostic_logs: str = "0"

    model_config = ConfigDict(
        env_prefix="",
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_upstream_line(self, line_id: str) -> UpstreamLine:
        current = (line_id or "line1").strip() or "line1"
        if current == "line2":
            return UpstreamLine(
                line_id="line2",
                label="线路2",
                base_url=self.upstream_line2_base_url,
                api_key=self.upstream_line2_api_key,
                model_default=self.upstream_line2_model_default,
                model_brand=self.upstream_line2_model_brand,
                model_market=self.upstream_line2_model_market,
                model_store_activity=self.upstream_line2_model_store_activity,
                model_data_statistics=self.upstream_line2_model_data_statistics,
            )
        if current != "line1":
            raise ValueError(f"不支持的线路: {current}")
        return UpstreamLine(
            line_id="line1",
            label="线路1",
            base_url=self.upstream_base_url,
            api_key=self.upstream_api_key,
            model_default=self.upstream_model_default,
            model_brand=self.upstream_model_brand,
            model_market=self.upstream_model_market,
            model_store_activity=self.upstream_model_store_activity,
            model_data_statistics=self.upstream_model_data_statistics,
        )


def get_settings() -> Settings:
    return Settings()
