// API configuration - uses Vite env variable or falls back to localhost
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"
const WS_BASE = API_BASE.replace("https://", "wss://").replace("http://", "ws://")

export const API = {
    base: API_BASE,
    ws: `${WS_BASE}/ws/pipeline`,
    stocks: `${API_BASE}/v1/stocks`,
    policy: `${API_BASE}/v1/policy`,
    portfolio: `${API_BASE}/v1/portfolio`,
    audit: `${API_BASE}/v1/audit/trail`,
    orders: `${API_BASE}/v1/orders`,
    stats: `${API_BASE}/v1/stats`,
    pipelineRun: `${API_BASE}/v1/pipeline/run`,
    pipelineAttack: `${API_BASE}/v1/pipeline/attack`,
}
