export interface Conversation {
    id: string;
    title: string;
    messages: any[];
    createdAt: number;
    updatedAt: number;
}

export interface Chunk {
    text: string;
    source: string;
    score?: number;
}

export interface VectorData {
    corpus: Chunk[];
    vectors: number[][];
    sources: string[];
}

export interface Message {
    id: string;
    text: string;
    role: 'user' | 'assistant' | 'error';
    citations?: string[];
    timestamp: number;
}

export type AppRoute = '/chat' | '/history' | '/settings' | '/';

export interface AppState {
    currentRoute: AppRoute;
    isOffline: boolean;
    hasServiceWorker: boolean;
    conversations: Conversation[];
    activeConversation: Conversation | null;
    isLoading: boolean;
    error: string | null;
}

export type RootState = {
    app: AppState;
};