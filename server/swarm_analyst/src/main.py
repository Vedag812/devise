from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from src.agents.scanner import scan_context
from src.core.engine import run_simulation
from src.services.generator import generate_swarm_composition
from src.agents.aggregator import aggregate_results
from src.core.models import SwarmReport, SwarmResponse, SwarmRequest, AnalystResult, ScanResult, HistoryItem
from src.core.ws_manager import manager
from src.core.history import save_report, get_history
from src.agents.macro_scanner import get_macro_signals
from src.utils.logger import get_logger

logger = get_logger("swarm.main")

app = FastAPI(title="DEVISE // SWARM_ANALYST_CORE_V4_AUTONOMOUS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/v1/history")
async def fetch_history():
    return get_history()

@app.get("/v1/macro/signals")
async def fetch_macro_signals():
    from src.core.market import get_popular_stocks
    stocks = get_popular_stocks()[:5]
    tickers = [s['symbol'] for s in stocks]
    return await get_macro_signals(tickers)

@app.get("/v1/stocks")
def list_stocks():
    from src.core.market import get_popular_stocks
    return get_popular_stocks()

@app.post("/v1/simulation/launch")
async def launch_simulation(request: SwarmRequest):
    """
    Standalone API for MiroFish Simulation Workflow.
    """
    try:
        # Step 1: Genesis
        personas = await generate_swarm_composition(request.seed, request.goal)
        
        # Step 2: Simulation
        results = await run_simulation(personas, request.seed, request.goal)
        
        # Step 3: Aggregate
        report = await aggregate_results(results)
        
        # Step 4: Persist
        save_report(report)
        
        return SwarmResponse(
            step_01_scan=ScanResult(
                relevant_sectors=[p.role for p in personas],
                reasoning=f"Scenario architected for: {request.goal}",
                seed_summary=request.seed[:200]
            ),
            step_02_analysts=results,
            step_03_report=report
        )
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/swarm")
async def swarm_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            mode = data.get("mode", "STOCK_SCAN") # STOCK_SCAN or SIMULATION
            ticker = data.get("ticker", "N/A")
            seed = data.get("seed", "")
            goal = data.get("goal", "Analyze for potential catalysts.")
            
            await manager.broadcast({
                "type": "STATUS",
                "message": f"INITIALIZING_{mode}_FOR_{goal[:20]}..."
            })

            # Phase 1: Genesis / Scan
            if mode == "SIMULATION":
                await manager.broadcast({"type": "STATUS", "message": "ARCHITECTING_DYNAMIC_SWARM..."})
                personas = await generate_swarm_composition(seed, goal)
                scan_result = ScanResult(
                    relevant_sectors=[p.role for p in personas],
                    reasoning=f"Genesis Engine architected {len(personas)} specialized nodes.",
                    seed_summary=seed[:200],
                    ticker=ticker
                )
            else:
                scan_result = await scan_context(seed=seed, ticker=ticker)
                # For STOCK_SCAN, we still use the old-school personas or generate them?
                # Let's upgrade EVERYTHING to dynamic for V4.
                personas = await generate_swarm_composition(seed or f"Analyze {ticker}", goal)

            await manager.broadcast({
                "type": "SCAN_COMPLETE",
                "data": scan_result.model_dump()
            })

            # Phase 2: Simulation / Swarm
            async def broadcast_analyst(result: AnalystResult):
                await manager.broadcast({
                    "type": "ANALYST_RESULT",
                    "data": result.model_dump()
                })

            analyst_results = await run_simulation(
                personas, 
                seed or ticker, 
                goal, 
                on_result=broadcast_analyst
            )

            # Phase 3: Aggregate
            await manager.broadcast({"type": "STATUS", "message": "SYNTHESIZING_FINAL_REPORT..."})
            final_report = await aggregate_results(analyst_results)
            final_report.ticker = ticker

            save_report(final_report)

            await manager.broadcast({
                "type": "REPORT_COMPLETE",
                "data": final_report.model_dump()
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WS Error: {e}")
        await manager.broadcast({"type": "ERROR", "message": str(e)})
        manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {"status": "ONLINE", "version": "0.4.0_AUTONOMOUS"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
