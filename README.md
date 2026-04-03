# DEVISE — Intent-Aware Autonomous Financial Pipeline

> **Autonomous AI agents for financial workflows — with enforced intent boundaries.**

DEVISE is an autonomous multi-agent financial enforcement system that researches equities, validates trades against declarative policy, and executes real paper trades on Alpaca — with ArmorClaw blocking any unauthorized actions.

## Architecture

```
User Intent → [Analyst Agent] → [Risk Agent] → [ArmorClaw] → [Trader Agent] → Alpaca
                 Research          Validate       Enforce        Execute
                 (read-only)       (policy)       (intent)       (bounded)
```

**Key Components:**
- **OpenClaw Skills** — 3 agent skills (`devise-analyst`, `devise-risk`, `devise-trader`)
- **ArmorClaw** — Intent enforcement plugin (prompt injection scanning, tool ACLs)
- **DEVISE Policy Engine** — Declarative YAML policy model (`skills/policy/devise_policy.yaml`)
- **DeviceTokens** — HMAC-SHA256 signed delegation tokens with bounded scope
- **Alpaca Paper Trading** — Real execution against live market data

## Features

✅ Real Alpaca paper trades (no mocked responses)  
✅ Declarative YAML policy (not if-else checks)  
✅ HMAC-SHA256 signed delegation tokens  
✅ Prompt injection detection & blocking  
✅ Tool access control per agent  
✅ Structured audit trail  
✅ Attack simulation demo  
✅ Live market data (NVDA, AAPL, MSFT)  

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/devise.git
cd devise
npm install
pip install -r server/requirements.txt
```

### 2. Configure
```bash
cp .env.example .env
# Fill in your Alpaca, OpenAI, and ArmorIQ API keys
```

### 3. Clone Frameworks
```bash
git clone https://github.com/openclaw/openclaw.git
git clone https://github.com/ArmoriQ/armorclaw.git
```

### 4. Run
```bash
# Terminal 1: Backend
cd server && python main.py

# Terminal 2: Frontend
npm run dev
```

Open http://localhost:5173

## Demo Flow

1. **Landing Page** → System overview with architecture
2. **Login** → Auth handshake simulation
3. **Dashboard** → Select ticker → Click sample seed → Initialize Pipeline
4. **Watch** → 4 phases animate: Analyst → Risk → ArmorClaw → Trader
5. **Verify** → Audit trail shows ALLOWED/BLOCKED with rule citations
6. **Attack Demo** → Prompt injection → 3 layers of enforcement triggered

## Policy Model

```yaml
# skills/policy/devise_policy.yaml
ticker_universe: [NVDA, AAPL, MSFT]
trade_limits:
  max_shares: 50
  max_value_usd: 5000
  max_exposure_usd: 15000
injection_defense:
  scan_tool_arguments: true
  block_patterns: [IGNORE, OVERRIDE, SYSTEM PROMPT, ...]
```

## Delegation

Risk Agent issues a `DeviceToken` to the Trader Agent:
- Scoped to specific ticker, quantity, and dollar value
- HMAC-SHA256 signed, non-forgeable
- TTL-bounded (120 seconds)
- Non-inheritable (no sub-delegation)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Framer Motion |
| Backend | Python FastAPI + WebSocket |
| Trading | Alpaca Paper Trading API |
| Policy | YAML declarative model |
| Auth | HMAC-SHA256 DeviceTokens |
| Framework | OpenClaw + ArmorClaw |

## Team

Built by Team Ossome.
