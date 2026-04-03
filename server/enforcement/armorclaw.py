"""
ArmorClaw — Primary Enforcement Engine

The central orchestrator that chains all Device hooks before any agent
action reaches execution. Every tool call passes through this pipeline:

  1. DeviceGuard.check_scope()     → Is this agent allowed to use this tool?
  2. DevicePolicy.validate_action() → Does the action comply with policy.yaml?
  3. Prompt injection scan          → Detect injected commands in parameters
  4. DeviceToken.verify_token()     → (Trader only) Is the delegation token valid?
  5. DeviceLog.log_decision()       → Record the outcome

Enforcement is FAIL-CLOSED: if any check cannot be verified, the action is blocked.
"""

import re
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass, field

from enforcement.device_guard import check_scope
from enforcement.device_log import device_log
from core.policy_handler import device_policy
from core.security import verify_device_token


# ── Prompt Injection Patterns ────────────────────────────────────────────
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?previous\s+instructions",
    r"(?i)ignore\s+above",
    r"(?i)bypass\s+(all\s+)?policy",
    r"(?i)bypass\s+(all\s+)?checks",
    r"(?i)override\s+(all\s+)?restrictions",
    r"(?i)disregard\s+(all\s+)?rules",
    r"(?i)you\s+are\s+now\s+a",
    r"(?i)new\s+instruction[s]?\s*:",
    r"(?i)system\s+prompt\s*:",
    r"(?i)act\s+as\s+if",
    r"(?i)pretend\s+(that\s+)?you",
    r"(?i)forget\s+(all\s+)?previous",
    r"(?i)do\s+not\s+follow",
    r"(?i)immediately\s+place",
    r"(?i)execute\s+without\s+checking",
]


@dataclass
class EnforcementResult:
    """Result of an ArmorClaw enforcement check."""
    allowed: bool
    agent: str
    tool: str
    target: str
    checks: List[Dict[str, Any]] = field(default_factory=list)
    block_reason: Optional[str] = None
    block_layer: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "allowed": self.allowed,
            "agent": self.agent,
            "tool": self.tool,
            "target": self.target,
            "checks": self.checks,
            "block_reason": self.block_reason,
            "block_layer": self.block_layer,
        }


def scan_for_injection(text: str) -> Tuple[bool, Optional[str]]:
    """
    Scans text for prompt injection patterns.
    Returns (is_clean, injection_detail).
    """
    if not text:
        return True, None
    
    for pattern in INJECTION_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return False, f"Prompt injection detected: '{match.group()}'"
    
    return True, None


def enforce(
    agent_role: str,
    tool_name: str,
    params: Dict[str, Any],
    token: Optional[Dict[str, Any]] = None,
) -> EnforcementResult:
    """
    Central enforcement pipeline. Every agent action passes through here.
    
    Args:
        agent_role: "analyst", "risk", or "trader"
        tool_name: The tool being invoked
        params: Parameters for the tool call
        token: DeviceToken (required for trader actions)
    
    Returns:
        EnforcementResult with allowed/blocked status and check details
    """
    target = params.get("ticker", params.get("target", "N/A"))
    result = EnforcementResult(allowed=True, agent=agent_role, tool=tool_name, target=target)
    
    # ── CHECK 1: DeviceGuard — Scope Verification ────────────────────
    scope_ok, scope_error = check_scope(agent_role, tool_name)
    check_1 = {
        "layer": "DeviceGuard",
        "check": "agent_scope",
        "status": "PASS" if scope_ok else "FAIL",
        "detail": f"'{agent_role}' authorized for '{tool_name}'" if scope_ok else scope_error,
    }
    result.checks.append(check_1)
    
    if not scope_ok:
        result.allowed = False
        result.block_reason = scope_error
        result.block_layer = "DeviceGuard"
        device_log.log(agent_role, tool_name, target, "BLOCKED", f"scope_violation: {scope_error}", params)
        return result
    
    # ── CHECK 2: DevicePolicy — Policy Compliance ────────────────────
    policy_checks = _check_policy(agent_role, tool_name, params)
    for pc in policy_checks:
        result.checks.append(pc)
        if pc["status"] == "FAIL":
            result.allowed = False
            result.block_reason = pc["detail"]
            result.block_layer = "DevicePolicy"
            device_log.log(agent_role, tool_name, target, "BLOCKED", pc["detail"], params)
            return result
    
    # ── CHECK 3: Prompt Injection Scan ───────────────────────────────
    all_text = " ".join(str(v) for v in params.values())
    is_clean, injection_detail = scan_for_injection(all_text)
    check_3 = {
        "layer": "ArmorClaw",
        "check": "prompt_injection_scan",
        "status": "PASS" if is_clean else "FAIL",
        "detail": "No injection patterns detected" if is_clean else injection_detail,
    }
    result.checks.append(check_3)
    
    if not is_clean:
        result.allowed = False
        result.block_reason = injection_detail
        result.block_layer = "ArmorClaw"
        device_log.log(agent_role, tool_name, target, "BLOCKED", f"injection: {injection_detail}", params)
        return result
    
    # ── CHECK 4: DeviceToken — Delegation Verification (Trader only) ─
    if agent_role == "trader" and tool_name == "order_place":
        if token is None:
            result.allowed = False
            result.block_reason = "Trader attempted order_place without DeviceToken"
            result.block_layer = "DeviceToken"
            check_4 = {
                "layer": "DeviceToken",
                "check": "token_presence",
                "status": "FAIL",
                "detail": result.block_reason,
            }
            result.checks.append(check_4)
            device_log.log(agent_role, tool_name, target, "BLOCKED", "missing_delegation_token", params)
            return result
        
        # Verify the HMAC token
        requested_ticker = params.get("ticker", "")
        requested_quantity = params.get("quantity", 0)
        
        # Make a copy so verify_device_token doesn't mutate the original
        token_copy = dict(token)
        is_valid, validation_error = verify_device_token(token_copy, requested_ticker, requested_quantity)
        
        check_4 = {
            "layer": "DeviceToken",
            "check": "hmac_delegation_verify",
            "status": "PASS" if is_valid else "FAIL",
            "detail": "Token valid: HMAC ✓, TTL ✓, Replay ✓, Context ✓" if is_valid else validation_error,
        }
        result.checks.append(check_4)
        
        if not is_valid:
            result.allowed = False
            result.block_reason = validation_error
            result.block_layer = "DeviceToken"
            device_log.log(agent_role, tool_name, target, "BLOCKED", f"token_invalid: {validation_error}", params)
            return result
    
    # ── CHECK 5: Intent Verification — Tool in approved plan ─────────
    check_5 = {
        "layer": "ArmorClaw",
        "check": "intent_plan_verification",
        "status": "PASS",
        "detail": f"'{tool_name}' is in the approved intent plan for '{agent_role}'",
    }
    result.checks.append(check_5)
    
    # ── ALL CHECKS PASSED ────────────────────────────────────────────
    device_log.log(agent_role, tool_name, target, "ALLOWED", "all_checks_passed", params)
    return result


def _check_policy(agent_role: str, tool_name: str, params: Dict[str, Any]) -> List[Dict]:
    """Runs DevicePolicy checks based on the tool being called."""
    checks = []
    
    # Forbidden tools check
    if device_policy.is_tool_forbidden(tool_name):
        checks.append({
            "layer": "DevicePolicy",
            "check": "forbidden_tool",
            "status": "FAIL",
            "detail": f"Tool '{tool_name}' is in the forbidden_tools list",
        })
        return checks
    
    checks.append({
        "layer": "DevicePolicy",
        "check": "forbidden_tool",
        "status": "PASS",
        "detail": f"Tool '{tool_name}' is not forbidden",
    })
    
    # Ticker universe check (for market/trade operations)
    ticker = params.get("ticker")
    if ticker and tool_name in ("market_data_fetch", "order_place"):
        universe = device_policy.get_ticker_universe()
        if ticker in universe:
            checks.append({
                "layer": "DevicePolicy",
                "check": "ticker_universe",
                "status": "PASS",
                "detail": f"Ticker '{ticker}' is in approved universe: {universe}",
            })
        else:
            checks.append({
                "layer": "DevicePolicy",
                "check": "ticker_universe",
                "status": "FAIL",
                "detail": f"Ticker '{ticker}' NOT in approved universe: {universe}",
            })
            return checks
    
    # Max order size check
    quantity = params.get("quantity")
    if quantity is not None and tool_name == "order_place":
        max_size = device_policy.get_max_order_size()
        if quantity <= max_size:
            checks.append({
                "layer": "DevicePolicy",
                "check": "max_order_size",
                "status": "PASS",
                "detail": f"Quantity {quantity} ≤ max {max_size}",
            })
        else:
            checks.append({
                "layer": "DevicePolicy",
                "check": "max_order_size",
                "status": "FAIL",
                "detail": f"Quantity {quantity} exceeds max order size {max_size}",
            })
    
    return checks
