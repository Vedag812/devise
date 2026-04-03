import os
import requests
from typing import Dict, Any

ALPACA_API_KEY = os.getenv("ALPACA_API_KEY", "")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY", "")
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")

def execute_trade(ticker: str, side: str, quantity: int) -> Dict[str, Any]:
    """
    Executes a paper trade via Alpaca API using the provided constraints.
    Called exclusively by the Trader Agent.
    """
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        return {"error": "ALPACA_API_KEY or ALPACA_SECRET_KEY is not set."}
        
    url = f"{ALPACA_BASE_URL}/v2/orders"
    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
        "accept": "application/json",
        "content-type": "application/json"
    }
    
    payload = {
        "symbol": ticker,
        "qty": quantity,
        "side": side.lower(),
        "type": "market",
        "time_in_force": "gtc"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ALPCA ERROR] Failed to place order: {e}")
        return {"error": str(e)}

def get_current_price(ticker: str) -> float:
    """
    Fetches the actual latest trade price for a ticker from Alpaca Data API.
    """
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise ValueError("ALPACA_API_KEY or ALPACA_SECRET_KEY is not set.")
        
    url = f"https://data.alpaca.markets/v2/stocks/{ticker}/trades/latest"
    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
        "accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    trade = response.json().get("trade", {})
    price = trade.get("p", 0.0)
    
    if price == 0.0:
        raise ValueError(f"Could not fetch valid price for {ticker}.")
        
    return price

