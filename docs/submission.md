---
# DEVISE — Submission Document

## Intent Model
DEVISE captures high-level user financial intent (e.g., "analyze NVDA and act on it") and decomposes it into structured sub-intents: `data_fetch`, `analysis`, `risk_review`, and `execution`. Each sub-intent is scoped to a specific agent role — the Swarm Analyst, Risk Agent, ArmorClaw enforcer, and Trader Agent respectively. No agent can act outside its declared intent scope. Intent boundaries are defined declaratively in `skills/policy/devise_policy.yaml` and enforced programmatically at runtime before any financial action is taken.

## Policy Model
All enforcement rules are declared in `skills/policy/devise_policy.yaml`. This file is the single source of truth for:
- **Approved ticker universe**: Only AAPL, NVDA, MSFT are permitted. Any trade outside this list is blocked at the ArmorClaw layer.
- **Per-order share limits**: Maximum 50 shares per order. Attempts exceeding this are deterministically rejected.
- **Maximum order value (USD)**: A hard cap on the dollar value per trade enforced before execution.
- **Tool access control per agent role**: The Swarm Analyst can access `market_data_fetch` only. The Trader Agent can access `order_place` only. No role can access credential files or system tools.
- **Data handling restrictions**: No agent may access API keys, credential files, or transmit portfolio data to external endpoints.
- **Time-based restrictions**: Trading is restricted outside market hours and during earnings blackout windows.

## Enforcement Mechanism
DEVISE uses a 4-layer programmatic enforcement stack. All enforcement is autonomous — no human intervention or approval is required at any stage.

**Layer 1 — DeviceToken Issuance (Risk Agent)**
Before any trade can proceed, the Risk Agent validates the recommendation against portfolio limits and issues a signed `DeviceToken` using HMAC-SHA256. The token encodes the permitted ticker, quantity, and a TTL expiration window. Tokens cannot be reused after expiry (replay attack prevention).

**Layer 2 — ArmorClaw Intercept**
Every action intent is intercepted by `server/enforcement/armorclaw.py` before reaching the Trader Agent. ArmorClaw validates: (a) the DeviceToken signature and TTL, (b) the proposed action against all rules in `devise_policy.yaml`, (c) that the requesting agent role has permission to use the requested tool. If any check fails, the action is deterministically blocked and logged with the specific rule violated.

**Layer 3 — DeviceGuard Role Boundary**
`server/enforcement/device_guard.py` enforces lateral movement prevention. Each agent role has a fixed tool whitelist. An Analyst cannot call `order_place`. A Trader cannot read user files. These boundaries cannot be overridden at runtime.

**Layer 4 — Prompt Injection Defense**
`armorclaw.py` scans all incoming agent instructions for known injection patterns (e.g., "ignore previous instructions", "override policy"). Any match results in immediate termination of the pipeline and a flagged log entry.

All decisions — allow or block — are logged with: timestamp, agent role, action attempted, policy rule triggered, and decision reason. Logs are streamed to the frontend dashboard in real time and persisted to Supabase.
---
