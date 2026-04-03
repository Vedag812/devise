from typing import Dict, Any
from core.supabase_client import log_device_event
from core.security import issue_device_token, verify_device_token, mark_token_spent
from core.policy_handler import device_policy
from services.alpaca_trade import execute_trade
from services.swarm_engine import run_swarm_analysis

class AnalystAgent:
    """
    Agent 1: Performs market analysis via 6 parallel sector LLMs.
    No execution authority. Read-only market data access.
    """
    async def evaluate_news(self, news_seed: str) -> Dict[str, Any]:
        # Log market data fetch intent
        log_device_event("analyst", "market_data_fetch", "universe", "ALLOWED", "rule: read-only permitted")
        
        allowed_universe = device_policy.get_ticker_universe()
        recommendation = await run_swarm_analysis(news_seed, allowed_universe)
        
        # Log output write
        log_device_event("analyst", "report_write", f"./reports/{recommendation.get('ticker')}.json", "ALLOWED", "policy: write_dirs permitted")
        return recommendation


class RiskAgent:
    """
    Agent 2: Validates the Swarm Analyst output against policies & risk constraints.
    Issues a DeviceToken (HMAC signed) delegating authority to Trader Agent.
    """
    def __init__(self):
        self.max_exposure_usd = device_policy.policy.get("max_daily_exposure_usd", 5000)
    
    def process_recommendation(self, recommendation: Dict[str, Any], current_price: float) -> Dict[str, Any]:
        ticker = recommendation.get("ticker")
        action = recommendation.get("action")
        quantity = recommendation.get("quantity")
        
        if action == "HOLD" or not ticker:
            log_device_event("risk", "evaluate", "N/A", "ALLOWED", "Swarm output HOLD")
            return {"status": "aborted", "reason": "No bullish conviction."}

        # DEVICE POLICY: Ticker Universe Verification
        allowed_universe = device_policy.get_ticker_universe()
        if ticker not in allowed_universe:
            reason = f"Ticker {ticker} not in allowed universe: {allowed_universe}"
            log_device_event("risk", "token_issue", ticker, "BLOCKED", f"ticker_not_in_universe")
            return {"status": "blocked", "reason": reason}

        # DEVICE POLICY: Max order size Verification
        max_size = device_policy.get_max_order_size()
        if quantity > max_size:
            reason = f"Quantity {quantity} exceeds device max order size limit of {max_size}"
            log_device_event("risk", "token_issue", ticker, "BLOCKED", f"exceeds_max_order_size")
            return {"status": "blocked", "reason": reason}

        # If it passes, Risk Agent formally issues the delegation token (DeviceToken plugin)
        delegation_rules = device_policy.get_delegation_rules("risk_to_trader")
        token_ttl = delegation_rules.get("token_ttl_minutes", 15)
        
        device_token = issue_device_token(
            issued_to="trader",
            ticker=ticker,
            side="buy",
            max_quantity=delegation_rules.get("max_quantity", 50),
            ttl_minutes=token_ttl
        )
        
        log_device_event("risk", "token_issue", ticker, "ALLOWED", "Policy validated, token issued.")
        return {"status": "success", "token": device_token}

class TraderAgent:
    """
    Agent 3: Receives DeviceToken and places the trade.

    Enforcement order at runtime:
      1. ArmorClaw  — intercepts at OpenClaw gateway level; blocks anything not in the
                      approved intent plan before this agent is ever invoked.
      2. Device     — verifies HMAC signature, TTL, replay-protection, ticker & quantity
                      constraints on the delegation token issued by the Risk Agent.
      3. Alpaca     — order is placed only if both layers pass.
    """
    def execute_order(self, token: Dict[str, Any], proposed_ticker: str, proposed_quantity: int) -> Dict[str, Any]:
        token_id = token.get("token_id")

        # DEVICE LAYER: Validate the delegation token (HMAC, TTL, replay, context)
        # Note: ArmorClaw already cleared this call at the OpenClaw gateway before we got here.
        is_valid, validation_error = verify_device_token(token, proposed_ticker, proposed_quantity)
        
        if not is_valid:
            log_device_event("trader", "order_place", f"{proposed_ticker}_{proposed_quantity}", "BLOCKED", validation_error)
            return {"status": "blocked", "reason": validation_error}

        log_device_event("trader", "order_place", f"{proposed_ticker}_{proposed_quantity}", "ALLOWED", "token_valid rule:delegation_ok")
        
        # Execute via Alpaca — both ArmorClaw and Device have cleared this action.
        alpaca_response = execute_trade(proposed_ticker, "buy", proposed_quantity)

        # Mark token spent AFTER successful execution (one-shot replay protection)
        if token_id:
            mark_token_spent(token_id)
            log_device_event("trader", "token_spent", proposed_ticker, "ALLOWED", f"token_id:{token_id} marked spent")

        return {"status": "executed", "api_response": alpaca_response}
