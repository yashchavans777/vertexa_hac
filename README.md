# 🛡️ ActionGate: Zero-Trust Security for Autonomous AI

> **"Every AI action. Verified. Before autonomous byte execution."**

ActionGate is a real-time, deterministic security gateway designed to intercept, verify, and govern autonomous AI agents. As AI models become capable of executing runtime tool-calls, sandbox operations, and database modifications, ActionGate acts as an impenetrable middleware layer to prevent hallucinations, destructive payloads, and unauthorized access.

---

## 🔑 Core Philosophy
**AI Analyzes. Policy Decides. Humans Govern.**
We do not blindly trust probabilistic AI models with deterministic systems. ActionGate ensures no critical infrastructure change or financial disbursement occurs without strict rule-based verification or explicit human cryptographic authorization.

---

## 🚀 Key Features

* ⚡ **Real-Time Deterministic Interception**
  Acts as a reverse-proxy middleware to evaluate incoming AI tool-calls in **sub-12ms** before they reach target systems. 
* 📜 **Declarative Policy-as-Code Engine**
  Uses JSON-based runtime conditions to evaluate the **Risk Score** and **Blast Radius** of any action. Automatically decides whether to `ALLOW`, `BLOCK`, or `REQUIRE APPROVAL` based on strict mathematical logic, not AI guesswork.
* 🛑 **Human-in-the-Loop (HITL) Authorization**
  High-risk actions (e.g., `$15,000 wire transfers` or `drop_database`) are quarantined in a live Action Queue, requiring explicit human intervention and approval before execution.
* 🔗 **Cryptographic Merkle Audit Chain**
  Every authorization decision (Allowed, Blocked, or Held) is permanently sealed into a forward-chained historical ledger with **SHA-256 Root Verification** to guarantee non-repudiation.
* 🦠 **Adversarial Chaos & Stress Lab**
  Built-in red-teaming suite to simulate SQL injections, Prompt Injections (RBAC bypass), Replay attacks, and microservice failovers to prove systemic resilience.
* 🛡️ **Payload Mutation Defense**
  Actively monitors and revokes actions if in-flight URL tampering or cryptographic signature mismatch is detected.

---

## 💻 Tech Stack

**Frontend:**
* React.js (Vite)
* Tailwind CSS
* React Router

**Backend:**
* Node.js & Express.js
* WebSockets (Socket.io) for real-time UI telemetry
* Cryptography (Crypto module for SHA-256 Hashing)

**Database:**
* MongoDB (Mongoose ODM)

---

## 🛠️ Local Development & Setup

Follow these steps to run the ActionGate project locally for testing and demonstration.

### 1. Clone the repository
```bash
git clone https://github.com/yashchavans777/ActionGate-AI-Security.git 
