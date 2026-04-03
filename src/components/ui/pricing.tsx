"use client";

import { cn } from "@/lib/utils";
import { Check, Terminal, ShieldAlert } from "lucide-react";

interface PricingPlan {
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
}

interface PricingProps {
    plans: PricingPlan[];
    title?: string;
    description?: string;
    className?: string;
}

export function Pricing({
    plans,
    title = "Deployment Options",
    description = "Adopt intent-aware pipelines at any scale.",
    className,
}: PricingProps) {
    return (
        <div className={cn("container py-20 md:py-32 bg-black min-h-screen border-b-2 border-white/10 relative", className)} id="pricing">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                 style={{ 
                    backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '10px 10px' 
                 }} 
            />

            <div className="text-center space-y-6 mb-16 md:mb-24 max-w-4xl mx-auto px-4 relative z-10">
                <div className="inline-flex items-center justify-center p-3 md:p-4 bg-flame.10 border border-flame/30 text-flame mb-6 md:mb-8 shadow-[4px_4px_0px_0px_#ea580c]">
                    <Terminal className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h2 className="text-3xl md:text-6xl font-black font-mono uppercase tracking-tighter text-white">
                    {title}
                </h2>
                <p className="text-gray-400 text-base md:text-xl font-mono leading-relaxed border-l-2 border-flame pl-6 max-w-2xl mx-auto text-left">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 relative z-10">
                {plans.map((plan, index) => (
                    <div
                        key={index}
                        className={cn(
                            "border-2 bg-black flex flex-col relative p-6 md:p-10 transition-transform duration-300 hover:-translate-y-2 hover:-translate-x-2",
                            plan.isPopular 
                                ? "border-flame shadow-[12px_12px_0px_0px_#ea580c]" 
                                : "border-white/20 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)]",
                            plan.isPopular && "z-10"
                        )}
                    >
                        {/* Decorative corner brackets */}
                        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-current text-white"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-current text-white"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-current text-white"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-current text-white"></div>

                        {plan.isPopular && (
                            <div className="absolute -top-4 w-full left-0 flex justify-center">
                                <div className="bg-flame text-black font-black uppercase tracking-widest text-xs px-4 py-1 border-2 border-black flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Recommended for Institutions
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1 flex flex-col mt-4">
                            <p className="text-xl font-black font-mono text-white uppercase tracking-widest bg-white/5 inline-block px-4 py-2 self-start border border-white/10 mb-8">
                                {plan.name}
                            </p>
                            
                            <div className="flex items-baseline gap-x-2 mb-2 border-b-2 border-white/10 pb-8">
                                <span className="text-4xl md:text-6xl font-black tracking-tighter text-white font-mono uppercase">
                                    {plan.price === "0" ? "FREE" : plan.price}
                                </span>
                            </div>

                            <p className="text-base leading-6 text-gray-400 font-mono mt-8 h-12">
                                {plan.description}
                            </p>

                            <ul className="mt-8 gap-4 flex flex-col flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 border border-white/5 p-3 bg-white/[0.02]">
                                        <Check className="h-5 w-5 text-flame mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-300 font-mono text-sm leading-relaxed">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={plan.href}
                                className={cn(
                                    "mt-10 block w-full py-5 text-center text-lg font-black font-mono tracking-widest border-2 transition-colors duration-300 relative group",
                                    plan.isPopular
                                        ? "bg-flame border-flame text-black hover:bg-black hover:text-flame"
                                        : "bg-black border-white text-white hover:bg-white hover:text-black"
                                )}
                            >
                                <div className={cn("absolute inset-0 translate-x-1.5 translate-y-1.5 -z-10 transition-transform group-hover:translate-x-3 group-hover:translate-y-3",
                                    plan.isPopular ? "bg-flame" : "bg-white/20"
                                )}></div>
                                <span>{plan.buttonText}</span>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
