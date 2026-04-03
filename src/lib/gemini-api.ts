import type { GeminiMessage, GeminiResponse } from '@/types/strategy';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Conversation history for context
const conversationHistory: GeminiMessage[] = [];

const SYSTEM_INSTRUCTION = `You are DEVISE AI, an expert algorithmic trading architect.

Your goal is to build profitable, robust trading strategies based on user descriptions.

Response Format:
You MUST return a JSON object with the following structure:
{
  "message": "Conversational response explaining your design decisions",
  "strategy": {
    "name": "Strategy Name",
    "description": "Technical description",
    "entryConditions": [...],
    "exitConditions": {...},
    "positionSizing": {...}
  },
  "code": "Full Python code (using pandas/numpy) implementing this strategy. Include comments.",
  "reasoning": "Why this works",
  "risks": ["Risk 1"]
}

Guidelines:
- Generate production-ready Python code.
- Focus on risk management.
- Be concise and professional.
`;

export async function sendToGemini(userInput: string): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key missing. Returning mock response.');
        return getMockResponse(userInput);
    }

    // Add user message to history
    conversationHistory.push({
        role: 'user',
        parts: [{ text: userInput }]
    });

    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: conversationHistory,
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        // Add AI response to history
        conversationHistory.push({
            role: 'model',
            parts: [{ text: aiText }]
        });

        // Try to parse JSON from response
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as GeminiResponse;
            }
        } catch (e) {
            // If not JSON, return as plain message
            return { message: aiText };
        }

        return { message: aiText };
    } catch (error) {
        console.error('Gemini API error:', error);
        return getMockResponse(userInput);
    }
}

function getMockResponse(input: string): GeminiResponse {
    return {
        message: `I've designed a strategy based on your request: "${input}". It uses a combination of indicators to identify high-probability setups.`,
        strategy: {
            name: "Adaptive Momentum",
            description: "Trend-following strategy using dynamic RSI thresholds",
            entryConditions: [
                { indicator: "RSI", operator: "less_than", value: 30, period: 14 },
                { indicator: "SMA", operator: "greater_than", value: 200, period: 200 }
            ],
            exitConditions: { takeProfit: 5, stopLoss: 2 },
            positionSizing: { type: "percentage", amount: 2 }
        },
        code: `class AdaptiveMomentum(Strategy):
    def init(self):
        self.rsi = self.I(ta.rsi, self.data.Close, 14)
        self.sma = self.I(ta.sma, self.data.Close, 200)

    def next(self):
        if self.rsi < 30 and self.data.Close > self.sma:
            self.buy()
        elif self.rsi > 70:
            self.position.close()`
    };
}

export function clearConversationHistory() {
    conversationHistory.length = 0;
}
