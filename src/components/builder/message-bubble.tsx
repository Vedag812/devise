import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/strategy';
import { User, Cpu, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
    message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
        <div
            className={cn(
                'flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 group',
                isUser && 'flex-row-reverse'
            )}
        >
            <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                isUser ? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10' :
                    isSystem ? 'bg-gray-800' : 'bg-flame/10 border border-flame/20'
            )}>
                {isUser ? (
                    <User className="w-4 h-4 text-text-secondary" />
                ) : isSystem ? (
                    <Cpu className="w-4 h-4 text-gray-400" />
                ) : (
                    <Sparkles className="w-4 h-4 text-flame" />
                )}
            </div>

            <div className={cn(
                'flex flex-col max-w-[80%]',
                isUser && 'items-end'
            )}>
                <div
                    className={cn(
                        'rounded-2xl p-4 shadow-sm relative',
                        isUser
                            ? 'bg-gradient-to-br from-flame to-orange-600 text-white rounded-tr-none'
                            : 'bg-background-card border border-white/5 text-text-primary rounded-tl-none'
                    )}
                >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                        {message.content}
                    </p>
                </div>

                {message.strategy && (
                    <div className="mt-3 w-full animate-in fade-in slide-in-from-top-2 duration-500 delay-150">
                        <div className="bg-background-card/50 backdrop-blur-sm rounded-xl border border-flame/30 overflow-hidden shadow-lg shadow-flame/5 transition-all hover:border-flame/50 group-hover/card:transform group-hover/card:scale-[1.01]">
                            <div className="bg-gradient-to-r from-flame/10 to-transparent p-4 border-b border-white/5">
                                <h4 className="text-base font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-flame" />
                                    {message.strategy.name}
                                </h4>
                                <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                                    {message.strategy.description}
                                </p>
                            </div>

                            <div className="p-4 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h5 className="text-[10px] uppercase tracking-wider text-flame font-bold">Entry Conditions</h5>
                                    <div className="space-y-1.5">
                                        {message.strategy.entryConditions.map((c, i) => (
                                            <div key={i} className="text-xs text-text-primary bg-white/5 rounded px-2 py-1 border border-white/5">
                                                {c.indicator} <span className="text-text-secondary">{c.operator.replace('_', ' ')}</span> {c.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Exit Plan</h5>
                                    <div className="space-y-1.5">
                                        <div className="text-xs text-text-primary bg-green-500/10 border border-green-500/20 rounded px-2 py-1 flex justify-between">
                                            <span>Take Profit</span>
                                            <span className="font-mono text-green-400">+{message.strategy.exitConditions.takeProfit}%</span>
                                        </div>
                                        <div className="text-xs text-text-primary bg-red-500/10 border border-red-500/20 rounded px-2 py-1 flex justify-between">
                                            <span>Stop Loss</span>
                                            <span className="font-mono text-red-400">-{message.strategy.exitConditions.stopLoss}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                <div className="text-xs text-text-secondary italic">
                                    Position Size: {message.strategy.positionSizing.type === 'fixed' ? `Fixed Amount` : `${message.strategy.positionSizing.amount}% Portfolio`}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <span className="text-[10px] text-text-secondary mt-1 opacity-50 px-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}
