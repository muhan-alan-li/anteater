import type { InitProgressReport, MLCEngine } from '@mlc-ai/web-llm';
import type { Chunk } from '@/types';

// Single fixed model for the app. No user selection.
export const LLM_MODEL_ID = 'gemma-2-2b-it-q4f16_1';

export interface LlmProgress {
    progress: number;
    text: string;
}

export type LlmProgressCallback = (report: LlmProgress) => void;

/**
 * Local inference service. Runs the chat model in the browser
 * with WebGPU. The model downloads once and then stays cached,
 * so answers keep working while offline.
 */
class LlmService {
    private engine: MLCEngine | null = null;
    private loading: Promise<MLCEngine> | null = null;
    private listeners = new Set<LlmProgressCallback>();
    private webGpuAvailable: boolean | null = null;

    isWebGpuAvailable(): boolean {
        if (this.webGpuAvailable === null) {
            this.webGpuAvailable =
                typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu !== undefined;
        }
        return this.webGpuAvailable;
    }

    /** Subscribe to model download progress. Returns an unsubscribe function. */
    onProgress(callback: LlmProgressCallback): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private reportProgress(report: LlmProgress): void {
        for (const listener of this.listeners) {
            listener(report);
        }
    }

    /** Start the engine. Resolves when the model is ready to answer. */
    async load(): Promise<MLCEngine> {
        if (this.engine) return this.engine;
        if (this.loading) return this.loading;
        if (!this.isWebGpuAvailable()) {
            throw new Error('WebGPU is not available on this device.');
        }

        this.loading = (async () => {
            // Dynamic import keeps the large WebLLM runtime out of the main bundle.
            const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
            return CreateMLCEngine(LLM_MODEL_ID, {
                initProgressCallback: (report: InitProgressReport) => {
                    this.reportProgress({ progress: report.progress, text: report.text });
                }
            });
        })();

        try {
            this.engine = await this.loading;
            this.reportProgress({ progress: 1, text: 'Model ready.' });
            return this.engine;
        } finally {
            this.loading = null;
        }
    }

    /**
     * Generate an answer from retrieved chunks with the local model.
     * Falls back to an extractive answer on devices without WebGPU.
     */
    async generateAnswer(question: string, chunks: Chunk[]): Promise<string> {
        if (!this.isWebGpuAvailable()) {
            return this.extractiveAnswer(chunks);
        }

        const context = chunks.map((c) => `[Source: ${c.source}]\n${c.text}`).join('\n\n');
        const systemPrompt =
            "You are a student loan advisor for Canadian federal and BC student loan programs. Answer the user's question using ONLY the provided context. If the context does not contain enough information, say so. Cite the source for each claim you make. Keep the answer concise.";

        const engine = await this.load();
        const reply = await engine.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Context:\n${context}\n\nQuestion:\n${question}` }
            ],
            temperature: 0.2,
            max_tokens: 512
        });

        const text = reply.choices[0]?.message?.content;
        if (typeof text !== 'string' || text.trim() === '') {
            return this.extractiveAnswer(chunks);
        }
        return text;
    }

    /**
     * Fallback answer for devices without WebGPU.
     * Returns the retrieved passages so the user still gets an answer.
     */
    extractiveAnswer(chunks: Chunk[]): string {
        const passages = chunks.map((c) => `[Source: ${c.source}]\n${c.text}`).join('\n\n');
        return (
            'On-device answers need WebGPU, which this device does not support. ' +
            'Here are the most relevant passages from the knowledge base:\n\n' +
            passages
        );
    }
}

export const llmService = new LlmService();
