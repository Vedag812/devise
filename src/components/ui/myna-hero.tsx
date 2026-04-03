import * as React from "react";
import { Activity, ArrowRight, Shield, Terminal, Cpu, Lock, Eye, Zap, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const OPENCLAW_LOGO = (
    <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
);

export function MynaHero() {
    const container = React.useRef(null);
    const [stats, setStats] = React.useState({ blocked: 0, executed: 0, tokens: 0 });
    const [time, setTime] = React.useState(new Date());

    // Live clock
    React.useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Animated counters
    React.useEffect(() => {
        const targets = { blocked: 2847, executed: 1293, tokens: 4140 };
        const duration = 2000;
        const start = Date.now();

        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setStats({
                blocked: Math.floor(targets.blocked * eased),
                executed: Math.floor(targets.executed * eased),
                tokens: Math.floor(targets.tokens * eased),
            });

            if (progress < 1) requestAnimationFrame(animate);
        };

        const timer = setTimeout(animate, 1500);
        return () => clearTimeout(timer);
    }, []);

    useGSAP(() => {
        const tl = gsap.timeline();

        tl.from(".hero-word", {
            y: 120,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power4.out",
            filter: "blur(12px)",
        })
        .from(".hero-metadata", {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.08,
        }, "-=0.3")
        .from(".hero-stat", {
            opacity: 0,
            scale: 0.8,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            ease: "back.out(1.7)",
        }, "-=0.2")
        .from(".hero-chip", {
            opacity: 0,
            x: -20,
            duration: 0.4,
            stagger: 0.08,
        }, "-=0.2")
        .from(".cta-button", {
            opacity: 0,
            scale: 0.9,
            duration: 0.5,
            ease: "back.out(1.7)",
        }, "-=0.2");

        // Floating particles
        gsap.utils.toArray('.hero-particle').forEach((particle: any) => {
            gsap.to(particle, {
                y: `random(-40, 40)`,
                x: `random(-30, 30)`,
                rotation: `random(-15, 15)`,
                duration: `random(3, 6)`,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        });

    }, { scope: container });

    return (
        <div 
            ref={container} 
            className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col justify-center"
        >
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                 style={{ 
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px' 
                 }} 
            />

            {/* Glowing Orbs */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#FF6B2B]/[0.07] rounded-full blur-[250px] -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/[0.05] rounded-full blur-[200px] translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[180px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[150px]" />

            {/* Floating Particles */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="hero-particle absolute pointer-events-none"
                    style={{
                        top: `${10 + Math.random() * 80}%`,
                        left: `${5 + Math.random() * 90}%`,
                    }}
                >
                    <div className={`${i % 2 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1'} ${
                        i % 4 === 0 ? 'bg-[#FF6B2B]/25' : 
                        i % 4 === 1 ? 'bg-cyan-400/20' : 
                        i % 4 === 2 ? 'bg-emerald-400/15' : 'bg-white/10'
                    } rotate-45`} />
                </div>
            ))}

            {/* Scan line effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
                <div className="animate-scanline w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />
            </div>

            {/* Top System Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/[0.04] bg-black/60 backdrop-blur-xl">
                <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between py-3">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">
                            {OPENCLAW_LOGO}
                            <span className="text-white/50 font-bold">DEVISE</span>
                            <span className="text-white/20">×</span>
                            <span className="text-[#FF6B2B]/80">ArmorClaw</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                            <span className="font-mono text-[10px] text-emerald-400/80 uppercase tracking-wider">all systems nominal</span>
                        </div>
                    </div>
                    <div className="font-mono text-[10px] text-white/20 tracking-widest tabular-nums">
                        {time.toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10 pt-20">
                <main className="max-w-6xl mx-auto">
                    {/* Status Badge */}
                    <div className="hero-metadata inline-flex items-center gap-3 px-4 py-2.5 border border-[#FF6B2B]/30 text-[#FF6B2B] font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-8 md:mb-12 bg-[#FF6B2B]/[0.04] backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B2B] animate-pulse shadow-[0_0_12px_3px_rgba(255,107,43,0.4)]"></span>
                        SYSTEM ACTIVE : OPENCLAW + ARMORCLAW v3.0
                    </div>

                    {/* Massive Title */}
                    <div className="flex flex-col gap-0 sm:gap-1 font-mono uppercase font-black text-4xl xs:text-5xl sm:text-7xl lg:text-[5.5rem] xl:text-[7rem] tracking-tighter leading-[0.88] mb-8">
                        <div className="overflow-hidden"><div className="hero-word text-white/90">INTENT-AWARE</div></div>
                        <div className="overflow-hidden">
                            <div className="hero-word text-transparent bg-clip-text" style={{
                                backgroundImage: 'linear-gradient(135deg, #FF6B2B 0%, #FF8F5E 30%, #FFB088 50%, #FF6B2B 70%, #E85D1C 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'gradient-shift 4s ease-in-out infinite',
                            }}>
                                AUTONOMOUS
                            </div>
                        </div>
                        <div className="overflow-hidden"><div className="hero-word text-white/90">FINANCIAL</div></div>
                        <div className="overflow-hidden">
                            <div className="hero-word flex items-center gap-3 sm:gap-4">
                                <span className="text-white/90">PIPELINE</span>
                                <span className="text-[#FF6B2B] animate-pulse">_</span>
                            </div>
                        </div>
                    </div>

                    <p className="hero-metadata max-w-2xl text-sm sm:text-base md:text-lg text-white/40 font-mono leading-relaxed mb-10 md:mb-14 border-l-2 border-[#FF6B2B]/30 pl-6">
                        Enforce intent-aware execution using <span className="text-white font-bold">OpenClaw</span> + <span className="text-[#FF6B2B] font-bold">ArmorClaw</span> as 
                        the primary enforcement engine. Real <span className="text-emerald-400 font-bold">Alpaca paper trades</span> + cryptographic 
                        delegation tokens + dual-layer blocking.
                    </p>

                    {/* Live Stats */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-10 md:mb-14 max-w-2xl">
                        {[
                            { icon: Shield, value: stats.blocked.toLocaleString(), label: "Threats Blocked", color: "text-red-400", borderColor: "border-red-500/20", bgColor: "bg-red-500/[0.04]", glowColor: "shadow-[0_0_15px_rgba(239,68,68,0.06)]" },
                            { icon: Activity, value: stats.executed.toLocaleString(), label: "Trades Executed", color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/[0.04]", glowColor: "shadow-[0_0_15px_rgba(16,185,129,0.06)]" },
                            { icon: Lock, value: stats.tokens.toLocaleString(), label: "Tokens Issued", color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/[0.04]", glowColor: "shadow-[0_0_15px_rgba(6,182,212,0.06)]" },
                        ].map((stat, idx) => (
                            <div key={idx} className={`hero-stat border ${stat.borderColor} ${stat.bgColor} ${stat.glowColor} p-3 sm:p-5 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02]`}>
                                <stat.icon className={`w-4 h-4 ${stat.color} mb-2 opacity-60`} />
                                <div className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono ${stat.color} tabular-nums`}>{stat.value}</div>
                                <div className="text-[9px] sm:text-[10px] text-white/30 uppercase tracking-wider font-bold mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tech Stack Chips */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-10 md:mb-14 max-w-3xl">
                        {[
                            { icon: Shield, label: "ArmorClaw", sub: "Intent Enforcement", color: "text-[#FF6B2B] border-[#FF6B2B]/20" },
                            { icon: Terminal, label: "OpenClaw", sub: "Agent Framework", color: "text-cyan-400 border-cyan-500/20" },
                            { icon: Zap, label: "Alpaca", sub: "Paper Trading", color: "text-emerald-400 border-emerald-500/20" },
                            { icon: Lock, label: "HMAC-SHA256", sub: "Crypto Tokens", color: "text-purple-400 border-purple-500/20" },
                            { icon: Cpu, label: "Swarm V4", sub: "6-Persona Core", color: "text-amber-400 border-amber-500/20" },
                        ].map((chip, idx) => (
                            <div key={idx} className={`hero-chip flex items-center gap-2 border ${chip.color} px-3 py-2 bg-white/[0.01] backdrop-blur-sm text-xs font-mono`}>
                                <chip.icon className="w-3 h-3 opacity-70" />
                                <span className="font-bold uppercase tracking-wide">{chip.label}</span>
                                <span className="text-white/20 hidden sm:inline">·</span>
                                <span className="text-white/20 text-[10px] hidden sm:inline">{chip.sub}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="cta-button flex flex-col sm:flex-row gap-4">
                        <Link to="/dashboard" className="inline-block relative group">
                            <div className="absolute inset-0 bg-[#FF6B2B] translate-x-1 translate-y-1 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
                            <button className="relative bg-black border-2 border-white text-white px-8 py-4 sm:py-5 font-mono text-sm sm:text-base font-bold tracking-[0.15em] flex items-center gap-4 hover:bg-white hover:text-black transition-colors duration-300 uppercase">
                                Launch Command Center
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link to="/dashboard" className="inline-block">
                            <button className="px-8 py-4 sm:py-5 border border-white/10 text-white/40 font-mono text-xs sm:text-sm font-bold tracking-[0.15em] hover:border-[#FF6B2B]/30 hover:text-[#FF6B2B] transition-all duration-300 uppercase flex items-center gap-3">
                                <Eye className="w-4 h-4" />
                                View Architecture
                            </button>
                        </Link>
                    </div>
                </main>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hero-metadata">
                <span className="font-mono text-[9px] text-white/20 uppercase tracking-[0.3em]">Explore</span>
                <ChevronDown className="w-4 h-4 text-white/15 animate-bounce" />
            </div>

            {/* Side Panel - Right */}
            <div className="hero-metadata absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 font-mono text-[9px] text-white/15 tracking-widest hidden lg:flex flex-col items-end gap-6 uppercase">
                <span className="writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>OpenClaw × ArmorIQ Hackathon 2026</span>
            </div>
        </div>
    );
}
