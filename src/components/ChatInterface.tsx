import React, { useState, useEffect, useRef } from 'react';
import { ragService } from '../services/rag_browser';
import { llmService } from '../services/llm';
import type { LlmProgress } from '../services/llm';
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
    const [llmProgress, setLlmProgress] = useState<LlmProgress | null>(null);
    const [webGpuMissing] = useState(() => !llmService.isWebGpuAvailable());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, llmProgress]);

    useEffect(() => {
        const unsubscribe = llmService.onProgress((report) => {
            setLlmProgress(report.progress >= 1 ? null : report);
        });
        return unsubscribe;
    }, []);

    const addMessage = (text: string, role: 'user' | 'assistant' | 'error', citations?: string[]) => {
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            role,
            citations,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
    };

    const ask = async (rawQuestion: string) => {
        const question = rawQuestion.trim();
        if (!question || isLoading) return;

        setInput('');
        addMessage(question, 'user');
        setIsLoading(true);
        addMessage('', 'assistant');

        try {
            const { answer, citations } = await ragService.processQuestion(question);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.role === 'assistant' && msg.text === '' ? { ...msg, text: answer, citations } : msg,
                ),
            );

            const conversation: Conversation = {
                id: Date.now().toString(),
                title: question.substring(0, 30) + (question.length > 30 ? '...' : ''),
                messages: messages.filter((m) => m.id !== ''),
                createdAt: 0,
                updatedAt: 0,
            };
            await cacheService.saveConversation(conversation);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.role === 'assistant' && msg.text === ''
                        ? { ...msg, text: errorMessage, role: 'error' }
                        : msg,
                ),
            );
        } finally {
            setIsLoading(false);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await ask(input);
    };

    return (
        <div id="guide-chat" className="gc-body">
            <h2 className="gc-h2">Ask the guide</h2>
            <p className="mt-2">
                Type a question below. Answers quote the saved passages and list their sources.
            </p>

            {webGpuMissing && (
                <div className="gc-alert gc-alert-info mt-4" role="note">
                    <p>
                        <strong>Information: </strong>
                        This device has no WebGPU, so answers show retrieved passages instead of
                        generated text.
                    </p>
                </div>
            )}

            {messages.length === 0 ? (
                <div className="gc-alert mt-4">
                    <p>
                        <strong>How to use this guide</strong>
                    </p>
                    <ol className="mt-2 list-decimal pl-5">
                        <li>Type a question in the box below.</li>
                        <li>Read the answer and check the sources listed underneath it.</li>
                        <li>Confirm the details on the official site before you apply or repay.</li>
                    </ol>
                </div>
            ) : (
                <div className="mt-4">
                    {messages.map((message) =>
                        message.text === '' && message.role === 'assistant' ? null : message.role === 'user' ? (
                            <div key={message.id} className="border-t border-gc-border py-3">
                                <p className="font-bold">You asked:</p>
                                <p>{message.text}</p>
                            </div>
                        ) : message.role === 'error' ? (
                            <div key={message.id} className="gc-alert gc-alert-error mt-3" role="alert">
                                <p>
                                    <strong>Error: </strong>
                                    {message.text}
                                </p>
                            </div>
                        ) : (
                            <div key={message.id} className="mt-1 border border-gc-border bg-gc-grey p-4">
                                <p className="font-bold">Answer:</p>
                                <p className="whitespace-pre-wrap">{message.text}</p>
                                {message.citations && message.citations.length > 0 && (
                                    <p className="mt-3 text-sm">
                                        <span className="font-bold">Sources: </span>
                                        {message.citations.join('; ')}
                                    </p>
                                )}
                                <p className="mt-2 text-sm text-[#767676]">
                                    Answered at{' '}
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        ),
                    )}
                </div>
            )}

            {isLoading && llmProgress && (
                <div className="mt-4 border border-gc-border p-4" role="status">
                    <p>
                        Preparing the on-device model: {llmProgress.text} (
                        {Math.round(llmProgress.progress * 100)}%)
                    </p>
                    <div className="mt-2 h-2 w-full max-w-md bg-gc-border" aria-hidden="true">
                        <div
                            className="h-2 bg-gc-navy"
                            style={{ width: `${Math.round(llmProgress.progress * 100)}%` }}
                        />
                    </div>
                </div>
            )}
            {isLoading && !llmProgress && (
                <p className="mt-4 font-bold" role="status">
                    Searching saved passages...
                </p>
            )}
            <div ref={messagesEndRef} />

            <form onSubmit={handleSubmit} className="mt-4 border-t border-gc-border pt-4">
                <label htmlFor="guide-question" className="font-bold">
                    Ask a question about student loans
                </label>
                <p className="text-sm" id="guide-question-hint">
                    For example: Who can get a Canada Student Loan?
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                        id="guide-question"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        aria-describedby="guide-question-hint"
                        placeholder="Type your question"
                        className="gc-input flex-1"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={!input.trim() || isLoading} className="gc-btn gc-btn-primary">
                        Ask
                    </button>
                </div>
            </form>
        </div>
    );
}
