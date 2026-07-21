import React, { useState, useEffect } from 'react';
import { cacheService } from '../services/cache';

interface Conversation {
    id: string;
    title: string;
    messages: any[];
    createdAt: number;
    updatedAt: number;
}

export default function ConversationHistory() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const convos = await cacheService.getConversations();
            setConversations(convos);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await cacheService.deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Conversation History</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                        No conversations yet.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => setSelectedConversation(conversation)}
                                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    selectedConversation?.id === conversation.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                                        : ''
                                }`}
                            >
                                <div className="font-medium truncate">{conversation.title}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(conversation.createdAt).toLocaleDateString()}
                                </div>
                                <button
                                    onClick={(e) => deleteConversation(conversation.id, e)}
                                    className="text-red-500 hover:text-red-700 mt-2 text-sm"
                                >
                                    Delete
                                </button>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
