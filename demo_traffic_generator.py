#!/usr/bin/env python3
"""
ActionGate - Autonomous AI Agent Traffic Generator
demo_traffic_generator.py

Principal Security/QA Engineer Specification:
Simulates live, autonomous AI agent tool calls under varying operational postures:
- Safe Operations (40%): Read-only log queries, status checks, safe payloads.
- High-Risk Operations (40%): State mutations, fund transfers, requiring approval.
- Malicious Operations (20%): Destructive commands, unauthorized identities, SQL injection.

Orchestration Pipeline:
1. Fetches synthetic threat/agent payloads from FastAPI Risk Analyzer (Port 8000).
2. Forwards payload to Node.js ActionGate Gateway Ingress (Port 5000).
3. Renders formatted, color-coded SOC telemetry logs for live hackathon presentation.
4. Provides continuous fail-safe loops with graceful exception recovery.
"""

import sys
import time
import random
from datetime import datetime
import requests
from colorama import init, Fore, Back, Style

# Initialize colorama for cross-platform ANSI color rendering (Windows/Linux/macOS)
init(autoreset=True)

# ==============================================================================
# CONFIGURATION CONSTANTS
# ==============================================================================
FASTAPI_SIMULATOR_BASE_URL = "http://localhost:8000/simulate-agent"
ACTIONGATE_GATEWAY_URL = "http://localhost:5000/api/gateway/evaluate"

# Request interval boundaries (seconds)
MIN_DELAY_SECONDS = 3.0
MAX_DELAY_SECONDS = 5.0

# HTTP timeouts (seconds)
SIMULATOR_TIMEOUT = 3.0
GATEWAY_TIMEOUT = 5.0

# Scenario distribution weights: Safe (40%), High-Risk (40%), Malicious (20%)
SCENARIOS = ['safe', 'high_risk', 'malicious']
SCENARIO_WEIGHTS = [0.40, 0.40, 0.20]

# Local fallback templates used if the FastAPI simulator endpoint is momentarily offline
LOCAL_FALLBACK_PAYLOADS = {
    'safe': {
        "agent_id": "agent_auditor_v1",
        "tool_name": "fetch_logs",
        "target": "/var/log/app/production.log",
        "parameters": {"lines": 50, "filter": "status=200"},
        "session_id": "sess_safe_fallback"
    },
    'high_risk': {
        "agent_id": "agent_finance_v1",
        "tool_name": "transfer_funds",
        "target": "wire_transfer_endpoint",
        "parameters": {"amount": 7500, "currency": "USD", "recipient": "acct_corp_9941"},
        "session_id": "sess_highrisk_fallback"
    },
    'malicious': {
        "agent_id": "rogue_injected_agent",
        "tool_name": "drop_database",
        "target": "cluster_main_prod",
        "parameters": {"cascade": True, "force": True},
        "session_id": "sess_exploit_fallback"
    }
}

# ==============================================================================
# TERMINAL FORMATTING HELPERS
# ==============================================================================
def print_banner():
    """Prints the startup ASCII security banner."""
    print(Fore.CYAN + Style.BRIGHT + "=" * 80)
    print(Fore.CYAN + Style.BRIGHT + "  🛡️  ACTIONGATE - AUTONOMOUS AGENT LIVE TRAFFIC GENERATOR")
    print(Fore.WHITE + "  Simulating Active AI Agents | Node.js Gateway :5000 | FastAPI Analyzer :8000")
    print(Fore.CYAN + Style.BRIGHT + "=" * 80 + "\n")

def get_timestamp() -> str:
    """Returns a high-precision human-readable UTC timestamp."""
    return datetime.utcnow().strftime("%H:%M:%S.%f")[:-3]

def format_decision_badge(decision: str) -> str:
    """Returns color-coded badges matching ActionGate's SOC visual standard."""
    dec_upper = str(decision).upper()
    if dec_upper == "ALLOWED":
        return f"{Back.GREEN}{Fore.BLACK}{Style.BRIGHT} ALLOWED {Style.RESET_ALL}"
    elif dec_upper in ("HELD_FOR_APPROVAL", "HELD"):
        return f"{Back.YELLOW}{Fore.BLACK}{Style.BRIGHT} HELD FOR APPROVAL {Style.RESET_ALL}"
    elif dec_upper == "BLOCKED":
        return f"{Back.RED}{Fore.WHITE}{Style.BRIGHT} BLOCKED {Style.RESET_ALL}"
    return f"{Back.WHITE}{Fore.BLACK}{Style.BRIGHT} {dec_upper} {Style.RESET_ALL}"

def get_scenario_style(scenario: str):
    """Returns color styling mapped to scenario criticality."""
    if scenario == 'safe':
        return Fore.GREEN, "🟢 SAFE"
    elif scenario == 'high_risk':
        return Fore.YELLOW, "🟡 HIGH_RISK"
    else:
        return Fore.RED, "🔴 MALICIOUS"

# ==============================================================================
# NETWORK & SIMULATION PIPELINE
# ==============================================================================
def fetch_simulated_payload(scenario: str) -> dict:
    """
    Step A: Query FastAPI endpoint for realistic scenario payload.
    Falls back to deterministic local templates if FastAPI is restarting.
    """
    url = f"{FASTAPI_SIMULATOR_BASE_URL}/{scenario}"
    try:
        response = requests.get(url, timeout=SIMULATOR_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            # Accommodate payloads nested under 'payload' or returned at root
            return data.get('payload', data)
    except requests.exceptions.RequestException:
        pass  # Graceful fallback handled below

    # Fallback to local test vectors
    return LOCAL_FALLBACK_PAYLOADS.get(scenario, LOCAL_FALLBACK_PAYLOADS['safe'])

def dispatch_to_gateway(payload: dict) -> tuple:
    """
    Step B: Forward agent payload to Node.js Gateway.
    Returns: (status_code, response_data, error_message)
    """
    try:
        response = requests.post(
            ACTIONGATE_GATEWAY_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=GATEWAY_TIMEOUT
        )
        try:
            res_json = response.json()
        except ValueError:
            res_json = {"raw_text": response.text}
        return response.status_code, res_json, None
    except requests.exceptions.ConnectionError:
        return None, None, f"Connection refused to {ACTIONGATE_GATEWAY_URL}. Is Node.js running on :5000?"
    except requests.exceptions.Timeout:
        return None, None, f"Request timed out contacting ActionGate Gateway (> {GATEWAY_TIMEOUT}s)."
    except requests.exceptions.RequestException as ex:
        return None, None, f"Network error: {str(ex)}"

# ==============================================================================
# MAIN SIMULATION LOOP
# ==============================================================================
def run_generator():
    """Main execution loop simulating continuous AI Agent traffic."""
    print_banner()
    iteration = 1

    try:
        while True:
            # 1. Select random scenario based on weighted distribution
            scenario = random.choices(SCENARIOS, weights=SCENARIO_WEIGHTS, k=1)[0]
            color, scenario_label = get_scenario_style(scenario)

            # 2. Step A: Retrieve AI Agent Payload
            payload = fetch_simulated_payload(scenario)
            agent_id = payload.get('agent_id', 'unknown_agent')
            tool_name = payload.get('tool_name', 'unknown_tool')
            target = payload.get('target', 'N/A')

            # 3. Print Dispatch Telemetry
            print(
                f"{Fore.CYAN}[{get_timestamp()}] "
                f"{Fore.WHITE}#{iteration:04d} "
                f"{color}{Style.BRIGHT}[SIMULATOR] Fired {scenario_label} action: "
                f"{Fore.MAGENTA}{Style.BRIGHT}{tool_name} "
                f"{Fore.WHITE}(Agent: {agent_id})"
            )

            # 4. Step B: Dispatch to ActionGate Gateway
            status_code, gateway_response, err = dispatch_to_gateway(payload)

            # 5. Format & Display Gateway Decision
            if err:
                print(f"    {Fore.RED}⚠️  GATEWAY ERROR: {err}")
                print(f"    {Fore.LIGHTBLACK_EX}→ ActionGate may be restarting. Retrying next cycle...\n")
            else:
                decision = gateway_response.get('decision', 'UNKNOWN')
                rule_triggered = gateway_response.get('rule_triggered', 'N/A')
                decision_path = gateway_response.get('decision_path', 'N/A')
                risk_score = gateway_response.get('ai_risk_score')
                reason = gateway_response.get('reason', 'No explanation provided.')

                score_str = f"{risk_score:.2f}" if isinstance(risk_score, (int, float)) else "N/A"
                badge = format_decision_badge(decision)

                print(
                    f"    {Fore.LIGHTBLACK_EX}├─ Outcome: {badge} "
                    f"{Fore.WHITE}[HTTP {status_code}] "
                    f"{Fore.LIGHTCYAN_EX}Path: {decision_path} "
                    f"{Fore.LIGHTYELLOW_EX}AI Risk Score: {score_str}"
                )
                print(f"    {Fore.LIGHTBLACK_EX}├─ Rule:    {Fore.LIGHTWHITE_EX}{rule_triggered}")
                print(f"    {Fore.LIGHTBLACK_EX}└─ Reason:  {Fore.LIGHTBLACK_EX}{reason}\n")

            iteration += 1

            # Configurable pause between AI Agent invocations
            sleep_time = random.uniform(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
            time.sleep(sleep_time)

    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}🛑 Traffic generator stopped by operator. Exiting cleanly.")
        sys.exit(0)

if __name__ == '__main__':
    run_generator()
