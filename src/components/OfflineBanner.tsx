import React from 'react';

interface OfflineBannerProps {
    isOffline: boolean;
    onRetry: () => void;
}

export default function OfflineBanner({ isOffline, onRetry }: OfflineBannerProps) {
    if (!isOffline) return null;

    return (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span>📡</span>
                <span>You are currently offline. Some features may be limited.</span>
            </div>
            <button
                onClick={onRetry}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors"
            >
                Retry
            </button>
        </div>
    );
}
