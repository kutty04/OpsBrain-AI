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
from backend.routers.telemetry import router as telemetry_router


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup — explicit origins only (wildcard + allow_credentials is rejected by browsers)
_allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Register routers
app.include_router(ingestion_router, prefix=settings.API_PREFIX)
app.include_router(rag_router, prefix=settings.API_PREFIX)
app.include_router(pid_router, prefix=settings.API_PREFIX)
app.include_router(graph_router, prefix=settings.API_PREFIX)
app.include_router(agent_router, prefix=settings.API_PREFIX)
app.include_router(multi_agent_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(telemetry_router, prefix=settings.API_PREFIX)


# Demo seed router — only mounted when ENABLE_DEMO_SEED=true in .env
# This prevents accidental full DB wipe in production deployments.
# The import is also deferred so the embedding model is NOT loaded in production.
if settings.ENABLE_DEMO_SEED:
    from backend.routers.demo import router as demo_router  # noqa: E402
    app.include_router(demo_router, prefix=settings.API_PREFIX)
    logger.info("[DEMO] Demo seed router mounted. ENABLE_DEMO_SEED=true.")
else:
    logger.info("[DEMO] Demo seed router DISABLED. Set ENABLE_DEMO_SEED=true to enable.")

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
            "version": "1.0.0",
            "providers": {
                "groq": bool(settings.GROQ_API_KEY),
                "gemini": bool(settings.GEMINI_API_KEY),
                "mistral": bool(settings.MISTRAL_API_KEY)
            }
        }
    }

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
    
    # Verify/create lessons_learned_history table
    from backend.database import get_db_connection, release_db_connection
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS lessons_learned_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tag_number VARCHAR(50) NOT NULL,
                query TEXT NOT NULL,
                lessons_extracted TEXT[] NOT NULL,
                preventive_actions TEXT[] NOT NULL,
                safety_recommendations TEXT[] NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        """)
        conn.commit()
        cur.close()
        logger.info("Table 'lessons_learned_history' verified/created successfully.")
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to verify/create lessons_learned_history table: {e}")
    finally:
        if conn:
            release_db_connection(conn)

