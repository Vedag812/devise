import json
import os
from datetime import datetime
from uuid import uuid4
from typing import List
from src.core.models import SwarmReport, HistoryItem

HISTORY_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'history.json')

def ensure_data_dir():
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    if not os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'w') as f:
            json.dump([], f)

def save_report(report: SwarmReport) -> HistoryItem:
    """
    Saves a final SwarmReport to the local history file.
    """
    ensure_data_dir()
    
    history_item = HistoryItem(
        id=str(uuid4())[:8],
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        report=report
    )
    
    try:
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        history = []
        
    history.insert(0, history_item.model_dump())
    
    # Keep only last 50 runs to prevent file bloat
    history = history[:50]
    
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)
        
    return history_item

def get_history() -> List[HistoryItem]:
    """
    Retrieves all saved swarm reports.
    """
    ensure_data_dir()
    try:
        with open(HISTORY_FILE, 'r') as f:
            data = json.load(f)
            return [HistoryItem(**item) for item in data]
    except Exception:
        return []
