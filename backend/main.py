from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings, logger
from backend.models import APIResponse, OpsBrainException
from backend.routers.ingestion import router as ingestion_router
from backend.routers.rag import router as rag_router
from backend.routers.pid import router as pid_router
from backend.routers.graph import router as graph_router
from backend.routers.agent import router as agent_router
from backend.routers.multi_agent import router as multi_agent_router
from backend.routers.dashboard import router as dashboard_router
from backend.routers.demo import router as demo_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ingestion_router, prefix=settings.API_PREFIX)
app.include_router(rag_router, prefix=settings.API_PREFIX)
app.include_router(pid_router, prefix=settings.API_PREFIX)
app.include_router(graph_router, prefix=settings.API_PREFIX)
app.include_router(agent_router, prefix=settings.API_PREFIX)
app.include_router(multi_agent_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(demo_router, prefix=settings.API_PREFIX)

# Custom Exception Handler
@app.exception_handler(OpsBrainException)
async def opsbrain_exception_handler(request: Request, exc: OpsBrainException):
    logger.error(f"OpsBrainException on {request.url.path}: {exc.message} (Code: {exc.code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.code,
            "message": exc.message,
            "data": {"detail": exc.detail} if exc.detail else None
        }
    )

# General Exception Handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred on the server.",
            "data": {"detail": str(exc)}
        }
    )

# Root health endpoint
@app.get(f"{settings.API_PREFIX}/health")
async def health_check():
    logger.debug("Health check requested")
    return {
        "success": True,
        "message": "OpsBrain AI Backend is running.",
        "data": {
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "version": "1.0.0"
        }
    }

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
