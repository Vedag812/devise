import yfinance as yf

def fetch_ticker_data(ticker: str) -> dict:
    """
    Fetches basic market data and the most recent news for a given ticker using yfinance.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Extract relevant fields
        current_price = info.get('currentPrice', 0.0)
        previous_close = info.get('previousClose', 0.0)
        volume = info.get('volume', 0)
        market_cap = info.get('marketCap', 0)
        
        # We also want simple recent news titles if available
        news = stock.news
        headlines = [n.get('title', '') for n in news[:3]] if news else []

        return {
            "ticker": ticker,
            "current_price": current_price,
            "previous_close": previous_close,
            "volume": volume,
            "market_cap": market_cap,
            "recent_news": headlines
        }
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return {}

def fetch_universe_data(tickers: list[str]) -> dict:
    return {ticker: fetch_ticker_data(ticker) for ticker in tickers}
