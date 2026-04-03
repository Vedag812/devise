"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        question: "HOW DOES THE SWARM ANALYST WORK?",
        answer: "The Swarm Analyst runs six industry-specific personas (Semiconductors, Energy, Tech, Banking, Healthcare, Geopolitics) in parallel against a financial news seed. A ReportAgent aggregates their analysis using sector weights to output a dynamically selected ticker recommendation."
    },
    {
        question: "WHAT DOES DEVISE_POLICY ENFORCE?",
        answer: "DevisePolicy enforces financial constraints at runtime: checking ticker universes, max order sizes, daily exposure limits, market hour blackouts, and preventing forbidden tool executions like dangerous shell accesses or network egress."
    },
    {
        question: "HOW DO DELEGATION TOKENS SECURE TRADES?",
        answer: "DeviseTokens are HMAC-signed payloads issued by the Risk Agent. They lock the downstream Trader Agent to a specific action (e.g., BUY NVDA, quantity 28). The token includes replay protection, expiration TTLs, and blocks any sub-delegation without explicit permission."
    },
    {
        question: "HOW DOES ARMORCLAW FIT IN?",
        answer: "ArmorClaw is the primary enforcement engine. It blocks prompt injections by recognizing unauthorized intent plans and guarantees the agent fails closed on unverifiable intents."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-16 md:py-24 bg-black relative overflow-hidden border-b-2 border-white/10" id="faq">
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                 style={{ 
                    backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '10px 10px' 
                 }} 
            />

            <div className="container px-4 mx-auto max-w-4xl relative z-10">
                <div className="mb-10 md:mb-16 border-l-4 border-flame pl-6">
                    <h2 className="text-3xl md:text-5xl font-black font-mono text-white mb-4 tracking-tighter uppercase">
                        SYSTEM_QUERIES // FAQ
                    </h2>
                    <p className="text-gray-400 font-mono text-sm md:text-lg uppercase tracking-widest">
                        Protocol clarification and pipeline boundaries.
                    </p>
                </div>

                <div className="border-t-2 border-white/20">
                    {faqs.map((faq, index) => (
                        <div key={index} className="group border-b-2 border-white/20 bg-black hover:bg-white/[0.02] transition-colors">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between py-6 px-4 text-left focus:outline-none"
                            >
                                <span className={cn(
                                    "text-lg md:text-xl font-bold font-mono tracking-widest transition-colors duration-200",
                                    openIndex === index ? "text-flame" : "text-white group-hover:text-flame"
                                )}>
                                    {faq.question}
                                </span>
                                <div className={cn(
                                    "w-8 h-8 flex items-center justify-center border-2 transition-colors duration-300",
                                    openIndex === index ? "border-flame text-flame" : "border-white/20 text-white group-hover:border-flame group-hover:text-flame"
                                )}>
                                    <ChevronDown
                                        strokeWidth={3}
                                        className={cn(
                                            "w-5 h-5 transition-transform duration-300",
                                            openIndex === index ? "rotate-180" : ""
                                        )}
                                    />
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden bg-white/5 border-l-4 border-flame"
                                    >
                                        <div className="p-6 text-gray-300 font-mono text-base md:text-lg leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
