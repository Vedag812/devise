from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalystResult(BaseModel):
    sector: str
    verdict: str  # BULLISH, BEARISH, NEUTRAL
    confidence: float
    reasoning: str
    thought: Optional[str] = None # Internal monologue

class SwarmReport(BaseModel):
    ticker: str
    action: str  # BUY, SELL, HOLD
    quantity: int
    confidence_score: float
    consensus_reasoning: str
    analyst_summaries: List[Dict[str, str]]

class ScanResult(BaseModel):
    relevant_sectors: List[str]
    reasoning: str
    seed_summary: str
    ticker: Optional[str] = None
    market_data: Optional[Dict[str, Any]] = None

class MacroSignal(BaseModel):
    ticker: str
    reasoning: str
    priority: str # HIGH, MEDIUM, LOW

class HistoryItem(BaseModel):
    id: str
    timestamp: str
    report: SwarmReport

class SwarmRequest(BaseModel):
    ticker: Optional[str] = "N/A"
    seed: str
    goal: str
    rounds: Optional[int] = 1

class SwarmResponse(BaseModel):
    step_01_scan: ScanResult
    step_02_analysts: List[AnalystResult]
    step_03_report: SwarmReport
