import { useState, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

const quickActions = [
    'RSI Strategy',
    'MACD Crossover',
    'Breakout Strategy'
];

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (action: string) => {
        setInput(`Create a ${action.toLowerCase()}`);
    };

    return (
        <div className="relative">
            <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                    <button
                        key={action}
                        onClick={() => handleQuickAction(action)}
                        className="px-3 py-1.5 bg-background-card border border-white/5 hover:border-flame/30 hover:bg-flame/5 rounded-full text-xs text-text-secondary hover:text-flame transition-all"
                        disabled={isLoading}
                    >
                        {action}
                    </button>
                ))}
            </div>

            <div className="relative bg-background-card/50 border border-white/10 rounded-xl focus-within:border-flame/50 focus-within:ring-1 focus-within:ring-flame/50 transition-all">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your trading strategy..."
                    className="w-full bg-transparent text-white rounded-xl p-4 pr-12 resize-none focus:outline-none font-mono text-sm min-h-[50px] max-h-[150px]"
                    rows={1}
                    disabled={isLoading}
                    style={{ minHeight: '52px' }}
                />

                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-2 bg-flame hover:bg-flame-dark rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>

            <div className="mt-2 text-xs text-text-secondary flex items-center justify-between">
                <span>Shift + Enter for new line</span>
                <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-flame" />
                    Powered by Gemini Pro
                </span>
            </div>
        </div>
    );
}
