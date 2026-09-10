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
        return <p className="p-8">Loading saved conversations...</p>;
    }

    return (
        <div className="gc-body flex h-full flex-col bg-white">
            <div className="border-b border-gc-border p-4">
                <h2 className="gc-h3">Conversation history</h2>
                <p className="text-sm">Saved on this device only.</p>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <p className="p-8 text-center">No conversations yet.</p>
                ) : (
                    <ul className="divide-y divide-gc-border">
                        {conversations.map((conversation) => (
                            <li
                                key={conversation.id}
                                className={
                                    selectedConversation?.id === conversation.id
                                        ? 'border-l-4 border-l-gc-navy bg-gc-grey'
                                        : ''
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedConversation(conversation)}
                                    className="block w-full p-4 text-left"
                                >
                                    <span className="block truncate font-bold">{conversation.title}</span>
                                    <span className="mt-1 block text-sm">
                                        {new Date(conversation.createdAt).toLocaleDateString()}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => deleteConversation(conversation.id, e)}
                                    className="ml-4 mb-3 text-sm underline"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
