from pydantic import BaseModel
from typing import Dict, Any

class AnalystResult(BaseModel):
    sector: str
    verdict: str  # BULLISH, BEARISH, NEUTRAL
    confidence: float
    reasoning: str

ANALYST_PERSONAS: Dict[str, Dict[str, Any]] = {
    "Semiconductors": {
        "lens": "Supply Chain & AI Hardware Infrastructure",
        "prompt": """
        ROLE: SENIOR_ANALYST for the DEVISE Swarm.
        SECTOR: Semiconductors
        GOAL: Read the news seed and ticker context to provide a BULLISH, BEARISH, or NEUTRAL verdict.
        
        CONTEXT:
        TICKER: {ticker}
        DATA: {seed}
        
        REASONING_PROTOCOL:
        1. Start with an internal monologue inside <thought> tags. 
        2. Analyze catalysts, technical setup, and sector risks.
        3. End with the JSON verdict.
        
        Return JSON structure:
        {{
            "sector": "Semiconductors",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence summary for the report",
            "thought": "Your internal monologue from above"
        }}
        """
    },
    "Energy": {
        "lens": "Power Demand, Grid Infrastructure & Input Costs",
        "prompt": """
        ROLE: SENIOR_ANALYST for the DEVISE Swarm.
        SECTOR: Energy
        GOAL: Read the news seed and ticker context to provide a BULLISH, BEARISH, or NEUTRAL verdict.
        
        CONTEXT:
        TICKER: {ticker}
        DATA: {seed}
        
        Return JSON structure:
        {{
            "sector": "Energy",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence technical reasoning"
        }}
        """
    },
    "Tech": {
        "lens": "Cloud Growth, SaaS Margins & Enterprise AI Adoption",
        "prompt": """
        ROLE: SENIOR_ANALYST for the DEVISE Swarm.
        SECTOR: Tech
        GOAL: Read the news seed and ticker context to provide a BULLISH, BEARISH, or NEUTRAL verdict.
        
        CONTEXT:
        TICKER: {ticker}
        DATA: {seed}
        
        Return JSON structure:
        {{
            "sector": "Tech",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence technical reasoning"
        }}
        """
    },
    "Banking": {
        "lens": "Interest Rate Environment & Institutional Capital Flows",
        "prompt": """
        ROLE: SENIOR_ANALYST for the DEVISE Swarm.
        SECTOR: Banking
        GOAL: Read the news seed and ticker context to provide a BULLISH, BEARISH, or NEUTRAL verdict.
        
        CONTEXT:
        TICKER: {ticker}
        DATA: {seed}
        
        Return JSON structure:
        {{
            "sector": "Banking",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence technical reasoning"
        }}
        """
    },
    "Healthcare": {
        "lens": "Regulatory Pipelines, Biotech funding & Defense",
        "prompt": """
        ROLE: SENIOR_ANALYST for the DEVISE Swarm.
        SECTOR: Healthcare
        GOAL: Read the news seed and ticker context to provide a BULLISH, BEARISH, or NEUTRAL verdict.
        
        CONTEXT:
        TICKER: {ticker}
        DATA: {seed}
        
        Return JSON structure:
        {{
            "sector": "Healthcare",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence technical reasoning"
        }}
        """
    },
    "Geopolitics": {
        "lens": "Trade Defense, Export Controls & Supply Chain Risk",
        "prompt": """
        ROLE: SENIOR_ANALYST for the DEVISE Swarm.
        SECTOR: Geopolitics
        GOAL: Read the news seed and ticker context to provide a BULLISH, BEARISH, or NEUTRAL verdict.
        
        CONTEXT:
        TICKER: {ticker}
        DATA: {seed}
        
        Return JSON structure:
        {{
            "sector": "Geopolitics",
            "verdict": "BULLISH/BEARISH/NEUTRAL",
            "confidence": 0.0-1.0,
            "reasoning": "1-sentence technical reasoning"
        }}
        """
    }
}

