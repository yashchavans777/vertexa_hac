"""
ActionGate AI Evaluator - Deterministic Heuristic Risk Engine
services.py

Principal ML Engineer Specification:
Implements a keyword-driven, rule-layered risk scoring algorithm
that deterministically classifies AI Agent tool calls by:
  - Action semantic category (read, mutate, destroy)
  - Payload content signals (amount, recipients, cascade flags)
  - Blast radius and reversibility scoring
"""

import re
from schemas import (
    AgentActionRequest,
    RiskAnalysisResponse,
    BlastRadius,
    IntentCategory
)


def _contains_any(text: str, keywords: list[str]) -> bool:
    """Case-insensitive substring match for heuristic keyword detection."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in keywords)


def evaluate_action_risk(request: AgentActionRequest) -> RiskAnalysisResponse:
    """
    Deterministic Heuristic Risk Evaluator.

    Scoring tiers are ordered by blast-radius severity (fail-closed):
    - TIER 1: Destructive / Irreversible (riskScore 90-99, CRITICAL)
    - TIER 2: Financial Transfers (riskScore 60-85, HIGH)
    - TIER 3: Privilege Escalation / Credential Issuance (riskScore 65-80, HIGH)
    - TIER 4: State Mutation / Config Modification (riskScore 40-70, MEDIUM)
    - TIER 5: Read-Only / Observation (riskScore 5-20, LOW)
    - TIER 6: Unrecognized Tool (riskScore 50, MEDIUM, conservative baseline)

    Args:
        request: Validated AgentActionRequest from gateway

    Returns:
        RiskAnalysisResponse with scored risk assessment
    """
    tool = request.toolName.lower()
    payload = request.payload or {}
    risk_factors: list[str] = []

    # =========================================================================
    # TIER 1: Destructive / Irreversible Operations
    # Highest priority evaluation — override everything else
    # =========================================================================
    DESTRUCTIVE_KEYWORDS = ["drop", "delete", "bulk", "purge", "wipe", "truncate", "destroy", "force_remove"]
    if _contains_any(tool, DESTRUCTIVE_KEYWORDS):
        risk_factors.append(f"Destructive tool classification matched: '{request.toolName}'")
        risk_factors.append("Action is irreversible. Data loss blast radius is CRITICAL.")

        # Extra signals from payload
        if payload.get("cascade") or payload.get("force"):
            risk_factors.append("Cascade/force flags set — collateral damage scope amplified.")
        if payload.get("hard_delete"):
            risk_factors.append("Hard delete flag detected — no soft-delete safety net.")

        return RiskAnalysisResponse(
            riskScore=97,
            blastRadius=BlastRadius.CRITICAL,
            isReversible=False,
            intentCategory=IntentCategory.DESTRUCTIVE,
            riskFactors=risk_factors
        )

    # =========================================================================
    # TIER 2: Financial Transfer Operations
    # =========================================================================
    FINANCIAL_KEYWORDS = ["transfer", "payment", "wire", "payout", "refund", "debit", "charge"]
    if _contains_any(tool, FINANCIAL_KEYWORDS):
        risk_factors.append(f"Financial mutation tool detected: '{request.toolName}'")

        amount = float(payload.get("amount", 0) or 0)
        currency = str(payload.get("currency", "USD")).upper()
        recipient = str(payload.get("recipient") or payload.get("recipient_account") or "")

        if amount > 50000:
            risk_score = 92
            risk_factors.append(f"Extreme financial amount (${amount:,.2f}) — far exceeds autonomous threshold.")
        elif amount > 10000:
            risk_score = 82
            risk_factors.append(f"High financial amount (${amount:,.2f}) — exceeds safety ceiling of $10,000.")
        elif amount > 5000:
            risk_score = 68
            risk_factors.append(f"Elevated transfer amount (${amount:,.2f}) — approaching autonomous limit.")
        else:
            risk_score = 55
            risk_factors.append(f"Transfer amount (${amount:,.2f}) is within safe autonomous range.")

        if currency not in ["USD", "EUR", "GBP"]:
            risk_score = min(99, risk_score + 8)
            risk_factors.append(f"Unrecognized transfer currency '{currency}' — elevated jurisdictional risk.")

        if not recipient:
            risk_score = min(99, risk_score + 10)
            risk_factors.append("Recipient account unspecified — unverifiable destination.")

        return RiskAnalysisResponse(
            riskScore=risk_score,
            blastRadius=BlastRadius.HIGH if risk_score >= 70 else BlastRadius.MEDIUM,
            isReversible=risk_score < 80,
            intentCategory=IntentCategory.FINANCIAL_TRANSFER,
            riskFactors=risk_factors
        )

    # =========================================================================
    # TIER 3: Privilege Escalation / Credential Operations
    # =========================================================================
    PRIVILEGE_KEYWORDS = ["escalate", "privilege", "token", "credential", "role", "admin", "permission", "grant", "revoke"]
    if _contains_any(tool, PRIVILEGE_KEYWORDS):
        risk_factors.append(f"Privilege/credential tool detected: '{request.toolName}'")

        elevated_role = str(payload.get("elevated_role") or payload.get("new_role") or "").upper()
        scopes = payload.get("scopes", [])

        if elevated_role in ["SUPER_ADMIN", "SECURITY_OFFICER", "ROOT"]:
            risk_factors.append(f"Forbidden privileged role escalation target: '{elevated_role}'")
            return RiskAnalysisResponse(
                riskScore=95,
                blastRadius=BlastRadius.CRITICAL,
                isReversible=False,
                intentCategory=IntentCategory.PRIVILEGE_ESCALATION,
                riskFactors=risk_factors
            )

        if isinstance(scopes, list) and any("write" in s.lower() or "admin" in s.lower() for s in scopes):
            risk_factors.append(f"Write/admin-scoped credential issuance detected in requested scopes.")
            risk_score = 78
        else:
            risk_score = 65

        risk_factors.append("Privilege modification requires human dual-control verification.")

        return RiskAnalysisResponse(
            riskScore=risk_score,
            blastRadius=BlastRadius.HIGH,
            isReversible=False,
            intentCategory=IntentCategory.PRIVILEGE_ESCALATION,
            riskFactors=risk_factors
        )

    # =========================================================================
    # TIER 4: State Mutation / Data Modification / Config Operations
    # =========================================================================
    MUTATION_KEYWORDS = ["update", "modify", "patch", "create", "send", "write", "restart", "set", "change", "push"]
    if _contains_any(tool, MUTATION_KEYWORDS):
        risk_factors.append(f"State-modifying tool classified: '{request.toolName}'")

        recipients = payload.get("recipients", [])
        if isinstance(recipients, list) and len(recipients) > 10:
            risk_factors.append(f"Mass communication target: {len(recipients)} recipients exceeds safety ceiling.")
            risk_score = 72
        elif payload.get("restart_workloads") or payload.get("force"):
            risk_factors.append("Forced restart/rollout detected — potential service disruption window.")
            risk_score = 65
        else:
            risk_score = 50

        risk_factors.append("Human authorization required prior to mutation execution.")

        return RiskAnalysisResponse(
            riskScore=risk_score,
            blastRadius=BlastRadius.MEDIUM,
            isReversible=True,
            intentCategory=IntentCategory.MUTATION,
            riskFactors=risk_factors
        )

    # =========================================================================
    # TIER 5: Read-Only / Observability Operations
    # =========================================================================
    READ_KEYWORDS = ["read", "fetch", "get", "list", "search", "query", "show", "describe", "inspect", "monitor"]
    if _contains_any(tool, READ_KEYWORDS):
        risk_factors.append(f"Read-only observability tool verified: '{request.toolName}'")

        payload_bytes = len(str(payload).encode("utf-8"))
        if payload_bytes > 4096:
            risk_factors.append(f"Read payload size ({payload_bytes} bytes) exceeds 4KB safety limit.")
            return RiskAnalysisResponse(
                riskScore=72,
                blastRadius=BlastRadius.HIGH,
                isReversible=True,
                intentCategory=IntentCategory.READ_ONLY,
                riskFactors=risk_factors
            )

        return RiskAnalysisResponse(
            riskScore=12,
            blastRadius=BlastRadius.LOW,
            isReversible=True,
            intentCategory=IntentCategory.READ_ONLY,
            riskFactors=["Non-mutating read operation within safe parameter boundaries."]
        )

    # =========================================================================
    # TIER 6: Unknown / Unclassified Tool (Conservative Baseline)
    # =========================================================================
    risk_factors.append(f"Unrecognized tool name '{request.toolName}' — conservative 50/100 baseline applied.")
    risk_factors.append("Policy engine will apply REQUIRE_APPROVAL due to classification uncertainty.")

    return RiskAnalysisResponse(
        riskScore=50,
        blastRadius=BlastRadius.MEDIUM,
        isReversible=False,
        intentCategory=IntentCategory.UNKNOWN,
        riskFactors=risk_factors
    )
