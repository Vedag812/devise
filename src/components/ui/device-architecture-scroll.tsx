import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Brain, FileKey2, ShieldCheck, Terminal, Rocket } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const architectureNodes = [
    {
        title: "01 // SWARM ANALYST",
        description: "6 industry-specific personas evaluate the financial news seed in parallel. A weighted consensus determines the optimal ticker.",
        icon: Brain,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30"
    },
    {
        title: "02 // RISK AGENT",
        description: "Validates against portfolio limits and issues a cryptographically-signed (HMAC) DeviseToken locking the downstream action.",
        icon: FileKey2,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30"
    },
    {
        title: "03 // DEVISE POLICY",
        description: "The lightweight policy layer intercepts the action. Rejects trades exceeding max exposure or touching forbidden tickers.",
        icon: ShieldCheck,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30"
    },
    {
        title: "04 // ARMORCLAW",
        description: "Primary intent enforcement. Protects against prompt injection by blocking any tool execution not defined in the agent's intent plan.",
        icon: Terminal,
        color: "text-flame",
        bg: "bg-flame/10",
        border: "border-flame/30"
    },
    {
        title: "05 // TRADER AGENT",
        description: "Executes the validated action against the Alpaca Paper Trading API. Fails safely if intercepted by upstream guardrails.",
        icon: Rocket,
        color: "text-green-500",
        bg: "bg-green-500/10",
        border: "border-green-500/30"
    }
];

export function DeviceArchitectureScroll() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollWrapRef = React.useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const sections = gsap.utils.toArray('.arch-node');
        
        if (!scrollWrapRef.current) return;

        // Container animation for horizontal scrolling
        const scrollTween = gsap.to(sections, {
            xPercent: -100 * (sections.length - 1),
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                pin: true,
                scrub: 1,
                end: `+=${scrollWrapRef.current.offsetWidth}`,
            }
        });

        // Trigger animations based on containerAnimation
        sections.forEach((section: any) => {
            const innerContent = section.querySelector('.node-content');
            const iconWrap = section.querySelector('.icon-wrap');
            
            gsap.from(innerContent, {
                y: 50,
                opacity: 0.2,
                filter: "grayscale(100%)",
                scrollTrigger: {
                    trigger: section,
                    containerAnimation: scrollTween,
                    start: "left center",
                    toggleActions: "play none none reverse",
                }
            });
            
            gsap.from(iconWrap, {
                scale: 0.5,
                rotation: -15,
                scrollTrigger: {
                    trigger: section,
                    containerAnimation: scrollTween,
                    start: "left center",
                    toggleActions: "play none none reverse",
                }
            })
        });

        // Glowing connection line
        gsap.to('.connection-line-glow', {
            width: "100%",
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: `+=${scrollWrapRef.current.offsetWidth}`,
                scrub: true,
            }
        });

    }, { scope: containerRef });

    return (
        <>
            {/* Desktop View (Horizontal Scroll) */}
            <section ref={containerRef} className="relative h-screen bg-black text-white overflow-hidden border-b-2 border-white/10 hidden md:block">
                {/* Grid Background */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                     style={{ 
                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                        backgroundSize: '100px 100px' 
                     }} 
                />

                <div className="absolute top-24 left-12 z-20">
                    <h2 className="text-3xl font-mono font-bold tracking-tighter uppercase text-white bg-black p-2 border border-white/10 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                        <span className="text-flame mr-4 animate-pulse">■</span> Pipeline Architecture
                    </h2>
                </div>

                {/* Connection Line Background */}
                <div className="absolute top-1/2 left-0 w-[500vw] h-1 bg-white/10 -translate-y-1/2 z-0" />
                <div className="connection-line-glow absolute top-1/2 left-0 w-0 h-1 bg-flame -translate-y-1/2 z-0 shadow-[0_0_15px_3px_#ea580c]" />

                <div ref={scrollWrapRef} className="flex h-full w-[500vw]">
                    {architectureNodes.map((node, i) => (
                        <div key={i} className="arch-node w-screen h-full flex items-center justify-center relative z-10 shrink-0">
                            <div className={`node-content w-[80vw] md:w-[600px] p-8 border-2 ${node.border} bg-black/90 backdrop-blur-md shadow-2xl relative`}>
                                {/* Decorative corner brackets */}
                                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white/50"></div>
                                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-white/50"></div>
                                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-white/50"></div>
                                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white/50"></div>

                                <div className={`icon-wrap w-16 h-16 ${node.bg} ${node.color} flex items-center justify-center border border-current mb-6 shadow-[4px_4px_0px_0px_currentcolor]`}>
                                    <node.icon className="w-8 h-8" />
                                </div>
                                
                                <h3 className="text-2xl font-black font-mono uppercase tracking-widest mb-4">
                                    {node.title}
                                </h3>
                                
                                <p className="text-gray-400 font-mono text-lg leading-relaxed border-l-2 border-gray-800 pl-4">
                                    {node.description}
                                </p>

                                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 font-mono text-white/50 tracking-widest text-sm bg-black px-4 py-1 border border-white/10">
                                    NODE_{String(i + 1).padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mobile View (Vertical List) */}
            <section className="relative bg-black text-white py-20 px-6 md:hidden border-b-2 border-white/10" id="architecture">
                <div className="mb-12">
                    <h2 className="text-2xl font-mono font-bold tracking-tighter uppercase text-white bg-black p-2 border border-white/10 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.3)] inline-block">
                        <span className="text-flame mr-3 animate-pulse">■</span> Pipeline Architecture
                    </h2>
                </div>

                <div className="space-y-12 relative">
                    {/* Vertical Connection Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/5" />
                    
                    {architectureNodes.map((node, i) => (
                        <div key={i} className="relative pl-16">
                            {/* Node Indicator */}
                            <div className={`absolute left-5 top-0 w-6 h-6 rounded-none border-2 ${node.border} ${node.bg} z-10 flex items-center justify-center`}>
                                <div className="w-1.5 h-1.5 bg-white animate-pulse" />
                            </div>

                            <div className={`p-6 border-2 ${node.border} bg-white/[0.02] relative`}>
                                <div className={`w-12 h-12 ${node.bg} ${node.color} flex items-center justify-center border border-current mb-4 shadow-[2px_2px_0px_0px_currentcolor]`}>
                                    <node.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-mono font-black uppercase mb-3 tracking-tighter">{node.title}</h3>
                                <p className="text-gray-500 font-mono text-sm leading-relaxed">{node.description}</p>
                                
                                <div className="mt-4 font-mono text-[10px] text-white/30 tracking-widest uppercase">
                                    Status: AUTH_LOCKED // 0x{String(i + 1).padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
