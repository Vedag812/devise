import { MessageBubble } from './message-bubble';
import type { ChatMessage } from '@/types/strategy';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface ChatPanelProps {
    messages: ChatMessage[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatPanel({ messages, isLoading, messagesEndRef }: ChatPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
                <div className="flex gap-3 mb-4 animate-in fade-in duration-300">
                    <div className="w-8 h-8 rounded-full bg-flame/10 border border-flame/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-flame animate-spin" />
                    </div>
                    <div className="bg-background-card border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
