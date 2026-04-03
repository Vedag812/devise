import { useState } from 'react';
import type { Strategy } from '@/types/strategy';
import { Activity, Check, Code2, Copy, Eye, Loader2, Play, Terminal, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
    strategy: Strategy | null;
}

export function PreviewPanel({ strategy }: PreviewPanelProps) {
    const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'output'>('visual');
    const [copied, setCopied] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [executionResult, setExecutionResult] = useState<{ logs: string[], error?: string } | null>(null);

    const handleCopy = () => {
        if (strategy?.code) {
            navigator.clipboard.writeText(strategy.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRun = async () => {
        if (!strategy?.code) return; // Ensure strategy and code exist
        setIsRunning(true);
        setActiveTab('output');
        setExecutionResult(null);

        try {
            // dynamic import to avoid SSR issues if any, though we are client-side
            const { sandboxService } = await import('@/lib/sandbox');
            const result = await sandboxService.executeCode(strategy.code);
            setExecutionResult(result);
        } catch (error: any) {
            setExecutionResult({ logs: [], error: error.message });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background-elevated border-l border-white/5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex bg-background-base rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            activeTab === 'visual' ? "bg-background-card text-white shadow-sm" : "text-text-secondary hover:text-white"
                        )}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Visual
                    </button>
                    <button
                        onClick={() => setActiveTab('code')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            activeTab === 'code' ? "bg-background-card text-white shadow-sm" : "text-text-secondary hover:text-white"
                        )}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        Code
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                            activeTab === 'output' ? "bg-background-card text-white shadow-sm" : "text-text-secondary hover:text-white"
                        )}
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        Output
                        {executionResult && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </button>
                </div>

                {activeTab === 'code' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleRun}
                            disabled={isRunning || !strategy?.code}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all backdrop-blur-sm border border-flame/20",
                                isRunning
                                    ? "bg-flame/10 text-flame cursor-wait"
                                    : "bg-flame hover:bg-flame-dark text-white shadow-lg shadow-flame/20"
                            )}
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5" />
                                    Run
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 text-text-secondary hover:text-white transition-colors hover:bg-white/5 rounded-md"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto snippet-scroll">
                {strategy ? (
                    <>
                        {activeTab === 'visual' && (
                            <div className="p-6 space-y-8">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-2 font-mono">{strategy.name}</h2>
                                        <p className="text-sm text-text-secondary leading-relaxed max-w-md">{strategy.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-flame/10 px-3 py-1.5 rounded-lg border border-flame/20">
                                        <span className="text-xs font-mono text-flame font-bold">75% Win Rate</span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-background-base p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 text-text-secondary mb-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-xs font-mono">Profit Factor</span>
                                        </div>
                                        <span className="text-lg font-bold text-green-400">2.4x</span>
                                    </div>
                                    <div className="bg-background-base p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 text-text-secondary mb-2">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-xs font-mono">Max Drawdown</span>
                                        </div>
                                        <span className="text-lg font-bold text-red-400">-12.5%</span>
                                    </div>
                                </div>

                                {/* Recent Trades (Mock) */}
                                <div>
                                    <h3 className="text-sm font-mono text-text-secondary mb-4">Recent Performance</h3>
                                    <div className="flex flex-col gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-background-base rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">BTC/USD Long</div>
                                                        <div className="text-xs text-text-secondary">2h ago</div>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-mono text-green-400">+$1,240</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'code' && (
                            <div className="relative group">
                                <div className="absolute top-2 right-2 z-10">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-lg bg-background-card border border-white/10 text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <pre className="bg-background-base/80 p-4 rounded-xl border border-white/5 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed shadow-inner scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                    {strategy.code || "# No code generated yet..."}
                                </pre>
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div className="h-full flex flex-col bg-[#1e1e1e] font-mono text-sm p-4">
                                {executionResult ? (
                                    <div className="space-y-4">
                                        {executionResult.error ? (
                                            <div className="text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                                                <div className="flex items-center gap-2 mb-2 font-bold">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    Execution Error
                                                </div>
                                                <pre className="whitespace-pre-wrap font-mono text-xs">{executionResult.error}</pre>
                                            </div>
                                        ) : (
                                            <div className="text-green-400 bg-green-500/10 p-4 rounded-lg border border-green-500/20 mb-4">
                                                <div className="flex items-center gap-2 font-bold">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    Execution Successful
                                                </div>
                                            </div>
                                        )}

                                        {executionResult.logs && executionResult.logs.length > 0 && (
                                            <div>
                                                <div className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Console Output</div>
                                                <div className="bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-gray-300">
                                                    {executionResult.logs.map((log, i) => (
                                                        <div key={i} className="whitespace-pre-wrap">{log}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!executionResult.error && (!executionResult.logs || executionResult.logs.length === 0) && (
                                            <div className="text-text-secondary italic text-center mt-10">
                                                No output returned from execution.
                                            </div>
                                        )}
                                    </div>
                                ) : isRunning ? (
                                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-text-secondary">
                                        <Loader2 className="w-8 h-8 animate-spin text-flame" />
                                        <p>Running code in secure sandbox...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-text-secondary opacity-50">
                                        <Terminal className="w-12 h-12" />
                                        <p>Run the code to see output here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-text-secondary opacity-50">
                        <Terminal className="w-12 h-12 mb-4" />
                        <h4 className="text-xl font-bold mb-2">Ready to Build?</h4>
                        <p className="text-sm max-w-[240px]">
                            Start chatting with the AI to generate your first strategy. The live preview will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
