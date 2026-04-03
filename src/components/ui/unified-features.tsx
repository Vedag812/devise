"use client";

import {
    Brain,
    Shield,
    BarChart3,
    Zap,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const features = [
    {
        title: 'ArmorClaw Engine',
        icon: Shield,
        description: 'Deterministic enforcement blocking prompt injection and unauthorized tool execution.',
    },
    {
        title: 'Swarm Analyst',
        icon: Brain,
        description: '6 industry-specific personas evaluate financial seeds in parallel to reach consensus on trades.',
    },
    {
        title: 'Delegation Tokens',
        icon: Zap,
        description: 'HMAC-signed cryptographic tokens lock execution to specific tickers and limit sizes.',
    },
    {
        title: 'DeviseLog Audit',
        icon: BarChart3,
        description: 'Structured, traceable audit logs recording exactly why every financial action was allowed or blocked.',
    },
];

export function UnifiedFeatures() {
    const container = useRef(null);

    useGSAP(() => {
        gsap.from(".feature-block", {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: container.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        });
    }, { scope: container });

    return (
        <section ref={container} className="py-32 bg-black min-h-[80vh] relative" id="features">
            {/* Dark Noise Texture Overlay Placeholder */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black" />

            <div className="mx-auto w-full max-w-7xl space-y-24 px-4 relative z-10">
                <div className="mx-auto max-w-4xl text-center border-2 border-white/10 bg-white/[0.02] p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
                    <h2 className="text-4xl font-black font-mono tracking-widest text-white uppercase text-balance md:text-5xl lg:text-5xl mb-6">
                        Dual-Layer Enforcement
                    </h2>
                    <p className="text-gray-400 text-base font-mono tracking-widest text-balance md:text-lg leading-relaxed uppercase border-t-2 border-white/10 pt-6">
                        Separating reasoning from <span className="text-white">execution</span>. We block unauthorized actions with cryptographic certainty, ensuring autonomous models never go rogue.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, i) => (
                        <div key={i} className="feature-block flex flex-col border-2 border-white/20 bg-black p-8 relative transition-colors duration-300 hover:border-flame hover:shadow-[6px_6px_0px_0px_#ea580c] group">
                            
                            {/* Decorative corner brackets */}
                            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white transition-colors duration-300 group-hover:border-flame"></div>
                            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-white transition-colors duration-300 group-hover:border-flame"></div>
                            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-white transition-colors duration-300 group-hover:border-flame"></div>
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white transition-colors duration-300 group-hover:border-flame"></div>

                            <div className="mb-8 w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-flame group-hover:bg-flame/10 transition-colors duration-300">
                                <feature.icon strokeWidth={1.5} className="w-8 h-8" />
                            </div>
                            
                            <h3 className="text-2xl font-black font-mono tracking-widest text-white uppercase mb-4 group-hover:text-flame transition-colors duration-300">
                                {feature.title}
                            </h3>
                            
                            <p className="text-gray-400 text-base font-mono leading-relaxed border-l-2 border-white/10 pl-4">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
