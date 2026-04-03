import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const mockLogs = [
    { type: "sys", time: "14:23:01", msg: "INITIALIZING SWARM ANALYSIS...", status: "" },
    { type: "ok", time: "14:23:02", msg: "ANALYST | market_data_fetch | NVDA", status: "ALLOWED | rule: ticker_in_universe" },
    { type: "ok", time: "14:23:04", msg: "RISK_AGENT | token_issue | BUY NVDA 28", status: "ALLOWED | Within Portfolio Limits" },
    { type: "ok", time: "14:23:05", msg: "TRADER | order_place | BUY NVDA 28", status: "ALLOWED | token: valid HMAC, rule: delegation_ok" },
    { type: "sys", time: "14:30:12", msg: "INCOMING EARNINGS REPORT: Q4_Results_Poisoned.pdf", status: "" },
    { type: "ok", time: "14:30:13", msg: "ANALYST | file_read | ./data/earnings/", status: "ALLOWED | rule: directory_ok" },
    { type: "err", time: "14:30:15", msg: "SYSTEM | PROMPT INJECTION DETECTED", status: "WARNING: 'IGNORE PREVIOUS INSTRUCTIONS'" },
    { type: "err", time: "14:30:16", msg: "TRADER | order_place | BUY TSLA 500", status: "BLOCKED | DEVISE_POLICY: TSLA not in ticker_universe" },
    { type: "err", time: "14:30:16", msg: "TRADER | order_place | BUY TSLA 500", status: "BLOCKED | DEVISE_POLICY: 500 exceeds max_order_size" },
    { type: "err", time: "14:30:17", msg: "ANALYST | http_post_external | evil.com", status: "BLOCKED | ARMORCLAW: tool not in approved intent plan" },
];

export function AttackScenariosScroll() {
    const containerRef = React.useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const lines = gsap.utils.toArray('.log-line');

        // Pin the whole section while scrolling through the logs
        gsap.to(lines, {
            opacity: 1,
            y: 0,
            stagger: 1,
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                pin: true,
                start: "top top",
                end: "+=2000",
                scrub: 0.5,
            }
        });
        
        // Progress bar
        gsap.fromTo('.progress-tracker', 
            { height: "0%" },
            {
                height: "100%",
                ease: "none",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=2000",
                    scrub: true,
                }
            }
        );

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative h-screen bg-black text-white flex items-center justify-center border-b-2 border-white/10">
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                 style={{ 
                    backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '10px 10px' 
                 }} 
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />

            <div className="container mx-auto px-4 z-20 flex flex-col lg:flex-row gap-12 items-center py-20 lg:py-0 h-full max-w-7xl">
                
                {/* Left Side: Copy */}
                <div className="flex-1 space-y-8">
                    <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-flame text-flame font-mono text-sm uppercase tracking-widest bg-flame/5">
                        <ShieldAlert className="w-4 h-4" />
                        Dual-Layer Blocking
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black font-mono uppercase tracking-tighter leading-tight">
                        Simulated <br/> Attack Vector
                    </h2>
                    <p className="text-lg md:text-xl font-mono text-gray-400 border-l-2 border-flame pl-4 max-w-lg">
                        Watch <span className="text-white">DeviseLog</span> react in real-time. First, a valid Swarm consensus is executed. Then, a poisoned earnings report attempts to hijack the trader agent.
                    </p>
                    
                    <div className="pt-8 grid grid-cols-1 xs:grid-cols-2 gap-4 max-w-sm font-mono text-xs sm:text-sm">
                        <div className="p-4 border border-white/10 bg-white/5 flex flex-col gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-gray-400">Allowed Action</span>
                            <span className="font-bold text-white uppercase">NVDA BUY 28</span>
                        </div>
                        <div className="p-4 border border-flame/30 bg-flame/10 flex flex-col gap-2 shadow-[4px_4px_0px_0px_#ea580c]">
                            <ShieldAlert className="w-5 h-5 text-flame" />
                            <span className="text-gray-400">Blocked Action</span>
                            <span className="font-bold text-flame uppercase">TSLA BUY 500</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Brutalist Terminal */}
                <div className="flex-1 w-full max-w-2xl relative">
                    <div className="absolute -left-8 top-0 bottom-0 w-px bg-white/10">
                        <div className="progress-tracker w-full bg-flame shadow-[0_0_10px_2px_#ea580c]"></div>
                    </div>

                    <div className="bg-[#0a0a0a] border-2 border-white/20 p-4 md:p-6 font-mono text-xs md:text-base leading-relaxed shadow-2xl relative h-[350px] md:h-[500px] overflow-hidden flex flex-col justify-end">
                        <div className="absolute top-0 left-0 right-0 p-3 border-b-2 border-white/20 bg-[#111] flex items-center justify-between z-10">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                            </div>
                            <div className="font-bold text-gray-500 tracking-widest text-xs">DeviseLog_Audit_Trail.log</div>
                        </div>

                        <div className="space-y-3 pt-16">
                            {mockLogs.map((log, i) => (
                                <div key={i} className="log-line opacity-0 translate-y-4 flex flex-col sm:flex-row sm:items-start gap-2 border-b border-white/5 pb-2">
                                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                    <div className="flex-1">
                                        <span className="text-white">{log.msg}</span>
                                        {log.status && (
                                            <div className={`mt-1 text-xs font-bold ${
                                                log.type === 'ok' ? 'text-green-400' :
                                                log.type === 'err' ? 'text-flame' : 'text-cyan-400'
                                            }`}>
                                                {log.type === 'ok' ? '✓ ' : log.type === 'err' ? '✗ ' : '↳ '}
                                                {log.status}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                    </div>
                </div>

            </div>
        </section>
    );
}
