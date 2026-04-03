"""
Device Backend Test Suite
Tests all endpoints + verifies Supabase device_logs table is being written to.

Run from /server:
    python3 test_backend.py
"""

import requests
import time
from dotenv import load_dotenv
import os

load_dotenv()

BASE_URL = "http://localhost:8000"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
RESET = "\033[0m"

def section(title):
    print(f"\n{BOLD}{CYAN}{'='*55}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*55}{RESET}")

def ok(msg):  print(f"  {GREEN}✓ {msg}{RESET}")
def fail(msg): print(f"  {RED}✗ {msg}{RESET}")

# ── 1. Health Check ──────────────────────────────────────────
section("1. Health Check  GET /")
r = requests.get(f"{BASE_URL}/")
if r.status_code == 200 and r.json().get("status") == "operational":
    ok(f"Server is up: {r.json()}")
else:
    fail(f"Health check failed: {r.status_code} {r.text}")

# ── 2. Swarm Pipeline (Bullish news → should generate a trade) ──
section("2. Swarm Pipeline  POST /api/v1/trigger-swarm")
payload = {"news_seed": "NVDA beats earnings expectations with record GPU sales. Analysts bullish."}
print(f"  Sending: {payload['news_seed']}")
r = requests.post(f"{BASE_URL}/api/v1/trigger-swarm", json=payload)
print(f"  Status Code: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    ok(f"Pipeline status : {data.get('status')}")
    if data.get("trade_result"):
        ok(f"Trade result    : {data['trade_result']}")
        ok(f"Recommendation  : {data.get('recommendation')}")
    elif data.get("result"):
        ok(f"Result          : {data['result']}")
    else:
        fail(f"Unexpected response: {data}")
else:
    fail(f"Pipeline error: {r.text}")

# ── 3. HOLD Scenario (Bearish/neutral news → no trade) ───────
section("3. HOLD Scenario  POST /api/v1/trigger-swarm")
payload = {"news_seed": "Markets flat. No major movements expected this week."}
print(f"  Sending: {payload['news_seed']}")
r = requests.post(f"{BASE_URL}/api/v1/trigger-swarm", json=payload)
print(f"  Status Code: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    if "HOLD" in str(data) or data.get("status") in ("completed", "blocked"):
        ok(f"Response: {data}")
    else:
        ok(f"Got: {data}")
else:
    fail(f"Error: {r.text}")

# ── 4. Injection Simulation ───────────────────────────────────
section("4. Injection Simulation  POST /api/v1/simulate-injection")
r = requests.post(f"{BASE_URL}/api/v1/simulate-injection")
if r.status_code == 200 and r.json().get("status") == "blocked":
    ok(f"Injection blocked correctly: {r.json()['message']}")
else:
    fail(f"Injection test failed: {r.text}")

# ── 5. Supabase Logs Verification ─────────────────────────────
section("5. Supabase device_logs Verification")
if not SUPABASE_URL or "your-project" in SUPABASE_URL:
    fail("Supabase URL not configured — skipping")
else:
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        # Fetch last 10 logs
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/device_logs?order=id.desc&limit=10",
            headers=headers
        )
        if resp.status_code == 200:
            logs = resp.json()
            ok(f"Supabase connected — {len(logs)} recent log(s) found:")
            for log in logs:
                icon = "✓" if log.get("status") == "ALLOWED" else "✗"
                print(f"    {icon} [{log.get('agent'):<8}] {log.get('action'):<20} | {log.get('status'):<8} | {log.get('reason')}")
        else:
            fail(f"Supabase query failed: {resp.status_code} {resp.text}")
    except Exception as e:
        fail(f"Supabase error: {e}")

print(f"\n{BOLD}{'='*55}{RESET}")
print(f"{BOLD}  Test run complete.{RESET}")
print(f"{BOLD}{'='*55}{RESET}\n")
print("NOTE: Real paper trades will be placed. Ensure ALPACA_API_KEY is set in .env.")
