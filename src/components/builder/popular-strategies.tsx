import { motion } from 'framer-motion';
import { TrendingUp, Zap, Shield, Activity, BarChart2, Target, Grid, Activity as ActivityIcon, Volume2, Anchor, TrendingDown, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';;

interface StrategyTemplate {
    id: number;
    name: string;
    icon: any; // Lucide icon
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    winRate: number;
    prompt: string;
}

const POPULAR_STRATEGIES: StrategyTemplate[] = [
    {
        id: 1,
        name: "RSI Reversal",
        icon: TrendingUp,
        description: "Buys when RSI < 30, Sells when RSI > 70. Classic mean reversion strategy.",
        difficulty: "Beginner",
        winRate: 58,
        prompt: "Create an RSI Reversal strategy that buys when RSI is below 30 and sells when RSI is above 70."
    },
    {
        id: 2,
        name: "MACD Crossover",
        icon: Zap,
        description: "Classic trend following momentum strategy using MACD signal crossovers.",
        difficulty: "Beginner",
        winRate: 55,
        prompt: "Build a MACD Crossover strategy that buys on bullish crossover and sells on bearish crossover."
    },
    {
        id: 3,
        name: "Bollinger Breakout",
        icon: Activity,
        description: "Captures high volatility breakout moves using Bollinger Band squeezes.",
        difficulty: "Intermediate",
        winRate: 52,
        prompt: "Create a Bollinger Band Breakout strategy that buys when price breaks the upper band with high volume."
    },
    {
        id: 4,
        name: "Golden Cross",
        icon: Shield,
        description: "Long term trend following using SMA crossovers (50/200 day).",
        difficulty: "Beginner",
        winRate: 60,
        prompt: "Implement a Golden Cross strategy using 50-day and 200-day SMA crossovers."
    },
    {
        id: 5,
        name: "Mean Reversion",
        icon: BarChart2,
        description: "Buys oversold stocks near support, expects bounce to mean.",
        difficulty: "Intermediate",
        winRate: 57,
        prompt: "Build a Mean Reversion strategy buying when price is 2 deviations below 20-day SMA and RSI < 25."
    },
    {
        id: 6,
        name: "Momentum Surge",
        icon: Target,
        description: "Catches strong momentum moves with volume confirmation.",
        difficulty: "Intermediate",
        winRate: 53,
        prompt: "Create a Momentum Surge strategy using RSI > 60 and Volume > 200% average."
    },
    {
        id: 7,
        name: "Grid Trading",
        icon: Grid,
        description: "Places multiple orders at different price levels in ranging markets.",
        difficulty: "Advanced",
        winRate: 65,
        prompt: "Design a Grid Trading strategy for ranging markets with orders at +/- 2% intervals."
    },
    {
        id: 8,
        name: "Breakout Pullback",
        icon: TrendingDown,
        description: "Buys pullbacks after confirmed breakouts for better entry prices.",
        difficulty: "Advanced",
        winRate: 61,
        prompt: "Build a strategy that buys pullbacks to the 20 EMA after a resistance breakout."
    },
    {
        id: 9,
        name: "Volume Spike",
        icon: Volume2,
        description: "Identifies unusual volume activity indicating institutional interest.",
        difficulty: "Intermediate",
        winRate: 54,
        prompt: "Create a Volume Spike strategy identifying volume > 300% of average with price increase."
    },
    {
        id: 10,
        name: "Support Bounce",
        icon: Anchor,
        description: "Buys at key support levels with confirmation from multiple indicators.",
        difficulty: "Intermediate",
        winRate: 59,
        prompt: "Implement a Support Bounce strategy buying at key levels when RSI is oversold and MACD diverges."
    },
    {
        id: 11,
        name: "Trend Rider",
        icon: ActivityIcon,
        description: "Follows strong trends using EMA and ADX for confirmation.",
        difficulty: "Advanced",
        winRate: 62,
        prompt: "Create a Trend Following strategy using EMA crosses confirmed by ADX > 25."
    },
    {
        id: 12,
        name: "Scalper's Edge",
        icon: Swords,
        description: "Quick in-and-out trades capturing small price movements.",
        difficulty: "Expert",
        winRate: 68,
        prompt: "Build a high-frequency Scalping strategy using VWAP and RSI < 40 for quick entries."
    }
];

const difficultyColors = {
    Beginner: "bg-green-500/20 text-green-400 border-green-500/20",
    Intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
    Advanced: "bg-orange-500/20 text-orange-400 border-orange-500/20",
    Expert: "bg-red-500/20 text-red-400 border-red-500/20"
};

interface PopularStrategiesProps {
    onSelect: (prompt: string) => void;
}

export function PopularStrategies({ onSelect }: PopularStrategiesProps) {
    return (
        <section className="mt-12 w-full max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-300 font-mono flex items-center gap-2">
                    <Target className="w-5 h-5 text-flame" />
                    Popular Strategies
                </h2>
                <button className="text-flame text-sm hover:text-white transition-colors hover:underline flex items-center gap-1 font-mono">
                    View All <span className="text-xs">→</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {POPULAR_STRATEGIES.map((strategy, i) => (
                    <motion.div
                        key={strategy.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="bg-background-card/50 backdrop-blur-sm rounded-xl p-5 border border-white/5 hover:border-flame/50 hover:bg-background-card transition-all cursor-pointer group hover:shadow-lg hover:shadow-flame/10"
                        onClick={() => onSelect(strategy.prompt)}
                    >
                        {/* Icon */}
                        <div className="w-12 h-12 bg-gray-800/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-flame/20 transition-colors border border-white/5 group-hover:border-flame/20">
                            <strategy.icon className="w-6 h-6 text-gray-400 group-hover:text-flame transition-colors" />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white mb-2 font-mono group-hover:text-flame transition-colors">
                            {strategy.name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                            {strategy.description}
                        </p>

                        {/* Tags */}
                        <div className="flex gap-2 mt-auto">
                            <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium", difficultyColors[strategy.difficulty])}>
                                {strategy.difficulty}
                            </span>
                            <span className="text-[10px] bg-flame/10 text-flame border border-flame/20 px-2 py-0.5 rounded font-mono">
                                {strategy.winRate}% WR
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
