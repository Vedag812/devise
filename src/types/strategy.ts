// Strategy Types
export interface Condition {
    indicator: 'RSI' | 'MACD' | 'SMA' | 'EMA' | 'BollingerBands' | 'Volume';
    operator: 'less_than' | 'greater_than' | 'crosses_above' | 'crosses_below';
    value: number;
    period: number;
}

export interface ExitConditions {
    takeProfit: number;
    stopLoss: number;
}

export interface PositionSizing {
    type: 'fixed' | 'percentage';
    amount: number;
}

export interface Strategy {
    name: string;
    description: string;
    entryConditions: Condition[];
    exitConditions: ExitConditions;
    positionSizing: PositionSizing;
    code?: string; // Generated Python code
}

// Chat Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    strategy?: Strategy;
    timestamp: Date;
}

// Gemini API Types
export interface GeminiMessage {
    role: 'user' | 'model';
    parts: [{ text: string }];
}

export interface GeminiResponse {
    message: string;
    strategy?: Strategy;
    code?: string;
    reasoning?: string;
    risks?: string[];
    nextSteps?: string[];
}
