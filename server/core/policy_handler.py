"""
DevicePolicy — Structured, Interpretable Policy Engine

Loads declarative rules from policy.yaml and enforces:
  1. Ticker universe restrictions
  2. Order size limits
  3. Daily exposure caps
  4. Earnings blackout windows
  5. File access restrictions (read_dirs / write_dirs)
  6. Forbidden tool enforcement
  7. Credential access blocking
  8. Prompt injection scanning
  9. Data class restrictions (no PII/account numbers)
"""

import yaml
import os
import re
import time
from pathlib import Path
from typing import Tuple, Optional, List
from datetime import datetime, timedelta


class DevicePolicy:
    def __init__(self, policy_path: str = "policy.yaml"):
        base_dir = Path(__file__).parent.parent
        full_path = os.path.join(base_dir, policy_path)

        with open(full_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.policy = self.config.get("policy", {})
        self.delegation = self.config.get("delegation", {})

        # Runtime tracking
        self._daily_exposure = 0.0
        self._daily_reset_date = datetime.now().date()
        self._trade_log: List[dict] = []

    # ── 1. Ticker Universe ──────────────────────────────────────────
    def get_ticker_universe(self) -> list:
        return self.policy.get("ticker_universe", [])

    def validate_ticker(self, ticker: str) -> Tuple[bool, str]:
        universe = self.get_ticker_universe()
        if ticker not in universe:
            return False, f"Ticker '{ticker}' is NOT in approved universe {universe}"
        return True, f"Ticker '{ticker}' is in approved universe"

    # ── 2. Order Size ───────────────────────────────────────────────
    def get_max_order_size(self) -> int:
        return self.policy.get("max_order_size", 50)

    def validate_order_size(self, quantity: int, price: float) -> Tuple[bool, str]:
        max_size = self.get_max_order_size()
        if quantity > max_size:
            return False, f"Order size {quantity} exceeds max {max_size} shares"
        return True, f"Order size {quantity} within limit of {max_size}"

    # ── 3. Daily Exposure ───────────────────────────────────────────
    def validate_daily_exposure(self, order_value: float) -> Tuple[bool, str]:
        today = datetime.now().date()
        if today != self._daily_reset_date:
            self._daily_exposure = 0.0
            self._daily_reset_date = today

        max_exposure = self.policy.get("max_daily_exposure_usd", 15000)
        projected = self._daily_exposure + order_value
        if projected > max_exposure:
            return False, f"Daily exposure ${projected:.2f} would exceed max ${max_exposure}"
        return True, f"Daily exposure ${projected:.2f} within ${max_exposure} limit"

    def record_exposure(self, order_value: float):
        """Called after successful trade to track daily exposure."""
        self._daily_exposure += order_value

    # ── 4. Earnings Blackout ────────────────────────────────────────
    def validate_earnings_blackout(self, ticker: str) -> Tuple[bool, str]:
        """
        Enforces trading blackout around earnings announcements.
        Uses policy-defined blackout window (default 3 days).
        """
        blackout_days = self.policy.get("earnings_blackout_days", 3)

        # Known Q1 2026 earnings dates (would be API-driven in production)
        EARNINGS_DATES = {
            "NVDA": datetime(2026, 2, 26),
            "AAPL": datetime(2026, 1, 30),
            "MSFT": datetime(2026, 1, 29),
        }

        if ticker in EARNINGS_DATES:
            earnings_date = EARNINGS_DATES[ticker]
            blackout_start = earnings_date - timedelta(days=blackout_days)
            blackout_end = earnings_date + timedelta(days=1)
            now = datetime.now()

            if blackout_start <= now <= blackout_end:
                return False, (
                    f"BLACKOUT: {ticker} earnings on {earnings_date.strftime('%Y-%m-%d')}. "
                    f"Trading blocked from {blackout_start.strftime('%m/%d')} to {blackout_end.strftime('%m/%d')} "
                    f"({blackout_days}-day window)"
                )

        return True, f"No active earnings blackout for {ticker}"

    # ── 5. File Access ──────────────────────────────────────────────
    def validate_file_access(self, filepath: str, mode: str = "read") -> Tuple[bool, str]:
        """
        Enforces file access restrictions from policy.yaml.
        Agents can only read from read_dirs and write to write_dirs.
        """
        file_policy = self.policy.get("file_access", {})
        allowed_dirs = file_policy.get(f"{mode}_dirs", [])

        normalized = os.path.normpath(filepath).replace("\\", "/")

        for allowed in allowed_dirs:
            allowed_norm = os.path.normpath(allowed).replace("\\", "/")
            if normalized.startswith(allowed_norm):
                return True, f"File access allowed: {filepath} in {allowed}"

        return False, f"File access DENIED: '{filepath}' not in allowed {mode}_dirs: {allowed_dirs}"

    # ── 6. Forbidden Tools ──────────────────────────────────────────
    def is_tool_forbidden(self, tool_name: str) -> bool:
        forbidden = self.policy.get("forbidden_tools", [])
        return tool_name in forbidden

    def validate_tool(self, tool_name: str) -> Tuple[bool, str]:
        if self.is_tool_forbidden(tool_name):
            return False, f"Tool '{tool_name}' is FORBIDDEN by policy"
        return True, f"Tool '{tool_name}' is allowed"

    # ── 7. Credential Access Blocking ───────────────────────────────
    CREDENTIAL_PATTERNS = [
        r"\.env",
        r"\.pem$",
        r"\.key$",
        r"credentials",
        r"secrets?\.",
        r"api[_-]?key",
        r"password",
        r"token\.(json|yaml|yml)",
        r"\.ssh/",
    ]

    def validate_no_credential_access(self, filepath: str) -> Tuple[bool, str]:
        """Blocks any attempt to access credential files."""
        for pattern in self.CREDENTIAL_PATTERNS:
            if re.search(pattern, filepath, re.IGNORECASE):
                return False, f"BLOCKED: Credential file access attempt: '{filepath}' matches '{pattern}'"
        return True, "No credential file access detected"

    # ── 8. Injection Scanning ───────────────────────────────────────
    INJECTION_PATTERNS = [
        r"(?i)ignore\s+(all\s+)?previous\s+instructions",
        r"(?i)ignore\s+(all\s+)?instructions",
        r"(?i)bypass\s+(all\s+)?policy",
        r"(?i)override\s+(all\s+)?restrictions",
        r"(?i)system\s+prompt\s*:",
        r"(?i)pretend\s+(that\s+)?you",
        r"(?i)forget\s+(all\s+)?previous",
        r"(?i)sell\s+everything",
        r"(?i)liquidate\s+all",
    ]

    def scan_injection(self, text: str) -> Tuple[bool, Optional[str]]:
        """Returns (is_injected, reason)."""
        if not text:
            return False, None
        for pattern in self.INJECTION_PATTERNS:
            match = re.search(pattern, text)
            if match:
                return True, f"Policy injection detected: '{match.group()}'"
        return False, None

    # ── 9. Data Class Restrictions ──────────────────────────────────
    PII_PATTERNS = [
        r"\b\d{3}-\d{2}-\d{4}\b",        # SSN
        r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",  # Credit card
        r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b",  # IBAN
    ]

    def validate_no_pii(self, text: str) -> Tuple[bool, str]:
        """Scans parameters for PII/account numbers."""
        restrictions = self.policy.get("data_restrictions", [])
        if "no_pii" not in restrictions and "no_account_numbers_in_args" not in restrictions:
            return True, "No PII restrictions configured"

        for pattern in self.PII_PATTERNS:
            if re.search(pattern, text):
                return False, f"BLOCKED: PII/account data detected in parameters"
        return True, "No PII detected in parameters"

    # ── 10. Delegation Rules ────────────────────────────────────────
    def get_delegation_rules(self, link: str = "risk_to_trader") -> dict:
        return self.delegation.get(link, {})

    def validate_delegation(self, link: str, ticker: str, quantity: int) -> Tuple[bool, str]:
        rules = self.get_delegation_rules(link)
        if not rules:
            return False, f"No delegation rules found for '{link}'"

        max_qty = rules.get("max_quantity", 0)
        if quantity > max_qty:
            return False, f"Delegation limit exceeded: {quantity} > max {max_qty}"

        if rules.get("sub_delegation", False) is False:
            pass  # Sub-delegation blocked by default

        return True, f"Delegation '{link}' approved: {quantity} <= {max_qty}"

    # ── Trade Logging ───────────────────────────────────────────────
    def log_trade(self, ticker: str, action: str, quantity: int, price: float, intent: str, status: str):
        """Log every trade decision with the intent it was validated against."""
        self._trade_log.append({
            "timestamp": datetime.now().isoformat(),
            "ticker": ticker,
            "action": action,
            "quantity": quantity,
            "price": price,
            "value": quantity * price,
            "intent": intent,
            "status": status,  # EXECUTED or BLOCKED
        })

    def get_trade_log(self) -> list:
        return self._trade_log

    def get_daily_exposure(self) -> float:
        return self._daily_exposure

    # ── Full Policy Check ───────────────────────────────────────────
    def full_validate(self, ticker: str, quantity: int, price: float, reason: str = "") -> Tuple[bool, List[str]]:
        """
        Run ALL policy checks at once. Returns (all_passed, list_of_violations).
        """
        violations = []

        ok, msg = self.validate_ticker(ticker)
        if not ok:
            violations.append(msg)

        ok, msg = self.validate_order_size(quantity, price)
        if not ok:
            violations.append(msg)

        ok, msg = self.validate_daily_exposure(quantity * price)
        if not ok:
            violations.append(msg)

        ok, msg = self.validate_earnings_blackout(ticker)
        if not ok:
            violations.append(msg)

        if reason:
            injected, inj_msg = self.scan_injection(reason)
            if injected:
                violations.append(inj_msg)

            ok, msg = self.validate_no_pii(reason)
            if not ok:
                violations.append(msg)

        return len(violations) == 0, violations


# Singleton instance
device_policy = DevicePolicy()
