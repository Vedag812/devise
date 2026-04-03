import CodeInterpreter from '@e2b/code-interpreter';

export interface ExecutionResult {
    logs: string[];
    error?: string;
    results: any[]; // Charts, images, data
}

export const sandboxService = {
    async executeCode(code: string): Promise<ExecutionResult> {
        const apiKey = import.meta.env.VITE_E2B_API_KEY;

        if (!apiKey || apiKey === 'your_e2b_api_key') {
            throw new Error('Missing E2B API Key. Please configure VITE_E2B_API_KEY in .env file.');
        }

        try {
            const sandbox = await CodeInterpreter.create({ apiKey }) as any;
            const execution = await sandbox.notebook.execCell(code);

            const result: ExecutionResult = {
                logs: execution.logs.stdout,
                error: execution.logs.stderr.length > 0 ? execution.logs.stderr.join('\n') : undefined,
                results: execution.results,
            };

            await sandbox.close();
            return result;
        } catch (error: any) {
            console.error("Sandbox Execution Error:", error);
            return {
                logs: [],
                error: error.message || "An error occurred while executing the code.",
                results: []
            };
        }
    }
};
