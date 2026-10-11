"""
ActionGate AI Evaluator - Pydantic Schema Definitions
schemas.py

Principal ML Engineer Specification:
Strict runtime type validation contracts for all request/response
payloads crossing the AI Risk Analyzer API boundary.
"""

from pydantic import BaseModel, Field
from typing import Any, List
from enum import Enum


class BlastRadius(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IntentCategory(str, Enum):
    READ_ONLY = "READ_ONLY"
    MUTATION = "MUTATION"
    FINANCIAL_TRANSFER = "FINANCIAL_TRANSFER"
    PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION"
    DESTRUCTIVE = "DESTRUCTIVE"
    UNKNOWN = "UNKNOWN"


class AgentActionRequest(BaseModel):
    """
    Incoming evaluation request from the Node.js ActionGate Gateway.
    Represents a proposed AI Agent tool call to be risk-scored.
    """
    agentId: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Unique identifier of the autonomous AI Agent submitting the action"
    )
    toolName: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Name of the tool or function the agent is requesting to execute"
    )
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters and arguments to be passed to the target tool"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "agentId": "agent_finance_v1",
                "toolName": "transfer_funds",
                "payload": {
                    "amount": 8500,
                    "currency": "USD",
                    "recipient": "acct_vendor_9912"
                }
            }
        }


class RiskAnalysisResponse(BaseModel):
    """
    Structured AI risk assessment returned to the Node.js Gateway.
    Consumed by the Declarative Policy Engine to make authorization decisions.
    """
    riskScore: int = Field(
        ...,
        ge=0,
        le=100,
        description="Normalized risk score from 0 (safe) to 100 (catastrophic)"
    )
    blastRadius: BlastRadius = Field(
        ...,
        description="Estimated scope of damage if action executes unchecked"
    )
    isReversible: bool = Field(
        ...,
        description="True if the action can be undone post-execution"
    )
    intentCategory: IntentCategory = Field(
        ...,
        description="Semantic classification of the agent's intended action type"
    )
    riskFactors: List[str] = Field(
        default_factory=list,
        description="Ordered list of specific risk signals detected in this action"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "riskScore": 68,
                "blastRadius": "MEDIUM",
                "isReversible": True,
                "intentCategory": "FINANCIAL_TRANSFER",
                "riskFactors": [
                    "Financial transfer detected",
                    "External recipient unverified",
                    "Amount within autonomous limits but elevated"
                ]
            }
        }
