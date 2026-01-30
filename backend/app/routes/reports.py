"""报告相关接口聚合。"""

from fastapi import APIRouter

from app.routes.reports_generate import router as generate_router
from app.routes.reports_render import router as render_router

router = APIRouter()
router.include_router(generate_router)
router.include_router(render_router)
