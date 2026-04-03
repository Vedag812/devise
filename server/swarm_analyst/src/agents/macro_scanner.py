import asyncio
import json
from typing import List
from src.core.config import get_genai_client, settings
from src.core.market import get_market_context
from src.core.models import MacroSignal

MACRO_PROMPT = """
You are the MACRO_STRATEGIST for the DEVISE Swarm.
Your job is to read news summaries for multiple tickers and identify the most "Active" signals.

CONTEXT_DATA:
{context}

GOAL:
Identify 1-3 high-impact signals. Rank them as HIGH, MEDIUM, or LOW priority.
Priority is based on volatility catalysts (earnings, litigation, M&A).

Return ONLY a JSON array:
[
  {{"ticker": "Symbol", "reasoning": "Brief explanation", "priority": "HIGH/MEDIUM/LOW"}}
]
"""

async def get_macro_signals(tickers: List[str]) -> List[MacroSignal]:
    """
    Scans multiple tickers in parallel to find the "hottest" signals.
    """
    try:
        # 1. Parallel Fetch News/Price
        tasks = [asyncio.to_thread(get_market_context, t) for t in tickers]
        contexts = await asyncio.gather(*tasks)
        
        # 2. Aggregate Context for LLM
        context_str = ""
        for c in contexts:
            context_str += f"TICKER: {c['ticker']}\nNEWS: {c['news_context']}\n---\n"
            
        client = get_genai_client()
        response = client.models.generate_content(
            model=settings.DEFAULT_MODEL,
            contents=MACRO_PROMPT.format(context=context_str)
        )
        
        text = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(text)
        
        return [MacroSignal(**item) for item in data]
    except Exception as e:
        print(f"Error in MacroScanner: {e}")
        return []
