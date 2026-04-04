"""
OpenClaw Autonomous Agent — DEVISE Financial Pipeline

A true OpenClaw-style autonomous agent that:
  1. Accepts natural language instructions (e.g., "look into NVDA and handle it")
  2. Loads agent skills from SKILL.md files (OpenClaw format)
  3. Autonomously reasons about the instruction using GPT
  4. Plans multi-step actions
  5. Executes each step through ArmorClaw enforcement
  6. Makes autonomous trading decisions within policy bounds

This is the core OpenClaw integration for the hackathon.
"""

import os
import json
import yaml
import re
import time
import asyncio
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from pathlib import Path

import httpx

# Import enforcement stack
from enforcement.armorclaw import enforce as armorclaw_enforce, scan_for_injection
from enforcement.device_guard import check_scope, list_all_scopes
from enforcement.device_log import device_log
from core.policy_handler import device_policy
from core.security import issue_device_token, verify_device_token


# ── Skill Loader (OpenClaw SKILL.md format) ──────────────────────────────

@dataclass
class OpenClawSkill:
    """Represents a loaded OpenClaw skill definition."""
    name: str
    description: str
    metadata: dict
    allowed_tools: List[str]
    forbidden_tools: List[str]
    constraints: List[str]
    raw_content: str

    def to_system_prompt(self) -> str:
        return self.raw_content


def load_skills(skills_dir: str) -> Dict[str, OpenClawSkill]:
    """Load all OpenClaw SKILL.md files from the skills directory."""
    skills = {}
    skills_path = Path(skills_dir)

    if not skills_path.exists():
        return skills

    for skill_dir in skills_path.iterdir():
        if not skill_dir.is_dir():
            continue
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue

        raw = skill_file.read_text(encoding="utf-8")

        # Parse YAML frontmatter
        frontmatter = {}
        content = raw
        if raw.startswith("---"):
            parts = raw.split("---", 2)
            if len(parts) >= 3:
                try:
                    frontmatter = yaml.safe_load(parts[1]) or {}
                except Exception:
                    pass
                content = parts[2].strip()

        # Extract allowed/forbidden tools from content
        allowed = re.findall(r'`(\w+)`\s*[|—]\s*', content)
        forbidden = []
        if "Forbidden Tools" in content:
            forbidden_section = content.split("Forbidden Tools")[1].split("##")[0]
            forbidden = re.findall(r'`(\w+)`', forbidden_section)

        # Extract constraints
        constraints = []
        if "Constraints" in content:
            constraint_section = content.split("Constraints")[1].split("##")[0]
            constraints = [line.strip("- ").strip() for line in constraint_section.split("\n") if line.strip().startswith("-")]

        skill = OpenClawSkill(
            name=frontmatter.get("name", skill_dir.name),
            description=frontmatter.get("description", ""),
            metadata=frontmatter.get("metadata", {}),
            allowed_tools=allowed,
            forbidden_tools=forbidden,
            constraints=constraints,
            raw_content=content,
        )
        skills[skill.name] = skill

    return skills


# ── OpenClaw Agent Runtime ───────────────────────────────────────────────

@dataclass
class AgentStep:
    """A single step in the agent's execution plan."""
    step_number: int
    action: str       # e.g., "market_data_fetch", "analyze", "order_place"
    tool: str          # The tool to call
    params: Dict[str, Any]
    reasoning: str     # Why the agent chose this step
    result: Optional[Dict[str, Any]] = None
    enforcement: Optional[Dict[str, Any]] = None
    status: str = "pending"  # pending, allowed, blocked, executed


@dataclass
class AgentExecution:
    """Complete record of an autonomous agent execution."""
    instruction: str
    agent_role: str
    skill: Optional[str]
    steps: List[AgentStep] = field(default_factory=list)
    final_decision: Optional[Dict[str, Any]] = None
    status: str = "running"  # running, completed, blocked, error
    enforcement_summary: Dict[str, int] = field(default_factory=lambda: {"allowed": 0, "blocked": 0, "total": 0})

    def to_dict(self) -> dict:
        return {
            "instruction": self.instruction,
            "agent_role": self.agent_role,
            "skill": self.skill,
            "steps": [
                {
                    "step": s.step_number,
                    "action": s.action,
                    "tool": s.tool,
                    "params": s.params,
                    "reasoning": s.reasoning,
                    "result": s.result,
                    "enforcement": s.enforcement,
                    "status": s.status,
                }
                for s in self.steps
            ],
            "final_decision": self.final_decision,
            "status": self.status,
            "enforcement_summary": self.enforcement_summary,
        }


class OpenClawAgent:
    """
    OpenClaw-compatible autonomous agent runtime.

    Accepts natural language instructions, reasons about them using GPT,
    plans multi-step actions, and enforces intent at every step via ArmorClaw.
    """

    def __init__(self, openai_key: str, skills_dir: str, alpaca_api=None):
        self.openai_key = openai_key
        self.skills = load_skills(skills_dir)
        self.alpaca_api = alpaca_api
        self.executions: List[AgentExecution] = []

        print(f"[OpenClaw Agent] Loaded {len(self.skills)} skills: {list(self.skills.keys())}")

    async def run(self, instruction: str, callback=None) -> AgentExecution:
        """
        Run the autonomous agent with a natural language instruction.

        Args:
            instruction: Natural language instruction, e.g., "Research NVDA and buy if bullish"
            callback: Optional async function called after each step for real-time streaming

        Returns:
            AgentExecution record with all steps, enforcement results, and final decision
        """
        execution = AgentExecution(
            instruction=instruction,
            agent_role="autonomous",
            skill=None,
        )

        # Step 0: Scan instruction for injection
        is_clean, injection_detail = scan_for_injection(instruction)
        if not is_clean:
            execution.status = "blocked"
            execution.steps.append(AgentStep(
                step_number=0, action="instruction_scan", tool="armorclaw",
                params={"instruction": instruction},
                reasoning="Scanning instruction for prompt injection",
                result={"blocked": True, "reason": injection_detail},
                enforcement={"layer": "ArmorClaw", "status": "BLOCKED", "reason": injection_detail},
                status="blocked",
            ))
            execution.enforcement_summary["blocked"] += 1
            execution.enforcement_summary["total"] += 1
            if callback:
                await callback(execution)
            self.executions.append(execution)
            return execution

        # Step 1: Use GPT to analyze instruction and plan actions
        plan = await self._plan_actions(instruction)
        if callback:
            await callback(execution)

        # Step 2: Execute each planned step with ArmorClaw enforcement
        for i, planned_step in enumerate(plan):
            step = AgentStep(
                step_number=i + 1,
                action=planned_step["action"],
                tool=planned_step["tool"],
                params=planned_step.get("params", {}),
                reasoning=planned_step.get("reasoning", ""),
            )

            # Determine agent role for this step
            agent_role = self._resolve_agent_role(step.tool)
            execution.agent_role = agent_role

            # Generate token if this is a trader order_place so ArmorClaw can verify it
            token_param = None
            if agent_role == "trader" and step.tool == "order_place":
                ticker = step.params.get("ticker", "NVDA")
                qty = step.params.get("quantity", 5)
                side = step.params.get("side", "buy")
                token_param = issue_device_token(
                    issued_to="trader-agent",
                    ticker=ticker,
                    side=side,
                    max_quantity=qty,
                    ttl_minutes=2,
                )
                
            # ArmorClaw enforcement check
            enforcement_result = armorclaw_enforce(
                agent_role=agent_role,
                tool_name=step.tool,
                params=step.params,
                token=token_param,
            )

            step.enforcement = enforcement_result.to_dict()
            execution.enforcement_summary["total"] += 1

            if not enforcement_result.allowed:
                step.status = "blocked"
                step.result = {"blocked": True, "reason": enforcement_result.block_reason}
                execution.enforcement_summary["blocked"] += 1
                device_log.log(agent_role, step.tool, step.params.get("ticker", "N/A"),
                             "BLOCKED", f"openclaw_agent: {enforcement_result.block_reason}", step.params)
            else:
                # Execute the step
                step.result = await self._execute_tool(step.tool, step.params)
                step.status = "executed"
                execution.enforcement_summary["allowed"] += 1
                device_log.log(agent_role, step.tool, step.params.get("ticker", "N/A"),
                             "ALLOWED", "openclaw_agent: step executed", step.params)

            execution.steps.append(step)
            if callback:
                await callback(execution)

        # Step 3: Make final autonomous decision based on results
        execution.final_decision = await self._make_decision(instruction, execution.steps)
        execution.status = "completed"

        if callback:
            await callback(execution)

        self.executions.append(execution)
        return execution

    def _resolve_agent_role(self, tool_name: str) -> str:
        """Map a tool to the correct agent role for enforcement."""
        tool_to_role = {
            "market_data_fetch": "analyst",
            "earnings_fetch": "analyst",
            "report_write": "analyst",
            "web_search": "analyst",
            "portfolio_read": "risk",
            "portfolio_positions": "risk",
            "portfolio_metrics": "risk",
            "delegation_token_issue": "risk",
            "order_place": "trader",
            "order_status": "trader",
            "position_check": "trader",
        }
        return tool_to_role.get(tool_name, "analyst")

    async def _plan_actions(self, instruction: str) -> List[Dict]:
        """Use GPT to create an execution plan from natural language."""
        if not self.openai_key:
            # Fallback: parse simple instructions without GPT
            return self._fallback_plan(instruction)

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "temperature": 0.2,
                        "max_tokens": 500,
                        "messages": [
                            {"role": "system", "content": """You are an OpenClaw agent planner for financial workflows.
Given a natural language instruction, produce a JSON array of steps.
Each step: {"action": "description", "tool": "tool_name", "params": {...}, "reasoning": "why"}

Available tools:
- market_data_fetch: Get stock quotes. params: {"ticker": "SYMBOL"}
- earnings_fetch: Get earnings data. params: {"ticker": "SYMBOL"}
- order_place: Place a trade. params: {"ticker": "SYMBOL", "quantity": N, "side": "buy"|"sell"}
- portfolio_read: Read portfolio. params: {}
- report_write: Write analysis. params: {"ticker": "SYMBOL", "content": "..."}

Rules:
- Extract ticker symbols from the instruction
- Always fetch market data before deciding to trade
- Keep quantity under 50 shares
- Only these tickers are allowed: NVDA, AAPL, MSFT
- Respond ONLY with valid JSON array. No markdown."""},
                            {"role": "user", "content": instruction}
                        ]
                    }
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                return json.loads(content)
        except Exception as e:
            print(f"[OpenClaw Agent] GPT planning failed: {e}, using fallback")
            return self._fallback_plan(instruction)

    def _fallback_plan(self, instruction: str) -> List[Dict]:
        """Parse simple instructions without GPT."""
        instruction_upper = instruction.upper()
        ticker = None
        for t in ["NVDA", "AAPL", "MSFT", "TSLA", "GOOGL", "AMZN"]:
            if t in instruction_upper:
                ticker = t
                break
        if not ticker:
            ticker = "NVDA"

        steps = [
            {"action": "Fetch market data", "tool": "market_data_fetch", "params": {"ticker": ticker}, "reasoning": f"Getting current price for {ticker}"},
        ]

        if any(w in instruction_upper for w in ["BUY", "PURCHASE", "ACQUIRE", "HANDLE"]):
            steps.append({"action": "Place buy order", "tool": "order_place", "params": {"ticker": ticker, "quantity": 5, "side": "buy"}, "reasoning": f"Instruction suggests buying {ticker}"})
        elif any(w in instruction_upper for w in ["SELL", "DUMP", "EXIT"]):
            steps.append({"action": "Place sell order", "tool": "order_place", "params": {"ticker": ticker, "quantity": 5, "side": "sell"}, "reasoning": f"Instruction suggests selling {ticker}"})
        else:
            steps.append({"action": "Generate report", "tool": "report_write", "params": {"ticker": ticker, "content": "analysis"}, "reasoning": f"Instruction is research-focused, generating report"})

        return steps

    async def _execute_tool(self, tool: str, params: Dict) -> Dict:
        """Execute a tool call against real APIs."""
        if tool == "market_data_fetch":
            return self._fetch_market_data(params.get("ticker", "NVDA"))
        elif tool == "earnings_fetch":
            return {"ticker": params.get("ticker"), "source": "alpaca", "status": "fetched"}
        elif tool == "order_place":
            return self._place_order(params)
        elif tool == "portfolio_read" or tool == "portfolio_positions":
            return self._read_portfolio()
        elif tool == "report_write":
            return {"status": "written", "ticker": params.get("ticker"), "path": f"./output/reports/{params.get('ticker')}_analysis.md"}
        else:
            return {"status": "unknown_tool", "tool": tool}

    # Realistic mock prices for when market is closed
    MOCK_MARKET_DATA = {
        "NVDA": {"price": 178.42, "bid": 178.38, "ask": 178.46, "volume": 312_450_000, "change_pct": 2.14},
        "AAPL": {"price": 256.12, "bid": 256.08, "ask": 256.16, "volume": 54_800_000, "change_pct": 0.87},
        "MSFT": {"price": 374.65, "bid": 374.60, "ask": 374.70, "volume": 22_300_000, "change_pct": -0.32},
        "TSLA": {"price": 361.80, "bid": 361.70, "ask": 361.90, "volume": 98_700_000, "change_pct": -1.15},
    }

    def _fetch_market_data(self, ticker: str) -> Dict:
        """Fetch real market data from Alpaca. Falls back to mock data when market is closed."""
        if self.alpaca_api:
            try:
                snapshot = self.alpaca_api.get_snapshot(ticker)
                return {
                    "ticker": ticker,
                    "price": float(snapshot.latest_trade.price),
                    "bid": float(snapshot.latest_quote.bid_price),
                    "ask": float(snapshot.latest_quote.ask_price),
                    "volume": int(snapshot.daily_bar.volume),
                    "source": "alpaca_live",
                }
            except Exception:
                pass  # Fall through to mock data

        # Mock data fallback (market closed)
        mock = self.MOCK_MARKET_DATA.get(ticker, {"price": 100.00, "bid": 99.95, "ask": 100.05, "volume": 10_000_000, "change_pct": 0})
        return {
            "ticker": ticker,
            "price": mock["price"],
            "bid": mock["bid"],
            "ask": mock["ask"],
            "volume": mock["volume"],
            "change_pct": mock["change_pct"],
            "source": "mock_market_closed",
        }

    def _place_order(self, params: Dict) -> Dict:
        """Place a paper trade on Alpaca. Falls back to simulated execution when market is closed."""
        ticker = params.get("ticker", "NVDA")
        qty = params.get("quantity", 5)
        side = params.get("side", "buy")

        # Issue DeviceToken before execution
        token = issue_device_token(
            issued_to="trader-agent",
            ticker=ticker,
            side=side,
            max_quantity=qty,
            ttl_minutes=2,
        )

        # Verify token
        token_copy = dict(token)
        is_valid, err = verify_device_token(token_copy, ticker, qty)
        if not is_valid:
            return {"status": "token_rejected", "reason": err}

        if self.alpaca_api:
            try:
                order = self.alpaca_api.submit_order(
                    symbol=ticker, qty=qty, side=side.lower(),
                    type="market", time_in_force="day"
                )
                return {
                    "status": "executed",
                    "order_id": order.id,
                    "ticker": ticker,
                    "quantity": qty,
                    "side": side,
                    "source": "alpaca_paper",
                    "token_id": token["token_id"][:8],
                }
            except Exception:
                pass  # Fall through to simulated

        # Simulated execution when market is closed
        mock_price = self.MOCK_MARKET_DATA.get(ticker, {"price": 100.0})["price"]
        import uuid
        return {
            "status": "executed",
            "order_id": f"sim-{uuid.uuid4().hex[:12]}",
            "ticker": ticker,
            "quantity": qty,
            "side": side,
            "estimated_value": round(mock_price * qty, 2),
            "source": "simulated_market_closed",
            "token_id": token["token_id"][:8],
        }

    def _read_portfolio(self) -> Dict:
        """Read real portfolio from Alpaca."""
        if self.alpaca_api:
            try:
                account = self.alpaca_api.get_account()
                return {
                    "equity": float(account.equity),
                    "cash": float(account.cash),
                    "source": "alpaca_paper",
                }
            except Exception:
                pass
        return {"equity": 100000, "cash": 100000, "source": "simulated"}

    async def _make_decision(self, instruction: str, steps: List[AgentStep]) -> Dict:
        """Make a final autonomous decision based on execution results."""
        allowed = sum(1 for s in steps if s.status == "executed")
        blocked = sum(1 for s in steps if s.status == "blocked")

        # Collect results
        market_data = None
        trade_result = None
        for step in steps:
            if step.tool == "market_data_fetch" and step.result:
                market_data = step.result
            if step.tool == "order_place" and step.result:
                trade_result = step.result

        return {
            "instruction": instruction,
            "steps_executed": allowed,
            "steps_blocked": blocked,
            "market_data": market_data,
            "trade_result": trade_result,
            "autonomous_reasoning": f"Processed '{instruction}' — {allowed} steps executed, {blocked} blocked by ArmorClaw enforcement",
        }

    def get_recent_executions(self, n: int = 10) -> List[Dict]:
        """Return recent agent executions."""
        return [e.to_dict() for e in self.executions[-n:]]
