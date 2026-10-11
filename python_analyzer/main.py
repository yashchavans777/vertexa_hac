"""
ActionGate AI Evaluator - ASGI Application Entry Point
main.py

Principal ML Engineer Specification:
Initializes the FastAPI application, configures CORS, and registers
the modular APIRouter from routers/analyze.py.

Run with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.analyze import router

# =========================================================================
# FastAPI Application Initialization
# =========================================================================
app = FastAPI(
    title="ActionGate AI Evaluator",
    description=(
        "Enterprise-grade AI Risk Analyzer microservice for ActionGate. "
        "Provides deterministic heuristic risk scoring, blast-radius classification, "
        "and Chaos Engineering controls for failover testing. "
        "Consumed exclusively by the Node.js ActionGate Security Gateway."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "ActionGate Security Engineering",
        "url": "https://github.com/yashchavans777/vertexa_hac"
    },
    license_info={
        "name": "MIT"
    }
)

# =========================================================================
# CORS Middleware
# Allows the React SOC Dashboard, Node.js Gateway, and traffic simulator
# to communicate freely during hackathon presentation.
# =========================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================================
# Router Registration
# =========================================================================
app.include_router(router)


# =========================================================================
# Health Check Endpoint
# =========================================================================
@app.get(
    "/health",
    tags=["Health"],
    summary="Health Check"
)
async def health_check():
    return {
        "status": "ONLINE",
        "service": "ActionGate AI Risk Analyzer",
        "version": "2.0.0"
    }
