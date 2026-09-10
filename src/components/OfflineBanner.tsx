interface OfflineBannerProps {
    isOffline: boolean;
    onRetry: () => void;
}

export default function OfflineBanner({ isOffline, onRetry }: OfflineBannerProps) {
    if (!isOffline) return null;

    return (
        <div className="border-b border-gc-border bg-gc-warn-bg">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
                <p className="text-sm">
                    <strong>Warning: </strong>
                    You are offline. Saved passages still work, but new model downloads need a
                    connection.
                </p>
                <button type="button" onClick={onRetry} className="gc-btn gc-btn-default">
                    Retry
                </button>
            </div>
        </div>
    );
}
