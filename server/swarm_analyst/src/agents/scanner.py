import json
from src.core.config import get_genai_client, settings
from src.core.market import get_market_context
from src.core.models import ScanResult
from typing import Optional, Dict, Any

SCANNER_PROMPT = """
You are the CONTEXT_SCANNER for the DEVISE Swarm. 
Your job is to read a raw financial news seed (or market context for a ticker) and identify which of the following 6 sectors are MOST relevant to the current signal:
- Semiconductors
- Energy
- Tech
- Banking
- Healthcare
- Geopolitics

IDENTIFY SECTORS based on the primary drivers mentioned in the news. 

Return ONLY a JSON object with the following structure:
{
  "relevant_sectors": ["Sector1", "Sector2"],
  "reasoning": "Brief explanation of why these sectors are active",
  "seed_summary": "1-sentence summary of the main news catalyst"
}

CONTEXT_TO_ANALYZE:
{context}
"""

async def scan_context(seed: Optional[str] = None, ticker: Optional[str] = None) -> ScanResult:
    """
    Analyzes the news seed or ticker data and identifies the relevant sectors.
    Uses the modern GenAI SDK.
    """
    market_data = None
    context_text = seed or ""
    
    if ticker:
        # Fetch real-time data
        market_data = get_market_context(ticker)
        # Combine price info and news for the LLM
        context_text = f"TICKER: {ticker}\nPRICE: {market_data.get('price')} ({market_data.get('change_pct')}%)\n\nNEWS:\n{market_data.get('news_context')}"
        if seed:
            context_text = f"{seed}\n\n---\n{context_text}"

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model=settings.DEFAULT_MODEL,
            contents=SCANNER_PROMPT.format(context=context_text)
        )
        # Clean the response
        text = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(text)
        
        return ScanResult(
            **data,
            ticker=ticker,
            market_data=market_data
        )
    except Exception as e:
        print(f"Error in ContextScanner: {e}")
        return ScanResult(
            relevant_sectors=["Semiconductors", "Tech"],
            reasoning=f"Fallback due to processing error: {str(e)}",
            seed_summary="Analysis error.",
            ticker=ticker,
            market_data=market_data
        )
