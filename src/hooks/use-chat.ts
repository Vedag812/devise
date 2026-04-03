import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, Strategy } from '@/types/strategy';
import { sendToGemini } from '@/lib/gemini-api';

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'system',
            content: `Welcome to DEVISE AI Builder!

Describe your trading strategy. Examples:
• "Buy when RSI < 30, sell at 5% profit"
• "MACD crossover strategy"
• "Price breakout above 50-day SMA"`,
            timestamp: new Date()
        }
    ]);
    const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = useCallback(async (userInput: string) => {
        if (!userInput.trim()) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Call Gemini API
            const response = await sendToGemini(userInput);

            // Add AI response
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response.message,
                strategy: response.strategy,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

            // Update preview if strategy generated
            if (response.strategy) {
                const strategyWithCode = {
                    ...response.strategy,
                    code: response.code
                };
                setCurrentStrategy(strategyWithCode);
            }
        } catch (error) {
            // Add error message
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI'}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearChat = useCallback(() => {
        setMessages([{
            id: '1',
            role: 'system',
            content: `Welcome to DEVISE AI Builder!

Describe your trading strategy. Examples:
• "Buy when RSI < 30, sell at 5% profit"
• "MACD crossover strategy"
• "Price breakout above 50-day SMA"`,
            timestamp: new Date()
        }]);
        setCurrentStrategy(null);
    }, []);

    return {
        messages,
        currentStrategy,
        isLoading,
        sendMessage,
        clearChat,
        messagesEndRef
    };
}
