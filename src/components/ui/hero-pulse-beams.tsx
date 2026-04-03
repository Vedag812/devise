"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BeamPath {
    path: string;
    gradientConfig: {
        initial: { x1: string; x2: string; y1: string; y2: string };
        animate: {
            x1: string | string[];
            x2: string | string[];
            y1: string | string[];
            y2: string | string[];
        };
        transition?: {
            duration?: number;
            repeat?: number;
            repeatType?: "loop" | "reverse" | "mirror";
            repeatDelay?: number;
            delay?: number;
        };
    };
    connectionPoints?: Array<{ cx: number; cy: number; r: number }>;
}

interface HeroPulseBeamsProps {
    className?: string;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    buttonText?: string;
    buttonHref?: string;
    beams?: BeamPath[];
    gradientColors?: { start: string; middle: string; end: string };
    baseColor?: string;
    accentColor?: string;
}

const defaultBeams: BeamPath[] = [
    {
        path: "M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5",
        gradientConfig: {
            initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
            animate: {
                x1: ["0%", "0%", "200%"],
                x2: ["0%", "0%", "180%"],
                y1: ["80%", "0%", "0%"],
                y2: ["100%", "20%", "20%"],
            },
            transition: { duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 2, delay: Math.random() * 2 },
        },
        connectionPoints: [{ cx: 6.5, cy: 398.5, r: 6 }, { cx: 269, cy: 220.5, r: 6 }],
    },
    {
        path: "M568 200H841C846.523 200 851 195.523 851 190V40",
        gradientConfig: {
            initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
            animate: {
                x1: ["20%", "100%", "100%"],
                x2: ["0%", "90%", "90%"],
                y1: ["80%", "80%", "-20%"],
                y2: ["100%", "100%", "0%"],
            },
            transition: { duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 2, delay: Math.random() * 2 },
        },
        connectionPoints: [{ cx: 851, cy: 34, r: 6.5 }, { cx: 568, cy: 200, r: 6 }],
    },
    {
        path: "M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5",
        gradientConfig: {
            initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
            animate: {
                x1: ["20%", "100%", "100%"],
                x2: ["0%", "90%", "90%"],
                y1: ["80%", "80%", "-20%"],
                y2: ["100%", "100%", "0%"],
            },
            transition: { duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 2, delay: Math.random() * 2 },
        },
        connectionPoints: [{ cx: 142, cy: 427, r: 6.5 }, { cx: 425.5, cy: 274, r: 6 }],
    },
    {
        path: "M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427",
        gradientConfig: {
            initial: { x1: "40%", x2: "50%", y1: "160%", y2: "180%" },
            animate: { x1: "0%", x2: "10%", y1: "-40%", y2: "-20%" },
            transition: { duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 2, delay: Math.random() * 2 },
        },
        connectionPoints: [{ cx: 770, cy: 427, r: 6.5 }, { cx: 493, cy: 274, r: 6 }],
    },
    {
        path: "M380 168V17C380 11.4772 384.477 7 390 7H414",
        gradientConfig: {
            initial: { x1: "-40%", x2: "-10%", y1: "0%", y2: "20%" },
            animate: {
                x1: ["40%", "0%", "0%"],
                x2: ["10%", "0%", "0%"],
                y1: ["0%", "0%", "180%"],
                y2: ["20%", "20%", "200%"],
            },
            transition: { duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 2, delay: Math.random() * 2 },
        },
        connectionPoints: [{ cx: 420.5, cy: 6.5, r: 6 }, { cx: 380, cy: 168, r: 6 }],
    },
];

export const HeroPulseBeams = React.forwardRef<HTMLElement, HeroPulseBeamsProps>(
    (
        {
            className,
            title = "Intent-Aware Autonomous Execution",
            subtitle = "Transform ambiguous instructions into deterministic financial boundaries using the OpenClaw-based Devise pipeline.",
            buttonText = "Initialize Swarm",
            buttonHref = "/builder",
            beams = defaultBeams,
            gradientColors = { start: "#FE7F2D", middle: "#FF6B35", end: "#FE7F2D" },
            baseColor = "rgba(254, 127, 45, 0.1)",
            accentColor = "rgba(254, 127, 45, 0.3)",
            ...props
        },
        ref
    ) => {
        return (
            <section
                ref={ref}
                className={cn(
                    "relative z-0 flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden bg-background-base",
                    className
                )}
                {...props}
            >
                {/* Lamp Effect Background */}
                <div className="absolute top-0 isolate z-0 flex w-screen flex-1 items-start justify-center">
                    <div className="absolute top-0 z-50 h-48 w-screen bg-transparent opacity-10 backdrop-blur-md" />

                    {/* Main glow */}
                    <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-[-30%] rounded-full bg-flame/60 opacity-80 blur-3xl" />

                    {/* Lamp effect */}
                    <motion.div
                        initial={{ width: "8rem" }}
                        viewport={{ once: true }}
                        transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
                        whileInView={{ width: "16rem" }}
                        className="absolute top-0 z-30 h-36 -translate-y-[20%] rounded-full bg-flame/60 blur-2xl"
                    />

                    {/* Top line */}
                    <motion.div
                        initial={{ width: "15rem" }}
                        viewport={{ once: true }}
                        transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
                        whileInView={{ width: "30rem" }}
                        className="absolute inset-auto z-50 h-0.5 -translate-y-[-10%] bg-flame/60"
                    />

                    {/* Left gradient cone */}
                    <motion.div
                        initial={{ opacity: 0.5, width: "15rem" }}
                        whileInView={{ opacity: 1, width: "30rem" }}
                        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                        style={{ backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))` }}
                        className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-flame/60 via-transparent to-transparent [--conic-position:from_70deg_at_center_top]"
                    >
                        <div className="absolute w-[100%] left-0 bg-background-base h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                        <div className="absolute w-40 h-[100%] left-0 bg-background-base bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
                    </motion.div>

                    {/* Right gradient cone */}
                    <motion.div
                        initial={{ opacity: 0.5, width: "15rem" }}
                        whileInView={{ opacity: 1, width: "30rem" }}
                        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                        style={{ backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))` }}
                        className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-flame/60 [--conic-position:from_290deg_at_center_top]"
                    >
                        <div className="absolute w-40 h-[100%] right-0 bg-background-base bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
                        <div className="absolute w-[100%] right-0 bg-background-base h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                    </motion.div>
                </div>

                {/* Pulse Beams SVG */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width={858} height={434} viewBox="0 0 858 434" fill="none" className="flex flex-shrink-0">
                        {beams.map((beam, index) => (
                            <React.Fragment key={index}>
                                <path d={beam.path} stroke={baseColor} strokeWidth="1" />
                                <path d={beam.path} stroke={`url(#grad${index})`} strokeWidth="2" strokeLinecap="round" />
                                {beam.connectionPoints?.map((point, pointIndex) => (
                                    <circle
                                        key={`${index}-${pointIndex}`}
                                        cx={point.cx}
                                        cy={point.cy}
                                        r={point.r}
                                        fill={baseColor}
                                        stroke={accentColor}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                        <defs>
                            {beams.map((beam, index) => (
                                <motion.linearGradient
                                    key={index}
                                    id={`grad${index}`}
                                    gradientUnits="userSpaceOnUse"
                                    initial={beam.gradientConfig.initial}
                                    animate={beam.gradientConfig.animate}
                                    transition={beam.gradientConfig.transition as any}
                                >
                                    <stop offset="0%" stopColor={gradientColors.start} stopOpacity="0" />
                                    <stop offset="20%" stopColor={gradientColors.start} stopOpacity="1" />
                                    <stop offset="50%" stopColor={gradientColors.middle} stopOpacity="1" />
                                    <stop offset="100%" stopColor={gradientColors.end} stopOpacity="0" />
                                </motion.linearGradient>
                            ))}
                        </defs>
                    </svg>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ y: 100, opacity: 0.5 }}
                    viewport={{ once: true }}
                    transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    className="relative z-50 container flex justify-center flex-1 flex-col px-5 md:px-10 gap-6 -translate-y-20"
                >
                    <div className="flex flex-col items-center text-center space-y-6">
                        {title && (
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-mono tracking-tight text-text-primary">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-xl font-mono text-text-secondary max-w-3xl leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                        <Link to={buttonHref}>
                            <button className="bg-background-card w-[240px] md:w-[300px] z-40 h-[80px] md:h-[100px] no-underline group cursor-pointer relative shadow-2xl shadow-flame/20 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block hover:shadow-flame/40 transition-all duration-300 mt-8">
                                <span className="absolute inset-0 overflow-hidden rounded-full">
                                    <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(254,127,45,0.6)_0%,rgba(254,127,45,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                </span>
                                <div className="relative flex justify-center w-full text-center space-x-3 h-full items-center z-10 rounded-full bg-background-base py-0.5 px-4 ring-1 ring-flame/20 group-hover:ring-flame/40 transition-all duration-300">
                                    <span className="text-xl md:text-2xl font-bold font-mono inline-block bg-clip-text text-transparent bg-gradient-to-r from-flame via-orange-400 to-flame">
                                        {buttonText}
                                    </span>
                                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-flame group-hover:translate-x-1 transition-transform duration-300" />
                                </div>
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </section>
        );
    }
);

HeroPulseBeams.displayName = "HeroPulseBeams";
