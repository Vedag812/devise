import json
from typing import List, Dict
from src.core.config import get_genai_client, settings
from src.core.models import AnalystResult, SwarmReport

AGGREGATOR_PROMPT = """
You are the REPORT_AGENT for the DEVISE Swarm.
Your job is to read the results from a set of parallel sector analysts and generate a final weighted recommendation.

ANALYST_RESULTS:
{results}

CONSENSUS_GOAL: 
Synthesize the sector-specific verdicts into a coherent trade recommendation.
If the majority is BULLISH, recommend a BUY. If BEARISH, recommend a SELL. 

Return ONLY a JSON object with the following structure:
{{
  "ticker": "TARGET_TICKER",
  "action": "BUY/SELL/HOLD",
  "quantity": 25,
  "confidence_score": 0.0-1.0,
  "consensus_reasoning": "Briefly synthesize the analyst views into a final narrative",
  "analyst_summaries": [
    {{"sector": "SectorName", "verdict": "BULLISH", "reason": "..."}}
  ]
}}
"""

# Aggregator Logic utilizing modern GenAI SDK

async def aggregate_results(results: List[AnalystResult]) -> SwarmReport:
    """
    Synthesizes the parallel analyst outputs into a final consensus report.
    Uses the modern GenAI SDK.
    """
    try:
        results_json = [r.model_dump() for r in results]
        client = get_genai_client()
        
        response = client.models.generate_content(
            model=settings.DEFAULT_MODEL,
            contents=AGGREGATOR_PROMPT.format(results=json.dumps(results_json))
        )
        
        # Clean the response
        text = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(text)
        return SwarmReport(**data)
    except Exception as e:
        print(f"Error in Aggregator: {e}")
        # Fallback to a default report if LLM fails
        return SwarmReport(
            ticker="N/A",
            action="HOLD",
            quantity=0,
            confidence_score=0.5,
            consensus_reasoning=f"Consensus aggregation timeout or error: {str(e)}",
            analyst_summaries=[{"sector": r.sector, "verdict": r.verdict, "reason": r.reasoning} for r in results]
        )
