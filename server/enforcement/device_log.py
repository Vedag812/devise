"""
DeviceLog — Structured Financial Audit Trail

Every enforcement decision (ALLOWED or BLOCKED) is recorded with:
  - Timestamp
  - Agent role
  - Tool name
  - Parameters
  - Decision (ALLOWED/BLOCKED)
  - Rule cited
  - Unique entry ID

Provides both in-memory access and formatted console output.
"""

import time
import uuid
from typing import List, Dict, Any, Optional


class AuditEntry:
    """Single enforcement decision record."""
    
    def __init__(
        self,
        agent: str,
        tool: str,
        target: str,
        decision: str,
        rule: str,
        params: Optional[Dict] = None,
    ):
        self.id = str(uuid.uuid4())[:8]
        self.timestamp = time.time()
        self.time_str = time.strftime('%H:%M:%S', time.localtime(self.timestamp))
        self.agent = agent
        self.tool = tool
        self.target = target
        self.decision = decision  # "ALLOWED" or "BLOCKED"
        self.rule = rule
        self.params = params or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "time": self.time_str,
            "agent": self.agent,
            "tool": self.tool,
            "target": self.target,
            "decision": self.decision,
            "rule": self.rule,
            "params": self.params,
        }
    
    def __repr__(self) -> str:
        icon = "✓" if self.decision == "ALLOWED" else "✗"
        color = "\033[92m" if self.decision == "ALLOWED" else "\033[91m"
        reset = "\033[0m"
        return (
            f"[{self.time_str}] {color}{icon} {self.decision:<8}{reset} | "
            f"{self.agent:<8} | {self.tool:<20} | {self.target:<16} | "
            f"rule: {self.rule}"
        )


class DeviceLog:
    """In-memory structured audit trail for all enforcement decisions."""
    
    def __init__(self):
        self._entries: List[AuditEntry] = []
    
    def log(
        self,
        agent: str,
        tool: str,
        target: str,
        decision: str,
        rule: str,
        params: Optional[Dict] = None,
    ) -> AuditEntry:
        """Record an enforcement decision."""
        entry = AuditEntry(agent, tool, target, decision, rule, params)
        self._entries.append(entry)
        # Also print to console for visibility
        print(repr(entry))
        return entry
    
    def get_trail(self) -> List[Dict[str, Any]]:
        """Returns the full audit trail as a list of dicts."""
        return [e.to_dict() for e in self._entries]
    
    def get_recent(self, n: int = 20) -> List[Dict[str, Any]]:
        """Returns the N most recent entries."""
        return [e.to_dict() for e in self._entries[-n:]]
    
    def clear(self):
        """Clears the audit trail (for demo resets)."""
        self._entries.clear()
    
    def count_by_decision(self) -> Dict[str, int]:
        """Returns counts of ALLOWED vs BLOCKED decisions."""
        allowed = sum(1 for e in self._entries if e.decision == "ALLOWED")
        blocked = sum(1 for e in self._entries if e.decision == "BLOCKED")
        return {"allowed": allowed, "blocked": blocked}


# Singleton instance
device_log = DeviceLog()
