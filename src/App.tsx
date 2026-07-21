import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import OfflineBanner from './components/OfflineBanner';

export default function App() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="h-dvh flex flex-col">
            <OfflineBanner isOffline={isOffline} onRetry={() => window.location.reload()} />
            <ChatInterface />
        </div>
    );
}
