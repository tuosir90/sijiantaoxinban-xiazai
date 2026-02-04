"""FastAPI 应用入口。"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.routes.healthz import router as healthz_router
from app.routes.reports import router as reports_router
from app.routes.screenshot import router as screenshot_router
from app.services.report_store import InMemoryReportStore
from app.services.template_renderer import ReportTemplateRenderer
from app.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="外卖店铺四件套 FastAPI 后端")
    app.state.settings = settings
    app.state.report_store = InMemoryReportStore(
        ttl_seconds=settings.report_ttl_seconds
    )

    base_dir = Path(__file__).resolve().parents[1]
    templates_dir = Path(__file__).resolve().parent / "templates"
    fonts_dir = base_dir / "assets" / "fonts"
    app.state.template_renderer = ReportTemplateRenderer(
        templates_dir=templates_dir, fonts_dir=fonts_dir
    )

    allow_origins = [
        o.strip() for o in (settings.cors_allow_origins or "*").split(",") if o.strip()
    ] or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    app.include_router(healthz_router)
    app.include_router(reports_router)
    app.include_router(screenshot_router)

    ui_dir = base_dir / "templates"
    if ui_dir.exists():
        app.mount("/ui", StaticFiles(directory=str(ui_dir), html=True), name="ui")

        @app.get("/")
        def _root_redirect():
            return RedirectResponse(url="/ui/unified-ui.html")

    return app
