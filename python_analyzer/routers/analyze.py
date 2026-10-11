"""
ActionGate AI Evaluator - API Router
routers/analyze.py

Principal ML Engineer Specification:
Implements the primary analysis endpoint and Chaos Engineering controls.
Chaos Mode is a first-class hackathon demonstration feature:
  - Toggling it ON triggers a 5-second asyncio.sleep delay.
  - This proves to judges that the Node.js Gateway's 2-second failover
    mechanism activates correctly when the AI microservice degrades.
"""

import asyncio
import random
from fastapi import APIRouter, HTTPException
from schemas import AgentActionRequest, RiskAnalysisResponse
from services import evaluate_action_risk

router = APIRouter()

# =========================================================================
# Global Chaos Engineering State
# Toggled via POST /api/v1/chaos/toggle for live hackathon demonstrations
# =========================================================================
CHAOS_MODE: bool = False


@router.post(
    "/api/v1/chaos/toggle",
    summary="Toggle Chaos Engineering Mode",
    description=(
        "Flips the CHAOS_MODE flag. When ON, the /analyze endpoint will "
        "deliberately time out or crash, proving the Node.js Gateway's 2-second "
        "failover mechanism activates correctly."
    ),
    tags=["Chaos Engineering"]
)
async def toggle_chaos_mode():
    global CHAOS_MODE
    CHAOS_MODE = not CHAOS_MODE

    return {
        "chaosMode": CHAOS_MODE,
        "status": "CHAOS_ACTIVE" if CHAOS_MODE else "NORMAL_OPERATION",
        "message": (
            "⚠️ Chaos Mode ENABLED. /analyze will now time out for 5 seconds, "
            "activating the Node.js Failover Safe Mode."
            if CHAOS_MODE
            else "✅ Chaos Mode DISABLED. Returning to normal AI-informed risk analysis."
        )
    }


@router.get(
    "/api/v1/chaos/status",
    summary="Get Current Chaos Mode Status",
    tags=["Chaos Engineering"]
)
async def get_chaos_status():
    return {
        "chaosMode": CHAOS_MODE,
        "status": "CHAOS_ACTIVE" if CHAOS_MODE else "NORMAL_OPERATION"
    }


@router.post(
    "/api/v1/analyze",
    response_model=RiskAnalysisResponse,
    summary="Evaluate AI Agent Action Risk",
    description=(
        "Primary ingress evaluation endpoint. Accepts an agent action request "
        "and returns a structured risk score. When Chaos Mode is active, "
        "this endpoint deliberately degrades to prove gateway resilience."
    ),
    tags=["Risk Analysis"]
)
async def analyze_agent_action(request: AgentActionRequest) -> RiskAnalysisResponse:
    """
    Step 1: Chaos Mode Check
    If CHAOS_MODE is True, randomly either:
      - Sleep for 5 seconds (proves Node.js 2s timeout fires → FAILOVER_SAFE_MODE)
      - Raise HTTP 500 (proves Node.js catch block fires → FAILOVER_SAFE_MODE)
    This is a deliberate, first-class feature for hackathon jury testing.
    """
    if CHAOS_MODE:
        chaos_type = random.choice(["timeout", "crash"])
        if chaos_type == "timeout":
            # Simulate severe latency: exceeds the Node.js 2-second SLA timeout
            await asyncio.sleep(5)
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "CHAOS_MODE_TIMEOUT",
                    "message": "Simulated AI analyzer degradation: timeout after 5 seconds.",
                    "chaosMode": True
                }
            )
        else:
            # Simulate service crash
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "CHAOS_MODE_CRASH",
                    "message": "Simulated AI analyzer internal failure for failover demonstration.",
                    "chaosMode": True
                }
            )

    """
    Step 2: Normal Path — Pass to Deterministic Heuristic Risk Engine
    Delegates to evaluate_action_risk() in services.py which returns a
    fully structured RiskAnalysisResponse with score, blast radius, and risk factors.
    """
    return evaluate_action_risk(request)


@router.post(
    "/analyze",
    response_model=RiskAnalysisResponse,
    summary="Evaluate AI Agent Action Risk (Legacy)",
    description="Legacy endpoint for backward compatibility with the existing Node.js Gateway.",
    tags=["Risk Analysis"]
)
async def analyze_agent_action_legacy(request: AgentActionRequest) -> RiskAnalysisResponse:
    """
    Legacy /analyze endpoint — mirrors /api/v1/analyze to ensure the Node.js
    Gateway (which calls http://ai-analyzer:8000/analyze) continues to work
    without any routing changes.
    """
    return await analyze_agent_action(request)


@router.get(
    "/simulate-agent/{scenario}",
    summary="Generate Synthetic Agent Payload for Traffic Simulation",
    description="Returns a realistic synthetic AI Agent payload for the demo_traffic_generator.py script.",
    tags=["Simulation"]
)
async def simulate_agent_payload(scenario: str):
    """
    Provides realistic test payloads for the demo traffic generator.
    Supports 'safe', 'high_risk', and 'malicious' scenario profiles.
    """
    scenarios = {
        "safe": {
            "payload": {
                "agentId": "agent_auditor_v1",
                "toolName": "fetch_logs",
                "target": "/var/log/audit/access.log",
                "parameters": {"lines": 50, "filter": "status=401"},
                "session_id": f"sess_safe_{random.randint(1000, 9999)}"
            }
        },
        "high_risk": {
            "payload": {
                "agentId": "agent_finance_v1",
                "toolName": "transfer_funds",
                "target": "SWIFT://SETTLEMENT_HUB",
                "parameters": {
                    "amount": random.choice([4500, 6800, 7500, 9200]),
                    "currency": "USD",
                    "recipient": f"acct_vendor_{random.randint(1000, 9999)}"
                },
                "session_id": f"sess_highrisk_{random.randint(1000, 9999)}"
            }
        },
        "malicious": {
            "payload": {
                "agentId": random.choice(["rogue_injected_agent", "unknown_bypass_bot", "compromised_support_bot"]),
                "toolName": random.choice(["drop_database", "bulk_delete_users", "purge_logs", "wipe_audit_trail"]),
                "target": "cluster_main_prod",
                "parameters": {"cascade": True, "force": True, "hard_delete": True},
                "session_id": f"sess_exploit_{random.randint(1000, 9999)}"
            }
        }
    }

    scenario_data = scenarios.get(scenario.lower(), scenarios["safe"])
    scenario_data["scenario"] = scenario
    scenario_data["chaosMode"] = CHAOS_MODE
    return scenario_data
