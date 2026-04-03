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

// Retry wrapper for Render cold starts (free tier wakes up in ~30s)
export async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) })
            if (res.ok) return res
            // Server returned error - retry
        } catch {
            // Network error or timeout - server likely waking up
        }
        if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 3000 * (i + 1))) // 3s, 6s backoff
        }
    }
    // Final attempt without timeout
    return fetch(url, options)
}
