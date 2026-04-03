import os
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
    try:
        from supabase import create_client, Client
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
else:
    print("WARNING: Supabase credentials not found or are default. Ensure SUPABASE_URL and SUPABASE_KEY are set for real logging.")

def log_device_event(agent: str, action: str, target: str, status: str, reason: str = "") -> Optional[Dict[Any, Any]]:
    """
    Logs an enforcement event to the Supabase `device_logs` table.
    
    status: 'ALLOWED' or 'BLOCKED'
    agent: 'analyst', 'risk', or 'trader'
    """
    log_entry = {
        "timestamp": int(time.time()),
        "agent": agent,
        "action": action,
        "target": target,
        "status": status,
        "reason": reason
    }
    
    if supabase_client:
        try:
            response = supabase_client.table("device_logs").insert(log_entry).execute()
            return response.data
        except Exception as e:
            print(f"[Supabase Log Error] {e}")
            
    # Fallback to local printing if no supabase
    color = "\033[92m" if status == "ALLOWED" else "\033[91m"
    reset = "\033[0m"
    icon = "✓" if status == "ALLOWED" else "✗"
    
    print(f"[{time.strftime('%H:%M:%S')}] {color}{icon} {status:<8}{reset} | {agent:<8} | {action:<18} | {target:<12} | rule: {reason}")
    return log_entry
