"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as d3 from "d3"
import { cn } from "@/lib/utils"

interface SwarmVisualizerProps {
    currentStep: 'SCAN' | 'PERSONA' | 'CONSENSUS' | 'REPORT'
    activeSectors: string[]
    results: Record<string, { verdict: 'bullish' | 'bearish' | 'neutral', conf: number }>
    ticker?: string
}

interface Node extends d3.SimulationNodeDatum {
    id: string
    name: string
    isActive?: boolean
    result?: { verdict: 'bullish' | 'bearish' | 'neutral', conf: number }
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node
    target: string | Node
}

const SECTOR_DATA = [
    { id: 'semis', name: 'Semis' },
    { id: 'energy', name: 'Energy' },
    { id: 'tech', name: 'Tech' },
    { id: 'banking', name: 'Banking' },
    { id: 'health', name: 'Health' },
    { id: 'geo', name: 'Geo' },
]

export function SwarmVisualizer({ currentStep, activeSectors, results, ticker = "NVDA" }: SwarmVisualizerProps) {
    const [nodes, setNodes] = React.useState<Node[]>([])
    const [links, setLinks] = React.useState<Link[]>([])
    const [hoveredId, setHoveredId] = React.useState<string | null>(null)
    const simulationRef = React.useRef<d3.Simulation<Node, Link> | null>(null)

    // Initialize Swarm Data
    React.useEffect(() => {
        const initialNodes: Node[] = SECTOR_DATA.map((s, i) => ({
            id: s.id,
            name: s.name,
            x: 50 + 30 * Math.cos((i * 60 * Math.PI) / 180),
            y: 50 + 30 * Math.sin((i * 60 * Math.PI) / 180),
        }))

        const initialLinks: Link[] = []
        initialNodes.forEach((node, i) => {
            const nextIdx = (i + 1) % initialNodes.length
            const randIdx = (i + 2) % initialNodes.length
            initialLinks.push({ source: node.id, target: initialNodes[nextIdx].id })
            initialLinks.push({ source: node.id, target: initialNodes[randIdx].id })
        })

        setNodes(initialNodes)
        setLinks(initialLinks)

        const simulation = d3.forceSimulation<Node>(initialNodes)
            .force("link", d3.forceLink<Node, Link>(initialLinks).id(d => d.id).distance(25).strength(0.1))
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(50, 50))
            .force("collide", d3.forceCollide(8))
            .force("gravity", d3.forceRadial(30, 50, 50).strength(0.05))

        simulation.on("tick", () => {
            initialNodes.forEach(node => {
                node.x! += (Math.random() - 0.5) * 0.1
                node.y! += (Math.random() - 0.5) * 0.1
            })
            setNodes([...initialNodes])
        })

        simulationRef.current = simulation
        return () => {
            simulation.stop()
        }
    }, [])

    // Update active state in existing nodes
    React.useEffect(() => {
        if (simulationRef.current) {
            const currentNodes = simulationRef.current.nodes()
            currentNodes.forEach(node => {
                node.isActive = activeSectors.includes(node.id)
                node.result = results[node.id]
                
                // Forces based on state
                if (node.isActive) {
                    // Active nodes gravitate strongly to center
                    simulationRef.current?.force("radial", d3.forceRadial(15, 50, 50).strength(0.2))
                }
                
                if (node.result) {
                    // Resolved nodes move slightly out to form a ring of clarity
                    simulationRef.current?.force("radial", d3.forceRadial(25, 50, 50).strength(0.1))
                    // Repel other resolved nodes slightly to avoid overlap
                    simulationRef.current?.force("collide", d3.forceCollide(10))
                }
            })
            simulationRef.current.alpha(0.3).restart()
        }
    }, [activeSectors, results])

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/40 overflow-hidden rounded-xl border border-white/5 border-dashed">
            {/* Background Grid/Radar Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                {[15, 30, 45].map((r) => (
                    <div key={r} 
                        className="absolute border border-white rounded-full" 
                        style={{ width: `${r*2}%`, height: `${r*2}%` }}
                    />
                ))}
            </div>

            <svg viewBox="0 0 100 100" className="w-full h-full max-w-[600px] drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                {/* Mesh Connections (Faint Web) */}
                {links.map((link, i) => {
                    const source = typeof link.source === 'string' ? nodes.find(n => n.id === link.source) : link.source
                    const target = typeof link.target === 'string' ? nodes.find(n => n.id === link.target) : link.target
                    if (!source || !target) return null
                    return (
                        <line 
                            key={`mesh-${i}`}
                            x1={source.x} y1={source.y}
                            x2={target.x} y2={target.y}
                            stroke="white" strokeWidth="0.05"
                            className="opacity-5"
                        />
                    )
                })}

                <AnimatePresence>
                    {/* Data Beams (from Center to Active Agents) */}
                    {nodes.map((node) => {
                        const isActive = activeSectors.includes(node.id)
                        return (isActive || currentStep === 'SCAN') && (
                            <motion.line
                                key={`beam-${node.id}`}
                                x1="50" y1="50" x2={node.x} y2={node.y}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ 
                                    pathLength: 1, 
                                    opacity: isActive ? 0.6 : 0.05,
                                    stroke: isActive ? "#ea580c" : "#ffffff"
                                }}
                                exit={{ opacity: 0 }}
                                strokeWidth="0.3"
                                strokeDasharray="1 1"
                                className={cn(isActive && "animate-[dash_20s_linear_infinite]")}
                            />
                        )
                    })}
                </AnimatePresence>

                {/* Central Ticker Hub (Static Anchor) */}
                <g className="cursor-pointer">
                    <circle cx="50" cy="50" r="8" fill="white" className="opacity-[0.02] animate-pulse" />
                    <circle cx="50" cy="50" r="4.5" fill="black" stroke="white" strokeWidth="0.5" />
                    <text x="50" y="51.5" textAnchor="middle" className="fill-white text-[3.5px] font-black uppercase select-none tracking-tighter">
                        {ticker}
                    </text>
                </g>

                {/* Free-Roaming Agent Nodes */}
                {nodes.map((node) => {
                    const isActive = activeSectors.includes(node.id)
                    const res = results[node.id]

                    return (
                        <g
                            key={node.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredId(node.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Sentiment Halos */}
                            {res && (
                                <circle
                                    cx={node.x} cy={node.y} r="4"
                                    fill={res.verdict === 'bullish' ? "#4ade80" : "#ea580c"}
                                    className="opacity-[0.08]"
                                />
                            )}

                            {/* Main Agent Node */}
                            <circle 
                                cx={node.x} cy={node.y} r="2" 
                                fill="black" 
                                stroke={res ? (res.verdict === 'bullish' ? "#4ade80" : "#ea580c") : (isActive ? "#ea580c" : "white")}
                                strokeWidth={isActive ? 0.6 : 0.2}
                                className="transition-colors duration-500"
                            />
                            
                            {/* Active Pulse */}
                            {isActive && !res && (
                                <circle cx={node.x} cy={node.y} r="2" fill="none" stroke="#ea580c" strokeWidth="0.4" className="animate-ping opacity-40" />
                            )}

                            {/* Label Text (Tracking the node) */}
                            <text
                                x={node.x} y={node.y! + 4}
                                textAnchor="middle"
                                className={cn(
                                    "text-[2px] font-bold select-none tracking-widest transition-colors duration-500",
                                    isActive ? "fill-flame" : "fill-white/20"
                                )}
                            >
                                {node.name.toUpperCase()}
                            </text>

                            {/* Sentiment ↑↓ */}
                            {res && (
                                <text x={node.x} y={node.y! + 0.5} textAnchor="middle" className={cn(
                                    "text-[2px] font-black select-none",
                                    res.verdict === 'bullish' ? "fill-green-400" : "fill-flame"
                                )}>
                                    {res.verdict === 'bullish' ? "↑" : "↓"}
                                </text>
                            )}
                        </g>
                    )
                })}

                {/* Radar Sweep Animation (SCAN phase) */}
                {currentStep === 'SCAN' && (
                    <motion.path
                        d="M 50 50 L 50 15 A 35 35 0 0 1 85 35 L 50 50"
                        fill="url(#radarGradient)"
                        className="opacity-10 origin-center"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    />
                )}

                <defs>
                    <linearGradient id="radarGradient" gradientTransform="rotate(90)">
                        <stop offset="0%" stopColor="white" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Hover Tooltip overlay */}
            <AnimatePresence>
                {hoveredId && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/90 border border-white/20 backdrop-blur-md rounded-lg shadow-xl"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-white/40 uppercase font-black tracking-tighter">Analyst_Core</span>
                            <span className="text-xs text-white font-bold tracking-widest uppercase">
                                {nodes.find(n => n.id === hoveredId)?.name} // {activeSectors.includes(hoveredId) ? "ACTIVE" : "STANDBY"}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
