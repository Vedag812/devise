import os
import time
import hmac
import hashlib
import uuid
import json
from typing import Dict, Any, Optional

# In a real setup, this comes from an env var / secure store
SECRET_KEY = os.getenv("DEVICE_SECRET_KEY", "armorclaw-hackathon-secret").encode("utf-8")

# In-memory store for spent tokens to prevent replay attacks
SPENT_TOKENS = set()

def sign_token(token_body: Dict[str, Any]) -> str:
    """Signs a token body using HMAC-SHA256."""
    message = json.dumps(token_body, sort_keys=True).encode("utf-8")
    signature = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()
    return signature

def issue_device_token(issued_to: str, ticker: str, side: str, max_quantity: int, ttl_minutes: int = 15, sub_delegation: bool = False) -> Dict[str, Any]:
    """
    Issued by Risk Agent to Trader Agent.
    """
    token_id = str(uuid.uuid4())
    expires_at = int(time.time()) + (ttl_minutes * 60)
    
    token_body = {
        "issued_to": issued_to,
        "ticker": ticker,
        "side": side,
        "max_quantity": max_quantity,
        "expires_at": expires_at,
        "sub_delegation": sub_delegation,
        "token_id": token_id
    }
    
    signature = sign_token(token_body)
    
    token = token_body.copy()
    token["hmac"] = signature
    return token

def verify_device_token(token: Dict[str, Any], requested_ticker: str, requested_quantity: int) -> tuple[bool, Optional[str]]:
    """
    Verifies the DeviceToken on Trader action.
    Returns (is_valid, error_reason)
    """
    if "hmac" not in token:
        return False, "Missing HMAC signature"
        
    signature = token.pop("hmac")
    expected_signature = sign_token(token)
    
    # 1. Check Signature
    if not hmac.compare_digest(signature, expected_signature):
        return False, "Invalid HMAC signature"
        
    # 2. Check Expiration
    if int(time.time()) > token.get("expires_at", 0):
        return False, "Token expired"
        
    # 3. Check Replay Protection
    token_id = token.get("token_id")
    if token_id in SPENT_TOKENS:
        return False, "Token already spent (Replay-Protection)"
        
    # 4. Check Context Constraints (Ticker)
    if token.get("ticker") != requested_ticker:
        return False, f"Ticker mismatch: expected {token.get('ticker')}, got {requested_ticker}"
        
    # 5. Check Context Constraints (Quantity)
    if requested_quantity > token.get("max_quantity", 0):
        return False, f"Quantity exceeded: max {token.get('max_quantity')}, requested {requested_quantity}"

    # Valid token — mark spent immediately (one-shot execution token).
    # ArmorClaw clears the call at gateway level first; Device replay-protection fires here.
    SPENT_TOKENS.add(token_id)
    return True, None

def mark_token_spent(token_id: str):
    """Mark a token as spent to prevent replay attacks after execution."""
    SPENT_TOKENS.add(token_id)
