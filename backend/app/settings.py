"""
后端配置管理(Configuration Management)。

说明：
- 统一从环境变量读取上游接口与密钥，避免在前端/仓库内硬编码。
"""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    upstream_base_url: str = "https://jeniya.top/v1/chat/completions"
    upstream_api_key: str = ""
    upstream_model_default: str = "gemini-2.5-flash-lite"
    upstream_model_brand: str = ""
    upstream_model_market: str = ""
    upstream_model_store_activity: str = ""
    upstream_model_data_statistics: str = ""

    report_ttl_seconds: int = 86400
    cors_allow_origins: str = "*"
    max_upload_mb: int = 10

    model_config = ConfigDict(
        env_prefix="",
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
    )


def get_settings() -> Settings:
    return Settings()
