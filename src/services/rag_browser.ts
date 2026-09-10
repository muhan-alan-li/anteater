import { llmService } from '@/services/llm';
import type { Chunk, VectorData } from '@/types';

interface EmbeddingOutput {
    data: ArrayLike<number>;
}

type EmbeddingPipeline = (
    text: string,
    options: { pooling: 'mean'; normalize: boolean }
) => Promise<EmbeddingOutput>;

// RAG service for vector search and local on-device answers.
class RAGService {
    private data: VectorData | null = null;
    private loading = false;
    private httpClient: EmbeddingPipeline | null = null;

    async loadVectorData(): Promise<void> {
        if (this.data) return;

        this.loading = true;
        try {
            const response = await fetch('/assets/index.json');
            this.data = (await response.json()) as VectorData;
        } catch (error) {
            console.error('Failed to load vector data:', error);
            this.data = { corpus: [], vectors: [], sources: [] };
        } finally {
            this.loading = false;
        }
    }

    async cosineSimilarity(a: number[], b: number[]): Promise<number> {
        const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
        const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
        const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
        return dot / (normA * normB);
    }

    async embedQuery(query: string): Promise<number[]> {
        if (!this.httpClient) {
            const { pipeline } = await import('@xenova/transformers');
            this.httpClient = (await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true
            })) as unknown as EmbeddingPipeline;
        }

        const output = await this.httpClient(query, {
            pooling: 'mean',
            normalize: true
        });
        return Array.from(output.data);
    }

    async retrieve(query: string, topK: number = 5): Promise<Chunk[]> {
        await this.loadVectorData();
        if (!this.data || this.data.vectors.length === 0) return [];

        const queryVector = await this.embedQuery(query);
        const scoredChunks: { chunk: Chunk; score: number }[] = [];

        for (let i = 0; i < this.data.vectors.length; i++) {
            const score = await this.cosineSimilarity(queryVector, this.data.vectors[i]);
            scoredChunks.push({
                chunk: { ...this.data.corpus[i], score },
                score
            });
        }

        scoredChunks.sort((a, b) => b.score - a.score);
        return scoredChunks.slice(0, topK).map(item => item.chunk);
    }

    async generateAnswer(question: string, chunks: Chunk[]): Promise<string> {
        return llmService.generateAnswer(question, chunks);
    }

    async processQuestion(question: string): Promise<{ answer: string, citations: string[] }> {
        if (!question.trim()) {
            throw new Error('Question is required');
        }

        const chunks = await this.retrieve(question);
        if (chunks.length === 0) {
            return {
                answer: 'No relevant information found in the knowledge base.',
                citations: []
            };
        }

        const answer = await this.generateAnswer(question, chunks);
        const sources = Array.from(new Set(chunks.map(c => c.source)));

        return { answer, citations: sources };
    }
}

export const ragService = new RAGService();
