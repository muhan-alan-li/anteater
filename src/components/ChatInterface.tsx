import React, { useState, useEffect, useRef } from 'react';
import { ragService } from '../services/rag_browser';
import { cacheService } from '../services/cache';
import type { Conversation } from '../types';

interface Message {
    id: string;
    text: string;
    role: 'user' | 'assistant' | 'error';
    citations?: string[];
    timestamp: number;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addMessage = (text: string, role: 'user' | 'assistant' | 'error', citations?: string[]) => {
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            role,
            citations,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const question = input.trim();
        setInput('');
        addMessage(question, 'user');
        setIsLoading(true);
        addMessage('', 'assistant');

        try {
            const { answer, citations } = await ragService.processQuestion(question);
            setMessages(prev => prev.map(msg =>
                msg.role === 'assistant' && msg.text === ''
                    ? { ...msg, text: answer, citations }
                    : msg
            ));

            const conversation: Conversation = {
                id: Date.now().toString(),
                title: question.substring(0, 30) + (question.length > 30 ? '...' : ''),
                messages: messages.filter(m => m.id !== ''),
                createdAt: 0,
                updatedAt: 0,
            };
            await cacheService.saveConversation(conversation);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            setMessages(prev => prev.map(msg =>
                msg.role === 'assistant' && msg.text === ''
                    ? { ...msg, text: errorMessage, role: 'error' }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <h2 className="text-xl font-semibold mb-2">Welcome to Anteater</h2>
                        <p>Ask me anything about Canadian federal and BC student loan programs</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : message.role === 'error'
                                            ? 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.text}</p>
                                {message.citations && message.citations.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                                        <div className="text-xs font-semibold">Sources:</div>
                                        <div className="text-xs">{message.citations.join(', ')}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about student loans..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
