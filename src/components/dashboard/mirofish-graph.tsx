"use client"
import * as React from "react"
import { RefreshCw, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { API, fetchWithRetry } from "@/lib/api"

/* ════════════════════════════════════════════════════════════
   MiroFish Graph — Entity Relationship Visualization
   Force-directed graph showing agents, tickers, sectors
   and their simulation connections
   ════════════════════════════════════════════════════════════ */

interface GraphNode {
    id: string
    type: "entity" | "organization" | "person"
    label: string
    group: string
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    sentiment?: number // -1 to 1
    confidence?: number
    details?: Record<string, any>
}

interface GraphEdge {
    source: string
    target: string
    type: string
    strength: number
}

// Entity graph data — matches our mirofish_engine.py ENTITY_GRAPH
function buildGraphData(simData?: any): { nodes: GraphNode[], edges: GraphEdge[] } {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const W = 900, H = 600

    // ── Company nodes (Entity — red) ──
    const companies = [
        { id: "NVDA", label: "NVIDIA", sector: "Semiconductors", cap: "large" },
        { id: "AAPL", label: "Apple Inc", sector: "Consumer Tech", cap: "mega" },
        { id: "MSFT", label: "Microsoft", sector: "Enterprise Tech", cap: "mega" },
        { id: "TSLA", label: "Tesla Inc", sector: "EV/Energy", cap: "large" },
        { id: "AMD", label: "AMD", sector: "Semiconductors", cap: "large" },
        { id: "GOOGL", label: "Alphabet", sector: "Enterprise Tech", cap: "mega" },
    ]
    companies.forEach((c, i) => {
        const angle = (i / companies.length) * Math.PI * 2
        const r = 120
        nodes.push({
            id: c.id, type: "entity", label: c.label, group: c.sector,
            x: W/2 + Math.cos(angle) * r + Math.random() * 40,
            y: H/2 + Math.sin(angle) * r + Math.random() * 40,
            vx: 0, vy: 0, radius: c.cap === "mega" ? 18 : 14,
            details: { sector: c.sector, market_cap: c.cap },
        })
    })

    // ── Sector nodes (Organization — blue) ──
    const sectors = [
        { id: "sec_semi", label: "Semiconductors", ai: 0.95 },
        { id: "sec_consumer", label: "Consumer Tech", ai: 0.60 },
        { id: "sec_enterprise", label: "Enterprise Tech", ai: 0.80 },
        { id: "sec_ev", label: "EV/Energy", ai: 0.30 },
    ]
    sectors.forEach((s, i) => {
        const angle = (i / sectors.length) * Math.PI * 2 + 0.4
        const r = 220
        nodes.push({
            id: s.id, type: "organization", label: s.label, group: "Sector",
            x: W/2 + Math.cos(angle) * r + Math.random() * 30,
            y: H/2 + Math.sin(angle) * r + Math.random() * 30,
            vx: 0, vy: 0, radius: 12,
            details: { ai_sensitivity: s.ai },
        })
    })

    // ── Agent nodes (Person — gray/small) from simulation ──
    const agentTypes = [
        { type: "retail", count: 3, label: "Retail" },
        { type: "institutional", count: 3, label: "Institutional" },
        { type: "hedge_fund", count: 3, label: "Hedge Fund" },
        { type: "analyst", count: 3, label: "Analyst" },
        { type: "media", count: 3, label: "Media" },
    ]
    let agentIdx = 0
    agentTypes.forEach((at) => {
        for (let i = 0; i < at.count; i++) {
            const angle = ((agentIdx) / 15) * Math.PI * 2
            const r = 250 + Math.random() * 40
            const sentiment = simData?.agent_breakdown?.[
                at.type === "retail" ? "RetailTraders" :
                at.type === "institutional" ? "Institutional" :
                at.type === "hedge_fund" ? "HedgeFunds" :
                at.type === "analyst" ? "Analysts" : "MediaSentiment"
            ]
            nodes.push({
                id: `agent_${at.type}_${i}`, type: "person",
                label: `${at.label} ${i+1}`, group: at.type,
                x: W/2 + Math.cos(angle) * r,
                y: H/2 + Math.sin(angle) * r,
                vx: 0, vy: 0, radius: 5,
                sentiment: sentiment?.confidence ? (sentiment.verdict === "bullish" ? 0.6 : sentiment.verdict === "bearish" ? -0.6 : 0) : 0,
                confidence: sentiment?.confidence || 0.5,
            })
            agentIdx++
        }
    })

    // ── Macro factor nodes ──
    const macros = [
        { id: "macro_rates", label: "Interest Rates", dir: "stable" },
        { id: "macro_inflation", label: "Inflation", dir: "declining" },
        { id: "macro_ai", label: "AI Spending", dir: "accelerating" },
        { id: "macro_geo", label: "Geopolitics", dir: "uncertain" },
    ]
    macros.forEach((m, i) => {
        const angle = (i / macros.length) * Math.PI * 2 + 1.2
        const r = 180
        nodes.push({
            id: m.id, type: "organization", label: m.label, group: "Macro",
            x: W/2 + Math.cos(angle) * r,
            y: H/2 + Math.sin(angle) * r,
            vx: 0, vy: 0, radius: 10,
            details: { direction: m.dir },
        })
    })

    // ── Edges: Company relationships ──
    const rels: [string, string, string][] = [
        ["NVDA", "AAPL", "customer"], ["NVDA", "MSFT", "partner"],
        ["NVDA", "AMD", "competitor"], ["AAPL", "MSFT", "competitor"],
        ["AAPL", "GOOGL", "competitor"], ["MSFT", "GOOGL", "competitor"],
        ["TSLA", "NVDA", "customer"],
    ]
    rels.forEach(([s, t, type]) => edges.push({ source: s, target: t, type, strength: 0.5 }))

    // ── Edges: Company → Sector ──
    const secMap: Record<string, string> = {
        NVDA: "sec_semi", AMD: "sec_semi", AAPL: "sec_consumer",
        MSFT: "sec_enterprise", GOOGL: "sec_enterprise", TSLA: "sec_ev"
    }
    Object.entries(secMap).forEach(([c, s]) => edges.push({ source: c, target: s, type: "belongs_to", strength: 0.3 }))

    // ── Edges: Sector → Macro ──
    edges.push({ source: "sec_semi", target: "macro_ai", type: "sensitive_to", strength: 0.8 })
    edges.push({ source: "sec_semi", target: "macro_rates", type: "sensitive_to", strength: 0.4 })
    edges.push({ source: "sec_ev", target: "macro_rates", type: "sensitive_to", strength: 0.6 })
    edges.push({ source: "sec_enterprise", target: "macro_ai", type: "sensitive_to", strength: 0.7 })

    // ── Edges: Agents → Companies (observation links) ──
    const targetTickers = ["NVDA", "AAPL", "MSFT"]
    agentTypes.forEach(at => {
        for (let i = 0; i < at.count; i++) {
            const target = targetTickers[i % targetTickers.length]
            edges.push({ source: `agent_${at.type}_${i}`, target, type: "observes", strength: 0.15 })
        }
    })

    return { nodes, edges }
}

// ── Force simulation (simple spring layout) ──
function simulate(nodes: GraphNode[], edges: GraphEdge[], W: number, H: number) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j]
            let dx = b.x - a.x, dy = b.y - a.y
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
            const force = 800 / (dist * dist)
            const fx = (dx / dist) * force, fy = (dy / dist) * force
            a.vx -= fx; a.vy -= fy
            b.vx += fx; b.vy += fy
        }
    }

    // Attraction (edges)
    edges.forEach(e => {
        const a = nodeMap.get(e.source), b = nodeMap.get(e.target)
        if (!a || !b) return
        let dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const target_dist = e.type === "observes" ? 180 : 100
        const force = (dist - target_dist) * 0.003 * e.strength
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
    })

    // Center gravity
    nodes.forEach(n => {
        n.vx += (W/2 - n.x) * 0.001
        n.vy += (H/2 - n.y) * 0.001
    })

    // Apply velocity + damping
    nodes.forEach(n => {
        n.vx *= 0.85; n.vy *= 0.85
        n.x += n.vx; n.y += n.vy
        n.x = Math.max(20, Math.min(W - 20, n.x))
        n.y = Math.max(20, Math.min(H - 20, n.y))
    })
}

export function MiroFishGraph() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [nodes, setNodes] = React.useState<GraphNode[]>([])
    const [edges, setEdges] = React.useState<GraphEdge[]>([])
    const [selectedNode, setSelectedNode] = React.useState<GraphNode | null>(null)
    const [hoveredNode, setHoveredNode] = React.useState<GraphNode | null>(null)
    const [simData, setSimData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)
    const nodesRef = React.useRef(nodes)
    const edgesRef = React.useRef(edges)
    const W = 900, H = 600

    // Load sim data
    const runSim = () => {
        setLoading(true)
        fetchWithRetry(API.pipelineRun, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker: "NVDA", action: "BUY", quantity: 10, confidence: 0.8, reason: "NVDA strong Q4 earnings beat" })
        }).then(r => r.json()).then(d => {
            setSimData(d.stages?.[0])
            const { nodes: n, edges: e } = buildGraphData(d.stages?.[0])
            setNodes(n); setEdges(e)
            nodesRef.current = n; edgesRef.current = e
        }).catch(() => {
            const { nodes: n, edges: e } = buildGraphData()
            setNodes(n); setEdges(e)
            nodesRef.current = n; edgesRef.current = e
        }).finally(() => setLoading(false))
    }

    React.useEffect(() => {
        const { nodes: n, edges: e } = buildGraphData()
        setNodes(n); setEdges(e)
        nodesRef.current = n; edgesRef.current = e
    }, [])

    // Animation loop
    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animId: number
        let frame = 0

        const draw = () => {
            const ns = nodesRef.current
            const es = edgesRef.current
            if (ns.length === 0) { animId = requestAnimationFrame(draw); return }

            // Simulate physics
            if (frame < 300) simulate(ns, es, W, H)
            frame++

            ctx.clearRect(0, 0, W, H)

            // Background
            ctx.fillStyle = "#0a0e1a"
            ctx.fillRect(0, 0, W, H)

            // Grid
            ctx.strokeStyle = "rgba(255,255,255,0.02)"
            ctx.lineWidth = 1
            for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
            for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

            const nodeMap = new Map(ns.map(n => [n.id, n]))

            // Draw edges
            es.forEach(e => {
                const a = nodeMap.get(e.source), b = nodeMap.get(e.target)
                if (!a || !b) return
                ctx.beginPath()
                ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
                const alpha = e.type === "observes" ? 0.06 : e.type === "belongs_to" ? 0.12 : 0.2
                ctx.strokeStyle = e.type === "competitor" ? `rgba(239,68,68,${alpha})` :
                    e.type === "partner" ? `rgba(34,197,94,${alpha})` :
                    e.type === "sensitive_to" ? `rgba(251,191,36,${alpha})` :
                    `rgba(148,163,184,${alpha})`
                ctx.lineWidth = e.type === "observes" ? 0.5 : 1
                ctx.stroke()
            })

            // Draw nodes
            ns.forEach(n => {
                const isHovered = hoveredNode?.id === n.id
                const isSelected = selectedNode?.id === n.id

                // Glow
                if (n.type !== "person" || isHovered) {
                    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 3)
                    const glowColor = n.type === "entity" ? "239,68,68" : n.type === "organization" ? "59,130,246" : "148,163,184"
                    grad.addColorStop(0, `rgba(${glowColor},${isHovered ? 0.3 : 0.1})`)
                    grad.addColorStop(1, `rgba(${glowColor},0)`)
                    ctx.fillStyle = grad
                    ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * 3, 0, Math.PI * 2); ctx.fill()
                }

                // Node circle
                ctx.beginPath(); ctx.arc(n.x, n.y, isHovered ? n.radius * 1.5 : n.radius, 0, Math.PI * 2)
                ctx.fillStyle = n.type === "entity" ? (isSelected ? "#f87171" : "#ef4444") :
                    n.type === "organization" ? (isSelected ? "#60a5fa" : "#3b82f6") :
                    (n.sentiment && n.sentiment > 0 ? "#22c55e" : n.sentiment && n.sentiment < 0 ? "#ef4444" : "#64748b")
                ctx.fill()

                // Border
                if (isSelected || isHovered) {
                    ctx.strokeStyle = "white"
                    ctx.lineWidth = 2
                    ctx.stroke()
                }

                // Label (only for non-person nodes or hovered)
                if (n.type !== "person" || isHovered || isSelected) {
                    ctx.fillStyle = "rgba(255,255,255,0.8)"
                    ctx.font = n.type === "entity" ? "bold 9px Inter, sans-serif" : "8px Inter, sans-serif"
                    ctx.textAlign = "center"
                    ctx.fillText(n.type === "entity" ? n.id : n.label, n.x, n.y + n.radius + 12)
                }
            })

            // Title
            ctx.fillStyle = "rgba(255,255,255,0.6)"
            ctx.font = "bold 12px Inter, sans-serif"
            ctx.textAlign = "left"
            ctx.fillText("MIROFISH", 16, 24)
            ctx.fillStyle = "rgba(255,255,255,0.3)"
            ctx.font = "10px Inter, sans-serif"
            ctx.fillText("Graph Relationship Visualization", 16, 38)

            if (simData) {
                ctx.fillStyle = "rgba(255,255,255,0.2)"
                ctx.font = "9px Inter, sans-serif"
                ctx.textAlign = "right"
                const info = `Step 4/5  报告生成  • Completed`
                ctx.fillText(info, W - 16, 24)
            }

            // Legend
            const legendY = H - 50
            ctx.font = "bold 8px Inter, sans-serif"
            ctx.textAlign = "left"
            ctx.fillStyle = "#ef4444"; ctx.fillText("ENTITY TYPES", 16, legendY)
            const types = [["Entity", "#ef4444"], ["Organization", "#3b82f6"], ["Person", "#64748b"]]
            types.forEach(([label, color], i) => {
                const lx = 16 + i * 100
                ctx.fillStyle = color
                ctx.beginPath(); ctx.arc(lx + 4, legendY + 14, 4, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = "rgba(255,255,255,0.5)"
                ctx.font = "8px Inter, sans-serif"
                ctx.fillText(label, lx + 12, legendY + 17)
            })

            animId = requestAnimationFrame(draw)
        }

        draw()
        return () => cancelAnimationFrame(animId)
    }, [nodes.length, hoveredNode, selectedNode, simData])

    // Mouse interaction
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const mx = (e.clientX - rect.left) * (W / rect.width)
        const my = (e.clientY - rect.top) * (H / rect.height)

        let found: GraphNode | null = null
        for (const n of nodesRef.current) {
            const dx = n.x - mx, dy = n.y - my
            if (dx * dx + dy * dy < (n.radius + 8) * (n.radius + 8)) {
                found = n; break
            }
        }
        setHoveredNode(found)
        if (canvasRef.current) canvasRef.current.style.cursor = found ? "pointer" : "default"
    }

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const mx = (e.clientX - rect.left) * (W / rect.width)
        const my = (e.clientY - rect.top) * (H / rect.height)

        for (const n of nodesRef.current) {
            const dx = n.x - mx, dy = n.y - my
            if (dx * dx + dy * dy < (n.radius + 8) * (n.radius + 8)) {
                setSelectedNode(n); return
            }
        }
        setSelectedNode(null)
    }

    return (
        <div className="card p-0 overflow-hidden relative" style={{ background: "#0a0e1a" }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-white/80 font-bold text-xs tracking-wider">MIROFISH</span>
                    <div className="flex gap-4 text-[10px] text-white/30">
                        <span className="text-white/60 border-b border-white/40 pb-0.5">概述</span>
                        <span>关系</span>
                        <span>工作台</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/30">Step 4/5 报告生成</span>
                    <span className="text-[9px] text-emerald-400">• Completed</span>
                    <button onClick={runSim} className="text-white/30 hover:text-white/60 transition-all ml-2"
                        title="Run simulation">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={W} height={H}
                className="w-full"
                style={{ aspectRatio: `${W}/${H}` }}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            />

            {/* Node Detail Panel (like MiroFish screenshot) */}
            {selectedNode && (
                <div className="absolute top-12 right-4 w-56 bg-white rounded-xl shadow-xl p-4 z-10 text-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold">Node Details</h4>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold text-white",
                                selectedNode.type === "entity" ? "bg-red-500" :
                                selectedNode.type === "organization" ? "bg-blue-500" : "bg-gray-500"
                            )}>
                                {selectedNode.type === "entity" ? "Entity" : selectedNode.type === "organization" ? "Organization" : "Person"}
                            </span>
                            <button onClick={() => setSelectedNode(null)} className="text-gray-300 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-[11px]">
                        <div>
                            <div className="text-[9px] text-gray-400 uppercase">Name:</div>
                            <div className="font-semibold">{selectedNode.label}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-gray-400 uppercase">UUID:</div>
                            <div className="font-mono text-[9px] text-gray-500">{selectedNode.id}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-gray-400 uppercase">Group:</div>
                            <div>{selectedNode.group}</div>
                        </div>

                        {selectedNode.sentiment !== undefined && selectedNode.type === "person" && (
                            <div>
                                <div className="text-[9px] text-gray-400 uppercase">Sentiment:</div>
                                <div className={cn("font-semibold",
                                    selectedNode.sentiment > 0 ? "text-emerald-600" :
                                    selectedNode.sentiment < 0 ? "text-red-600" : "text-gray-500"
                                )}>
                                    {selectedNode.sentiment > 0 ? "Bullish" : selectedNode.sentiment < 0 ? "Bearish" : "Neutral"}
                                    {selectedNode.confidence && ` (${(selectedNode.confidence * 100).toFixed(0)}%)`}
                                </div>
                            </div>
                        )}

                        {selectedNode.details && Object.entries(selectedNode.details).map(([k, v]) => (
                            <div key={k}>
                                <div className="text-[9px] text-gray-400 uppercase">{k.replace(/_/g, " ")}:</div>
                                <div>{String(v)}</div>
                            </div>
                        ))}

                        <div>
                            <div className="text-[9px] text-gray-400 uppercase">Labels:</div>
                            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500 mt-0.5">
                                {selectedNode.type === "entity" ? "Entity" : selectedNode.type === "organization" ? "Organization" : "Person"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
