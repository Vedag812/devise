"""
MiroFish Swarm Intelligence Engine — DEVISE Financial Pipeline

Replaces static GPT personas with a simulation-driven intelligence layer.
Instead of "AI thinks", the "market behaves".

Architecture:
  1. ENTITY GRAPH — Companies, sectors, macro factors + relationships
  2. AGENT POPULATION — 5 agent types with beliefs, memory, behavior rules
  3. SIMULATION LOOP — N rounds of agent interaction + belief evolution
  4. SIGNAL EXTRACTION — Emergent consensus → actionable output

Output contract unchanged: {action, quantity, confidence, ticker, sector_votes}
"""

import math
import random
import time
import json
import os
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
import httpx
import asyncio


# ══════════════════════════════════════════════════════════════════════════
# Phase 1 — Entity Graph (Market World)
# ══════════════════════════════════════════════════════════════════════════

ENTITY_GRAPH = {
    "companies": {
        "NVDA": {"sector": "Semiconductors", "market_cap": "large", "volatility": "high",
                 "relationships": {"AAPL": "customer", "MSFT": "partner", "AMD": "competitor"}},
        "AAPL": {"sector": "Consumer Tech", "market_cap": "mega", "volatility": "medium",
                 "relationships": {"NVDA": "supplier", "MSFT": "competitor", "GOOGL": "competitor"}},
        "MSFT": {"sector": "Enterprise Tech", "market_cap": "mega", "volatility": "low",
                 "relationships": {"NVDA": "partner", "AAPL": "competitor", "GOOGL": "competitor"}},
        "TSLA": {"sector": "EV/Energy", "market_cap": "large", "volatility": "extreme",
                 "relationships": {"NVDA": "customer", "AAPL": "neutral", "RIVN": "competitor"}},
    },
    "sectors": {
        "Semiconductors": {"sensitivity_to_rates": 0.7, "sensitivity_to_ai": 0.95, "cycle_position": "expansion"},
        "Consumer Tech": {"sensitivity_to_rates": 0.5, "sensitivity_to_ai": 0.6, "cycle_position": "mature"},
        "Enterprise Tech": {"sensitivity_to_rates": 0.4, "sensitivity_to_ai": 0.8, "cycle_position": "growth"},
        "EV/Energy": {"sensitivity_to_rates": 0.8, "sensitivity_to_ai": 0.3, "cycle_position": "volatile"},
    },
    "macro_factors": {
        "interest_rates": {"direction": "stable", "impact": 0.3},
        "inflation": {"direction": "declining", "impact": 0.2},
        "ai_spending": {"direction": "accelerating", "impact": 0.8},
        "geopolitics": {"direction": "uncertain", "impact": 0.4},
    }
}


# ══════════════════════════════════════════════════════════════════════════
# Phase 2 — Agent Population
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class AgentBelief:
    """An agent's belief about a ticker at a point in time."""
    sentiment: float      # -1.0 (extreme bearish) to +1.0 (extreme bullish)
    confidence: float     # 0.0 to 1.0
    reasoning: str

    @property
    def verdict(self) -> str:
        if self.sentiment > 0.15:
            return "bullish"
        elif self.sentiment < -0.15:
            return "bearish"
        return "neutral"


@dataclass
class SimAgent:
    """A single agent in the market simulation."""
    agent_id: str
    agent_type: str       # retail, institutional, hedge, analyst, media
    influence_power: float
    reactivity: float     # How much an agent reacts to news (0-1)
    herd_factor: float    # How much influenced by other agents (0-1)
    contrarian: float     # Tendency to go against the crowd (0-1)
    memory_decay: float   # How fast past beliefs decay (0-1)

    belief: AgentBelief = field(default_factory=lambda: AgentBelief(0.0, 0.5, ""))
    belief_history: List[AgentBelief] = field(default_factory=list)

    def observe_seed(self, seed_signal: float, seed_reasoning: str):
        """React to the initial news/event seed."""
        noise = random.gauss(0, 0.1 * self.reactivity)
        raw = seed_signal * self.reactivity + noise

        # Contrarians push against strong signals
        if abs(seed_signal) > 0.6 and self.contrarian > 0.5:
            raw *= (1 - self.contrarian * 0.6)

        self.belief = AgentBelief(
            sentiment=max(-1.0, min(1.0, raw)),
            confidence=min(1.0, abs(raw) * 0.8 + 0.2),
            reasoning=seed_reasoning
        )
        self.belief_history.append(self.belief)

    def interact(self, crowd_sentiment: float, crowd_confidence: float, round_num: int):
        """Update beliefs based on interaction with other agents."""
        prev = self.belief.sentiment

        # Herd influence: pull toward crowd
        herd_pull = (crowd_sentiment - prev) * self.herd_factor * 0.3

        # Contrarian push: resist the crowd
        contrarian_push = 0.0
        if abs(crowd_sentiment) > 0.4 and self.contrarian > 0.3:
            contrarian_push = -crowd_sentiment * self.contrarian * 0.15

        # Memory decay: fade toward neutral over rounds
        decay = prev * self.memory_decay * 0.05

        # Random market noise
        noise = random.gauss(0, 0.03)

        new_sentiment = prev + herd_pull + contrarian_push - decay + noise
        new_sentiment = max(-1.0, min(1.0, new_sentiment))

        # Confidence evolves based on agreement with crowd
        agreement = 1.0 - abs(new_sentiment - crowd_sentiment)
        new_confidence = self.belief.confidence * 0.7 + agreement * 0.3

        self.belief = AgentBelief(
            sentiment=new_sentiment,
            confidence=min(1.0, max(0.1, new_confidence)),
            reasoning=f"Round {round_num}: adjusted from {prev:.2f} → {new_sentiment:.2f}"
        )
        self.belief_history.append(self.belief)


# Agent Factory
def _spawn_agents(count_per_type: int = 3) -> List[SimAgent]:
    """Spawn a diverse population of market agents."""
    agents = []
    agent_configs = [
        # (type, influence, reactivity, herd, contrarian, memory_decay)
        ("retail",        0.10, 0.90, 0.80, 0.05, 0.3),
        ("institutional", 0.25, 0.50, 0.40, 0.15, 0.1),
        ("hedge_fund",    0.25, 0.60, 0.20, 0.60, 0.1),
        ("analyst",       0.25, 0.40, 0.30, 0.10, 0.05),
        ("media",         0.15, 0.95, 0.70, 0.05, 0.4),
    ]

    for agent_type, influence, reactivity, herd, contrarian, decay in agent_configs:
        for i in range(count_per_type):
            # Add personality variation
            agents.append(SimAgent(
                agent_id=f"{agent_type}_{i}",
                agent_type=agent_type,
                influence_power=influence,
                reactivity=reactivity + random.gauss(0, 0.05),
                herd_factor=max(0, min(1, herd + random.gauss(0, 0.08))),
                contrarian=max(0, min(1, contrarian + random.gauss(0, 0.05))),
                memory_decay=max(0, min(1, decay + random.gauss(0, 0.02))),
            ))

    return agents


# ══════════════════════════════════════════════════════════════════════════
# Phase 3 — Seed Signal Generation (GPT-powered)
# ══════════════════════════════════════════════════════════════════════════

async def _generate_seed_signal(ticker: str, news: str, price: float, openai_key: str) -> Tuple[float, str]:
    """Use GPT to convert news into a numeric seed signal for the simulation.
    Returns (signal: -1.0 to 1.0, reasoning: str)
    """
    if not openai_key:
        return _heuristic_seed(news)

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "temperature": 0.2,
                    "max_tokens": 100,
                    "messages": [
                        {"role": "system", "content": "You analyze financial news and output a market reaction signal. Respond ONLY with valid JSON: {\"signal\": -1.0 to 1.0, \"reasoning\": \"one sentence\"}. -1.0 = extremely bearish, 0 = neutral, 1.0 = extremely bullish. No markdown."},
                        {"role": "user", "content": f"Ticker: {ticker} at ${price:.2f}. News: {news[:400]}"}
                    ]
                }
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data = json.loads(content)
            return float(data.get("signal", 0)), data.get("reasoning", "GPT seeded")
    except Exception as e:
        print(f"[MiroFish] GPT seed failed: {e}, using heuristic")
        return _heuristic_seed(news)


def _heuristic_seed(news: str) -> Tuple[float, str]:
    """Fallback heuristic when GPT is unavailable."""
    upper = news.upper()
    score = 0.0
    reasons = []

    bullish = ["BEAT", "SURGE", "RECORD", "GROWTH", "STRONG", "EXCEED", "UPGRADE", "BULLISH", "RALLY", "BREAKOUT"]
    bearish = ["MISS", "DECLINE", "WEAK", "CUT", "DOWNGRADE", "BEARISH", "CRASH", "LOSS", "LAYOFF", "RECESSION"]

    for word in bullish:
        if word in upper:
            score += 0.15
            reasons.append(f"+{word.lower()}")
    for word in bearish:
        if word in upper:
            score -= 0.15
            reasons.append(f"-{word.lower()}")

    score = max(-1.0, min(1.0, score + random.gauss(0, 0.05)))
    reasoning = f"Heuristic: {', '.join(reasons)}" if reasons else "Neutral/mixed signal"
    return score, reasoning


# ══════════════════════════════════════════════════════════════════════════
# Phase 4 & 5 — Simulation Loop + Signal Extraction
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class SimulationRound:
    """Record of a single simulation round."""
    round_num: int
    crowd_sentiment: float
    crowd_confidence: float
    volatility: float
    agent_beliefs: Dict[str, Dict[str, float]]


@dataclass
class SimulationResult:
    """Complete result of a MiroFish simulation."""
    ticker: str
    seed_signal: float
    seed_reasoning: str
    rounds: List[SimulationRound]
    num_agents: int
    simulation_time_ms: float

    # Extracted signals
    final_sentiment: float
    final_confidence: float
    final_volatility: float
    momentum: float  # Change in sentiment over rounds

    # Decision
    action: str
    quantity: int
    agent_type_breakdown: Dict[str, Dict[str, Any]]

    def to_sector_analysis(self) -> dict:
        """Convert to the same format as the old swarm analysis for pipeline compatibility."""
        return self.agent_type_breakdown

    def to_dict(self) -> dict:
        return {
            "ticker": self.ticker,
            "engine": "mirofish_simulation",
            "seed": {"signal": self.seed_signal, "reasoning": self.seed_reasoning},
            "simulation": {
                "rounds": len(self.rounds),
                "agents": self.num_agents,
                "time_ms": round(self.simulation_time_ms, 1),
                "evolution": [
                    {"round": r.round_num, "sentiment": round(r.crowd_sentiment, 3),
                     "confidence": round(r.crowd_confidence, 3), "volatility": round(r.volatility, 3)}
                    for r in self.rounds
                ],
            },
            "signals": {
                "sentiment": round(self.final_sentiment, 3),
                "confidence": round(self.final_confidence, 3),
                "volatility": round(self.final_volatility, 3),
                "momentum": round(self.momentum, 3),
            },
            "decision": {
                "action": self.action,
                "quantity": self.quantity,
            },
            "agent_breakdown": {
                k: {"verdict": v["verdict"], "confidence": round(v["confidence"], 3),
                     "reasoning": v["reasoning"]}
                for k, v in self.agent_type_breakdown.items()
            },
        }


async def run_mirofish_simulation(
    ticker: str,
    news_seed: str,
    price: float,
    openai_key: str = "",
    num_rounds: int = 5,
    agents_per_type: int = 3,
) -> SimulationResult:
    """
    Run a full MiroFish swarm intelligence simulation.

    1. Generate seed signal from news (GPT or heuristic)
    2. Spawn diverse agent population
    3. Agents observe seed, form initial beliefs
    4. Run N rounds of agent interaction + belief evolution
    5. Extract emergent consensus signals
    6. Translate to actionable trading decision
    """
    t0 = time.time()

    # ── Step 1: Seed Signal ──────────────────────────────────────────
    seed_signal, seed_reasoning = await _generate_seed_signal(ticker, news_seed, price, openai_key)

    # Adjust seed based on entity graph context
    company = ENTITY_GRAPH["companies"].get(ticker, {})
    sector_name = company.get("sector", "Unknown")
    sector = ENTITY_GRAPH["sectors"].get(sector_name, {})

    # AI-sensitive tickers get boosted by AI spending
    ai_boost = sector.get("sensitivity_to_ai", 0.5) * ENTITY_GRAPH["macro_factors"]["ai_spending"]["impact"] * 0.1
    if seed_signal > 0:
        seed_signal = min(1.0, seed_signal + ai_boost)

    # ── Step 2: Spawn Agents ─────────────────────────────────────────
    agents = _spawn_agents(agents_per_type)

    # ── Step 3: Initial Observation ──────────────────────────────────
    for agent in agents:
        agent.observe_seed(seed_signal, seed_reasoning)

    # ── Step 4: Simulation Loop ──────────────────────────────────────
    rounds: List[SimulationRound] = []

    for round_num in range(1, num_rounds + 1):
        # Calculate crowd metrics (weighted by influence)
        total_weight = sum(a.influence_power for a in agents)
        crowd_sentiment = sum(a.belief.sentiment * a.influence_power for a in agents) / total_weight
        crowd_confidence = sum(a.belief.confidence * a.influence_power for a in agents) / total_weight

        sentiments = [a.belief.sentiment for a in agents]
        volatility = (sum((s - crowd_sentiment) ** 2 for s in sentiments) / len(sentiments)) ** 0.5

        # Record round
        agent_beliefs = {}
        for a in agents:
            agent_beliefs[a.agent_id] = {
                "sentiment": round(a.belief.sentiment, 3),
                "confidence": round(a.belief.confidence, 3),
            }

        rounds.append(SimulationRound(
            round_num=round_num,
            crowd_sentiment=crowd_sentiment,
            crowd_confidence=crowd_confidence,
            volatility=volatility,
            agent_beliefs=agent_beliefs,
        ))

        # Agents interact and update (except last round which is just recording)
        if round_num < num_rounds:
            for agent in agents:
                agent.interact(crowd_sentiment, crowd_confidence, round_num + 1)

    # ── Step 5: Signal Extraction ────────────────────────────────────
    final_round = rounds[-1]
    first_round = rounds[0]
    momentum = final_round.crowd_sentiment - first_round.crowd_sentiment

    # ── Step 6: Agent Type Breakdown ─────────────────────────────────
    type_groups: Dict[str, List[SimAgent]] = {}
    for a in agents:
        type_groups.setdefault(a.agent_type, []).append(a)

    # Map agent types to display names
    type_display = {
        "retail": "RetailTraders",
        "institutional": "Institutional",
        "hedge_fund": "HedgeFunds",
        "analyst": "Analysts",
        "media": "MediaSentiment",
    }

    agent_breakdown = {}
    for atype, group in type_groups.items():
        avg_sentiment = sum(a.belief.sentiment for a in group) / len(group)
        avg_confidence = sum(a.belief.confidence for a in group) / len(group)
        display_name = type_display.get(atype, atype)

        if avg_sentiment > 0.15:
            verdict = "bullish"
        elif avg_sentiment < -0.15:
            verdict = "bearish"
        else:
            verdict = "neutral"

        agent_breakdown[display_name] = {
            "verdict": verdict,
            "confidence": avg_confidence,
            "weight": group[0].influence_power,
            "reasoning": f"Emergent {verdict} consensus (sentiment={avg_sentiment:.2f}) after {num_rounds} simulation rounds",
        }

    # ── Step 7: Decision Translation ─────────────────────────────────
    fs = final_round.crowd_sentiment
    fc = final_round.crowd_confidence

    if fs > 0.15:
        action = "BUY"
    elif fs < -0.15:
        action = "SELL"
    else:
        action = "HOLD"

    # Quantity scaled by confidence, capped at 50
    if action == "HOLD":
        quantity = 0
    else:
        raw_qty = abs(fs) * fc * 60  # Scale factor
        quantity = max(1, min(50, int(raw_qty)))

    elapsed = (time.time() - t0) * 1000

    return SimulationResult(
        ticker=ticker,
        seed_signal=seed_signal,
        seed_reasoning=seed_reasoning,
        rounds=rounds,
        num_agents=len(agents),
        simulation_time_ms=elapsed,
        final_sentiment=final_round.crowd_sentiment,
        final_confidence=final_round.crowd_confidence,
        final_volatility=final_round.volatility,
        momentum=momentum,
        action=action,
        quantity=quantity,
        agent_type_breakdown=agent_breakdown,
    )
