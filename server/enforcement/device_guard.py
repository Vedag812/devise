"""
DeviceGuard — Per-Agent Scope Tagging & Enforcement

Tags every action with the agent's role and permitted scope before passing
to ArmorClaw. Ensures the intent plan is evaluated in the correct agent context.

Enforcement table:
  Analyst  → market_data_fetch, earnings_fetch, report_write
  Risk     → portfolio_read, token_issue
  Trader   → order_place, position_check
"""

from typing import Tuple, Optional

# Strict per-agent tool permission map
AGENT_SCOPES = {
    "analyst": {
        "allowed_tools": ["market_data_fetch", "earnings_fetch", "report_write"],
        "description": "Read-only market data access, report generation",
    },
    "risk": {
        "allowed_tools": ["portfolio_read", "token_issue"],
        "description": "Portfolio evaluation, delegation token issuance",
    },
    "trader": {
        "allowed_tools": ["order_place", "position_check"],
        "description": "Execute validated orders only with valid DeviceToken",
    },
}


def check_scope(agent_role: str, tool_name: str) -> Tuple[bool, Optional[str]]:
    """
    Validates whether an agent is permitted to use a specific tool.
    
    Returns:
        (is_allowed, error_reason)
    """
    if agent_role not in AGENT_SCOPES:
        return False, f"Unknown agent role: '{agent_role}'. Valid roles: {list(AGENT_SCOPES.keys())}"
    
    allowed = AGENT_SCOPES[agent_role]["allowed_tools"]
    
    if tool_name not in allowed:
        return False, (
            f"Scope violation: '{agent_role}' attempted '{tool_name}' — "
            f"permitted tools: {allowed}"
        )
    
    return True, None


def get_agent_scope(agent_role: str) -> dict:
    """Returns the full scope definition for an agent role."""
    return AGENT_SCOPES.get(agent_role, {"allowed_tools": [], "description": "Unknown"})


def list_all_scopes() -> dict:
    """Returns the complete scope map for all agents."""
    return AGENT_SCOPES
