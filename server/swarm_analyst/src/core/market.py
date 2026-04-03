import yfinance as yf
from typing import Dict, Any, List
import json
import os

def get_market_context(ticker_symbol: str) -> Dict[str, Any]:
    """
    Fetches real-time price data and recent news for a given ticker.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        
        # Get Price Info
        info = ticker.info
        current_price = info.get('currentPrice') or info.get('regularMarketPrice')
        prev_close = info.get('previousClose')
        
        change_pct = 0
        if current_price and prev_close:
            change_pct = ((current_price - prev_close) / prev_close) * 100
            
        # Get News Headlines
        news = ticker.news
        news_snippets = []
        for item in news[:5]: # Top 5 recent items
            title = item.get('title', 'NO_TITLE')
            publisher = item.get('publisher', 'UNKNOWN')
            news_snippets.append(f"[{publisher}] {title}")
            
        news_str = "\n".join(news_snippets) if news_snippets else "No recent news available for this ticker."
        
        return {
            "ticker": ticker_symbol,
            "price": current_price,
            "change_pct": round(change_pct, 2),
            "currency": info.get('currency', 'USD'),
            "news_context": news_str,
            "status": "ONLINE"
        }
    except Exception as e:
        return {
            "ticker": ticker_symbol,
            "status": "ERROR",
            "error": str(e),
            "news_context": "ERROR_FETCHING_MARKET_DATA"
        }

def get_popular_stocks() -> List[Dict[str, str]]:
    """
    Reads the list of 25 popular stocks from the data file.
    """
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'stocks.json')
    try:
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception:
        return []

if __name__ == "__main__":
    # Test fetch
    print(get_market_context("NVDA"))
