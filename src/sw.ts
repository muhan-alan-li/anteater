// Service Worker for Anteater PWA
// Handles caching and background sync for conversation history

const CACHE_NAME = 'anteater-v1';
const KB_CACHE = 'anteater-kb-v1';
const CONVERSATIONS_CACHE = 'anteater-conversations-v1';
const MODEL_CACHE = 'anteater-model-v1';

const STATIC_ASSETS = [
    '/',
    '/src/main.tsx',
    '/src/components/ChatInterface.tsx',
    '/src/components/VoiceInput.tsx',
    '/src/components/ConversationHistory.tsx',
    '/src/services/rag_browser.ts',
    '/src/services/cache.ts',
    '/src/sw.ts'
];

async function preloadKB(indexedDBData: any): Promise<void> {
    try {
        const cache = await caches.open(KB_CACHE);
        await cache.put(
            '/assets/knowledge.json',
            new Response(JSON.stringify(indexedDBData), {
                headers: { 'Content-Type': 'application/json' }
            })
        );
    } catch (error) {
        console.error('Failed to preload KB:', error);
    }
}

async function preloadModel(): Promise<void> {
    try {
        const cache = await caches.open(MODEL_CACHE);
        const response = await fetch('/assets/all-MiniLM-L6-v2.wasm');
        if (response.ok) {
            await cache.put('/assets/all-MiniLM-L6-v2.wasm', response);
        }
    } catch (error) {
        console.error('Failed to preload model:', error);
    }
}

async function loadFromIndexedDB(): Promise<any> {
    return new Promise((resolve) => {
        const request = indexedDB.open('anteater-cache', 1);

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['conversations'], 'readonly');
            const store = transaction.objectStore('conversations');
            const getRequest = store.getAll();

            getRequest.onsuccess = () => {
                resolve(getRequest.result);
            };

            getRequest.onerror = () => {
                resolve([]);
            };
        };

        request.onerror = () => {
            resolve([]);
        };
    });
}

async function preloadCacheFromIndexedDB(): Promise<void> {
    try {
        const conversations = await loadFromIndexedDB();

        if (conversations && conversations.length > 0) {
            const cache = await caches.open(CONVERSATIONS_CACHE);
            await cache.put(
                '/assets/conversations.json',
                new Response(JSON.stringify(conversations), {
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        }
    } catch (error) {
        console.error('Failed to preload from IndexedDB:', error);
    }
}

async function fetchAndCache(url: string): Promise<Response> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Response(`Failed to fetch ${url}: ${response.status} ${response.statusText}`, {
            status: response.status,
            statusText: response.statusText
        });
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, response.clone());

    return response;
}

async function cleanupOldCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => name !== CACHE_NAME &&
        name !== KB_CACHE &&
        name !== CONVERSATIONS_CACHE &&
        name !== MODEL_CACHE
    );

    for (const name of oldCaches) {
        await caches.delete(name);
    }
}

async function handleFetch(request: FetchEvent): Promise<Response> {
    const url = new URL(request.url);

    if (request.request.mode === 'navigate') {
        try {
            return await fetchAndCache(request.url);
        } catch {
            const cached = await caches.match('/');
            return cached || new Response('Offline', { status: 503 });
        }
    }

    if (url.pathname.startsWith('/assets/')) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request.url);

        if (cached) {
            return cached;
        }

        try {
            return await fetchAndCache(request.url);
        } catch {
            const stale = await cache.match(request.url);
            if (stale) {
                return new Response(stale.body, {
                    status: 200,
                    headers: stale.headers
                });
            }
            throw new Error(`Failed to fetch ${request.url}`);
        }
    }

    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request.url);

    if (cached) {
        return cached;
    }

    try {
        return await fetchAndCache(request.url);
    } catch {
        throw new Response('Resource not available offline', { status: 503 });
    }
}

async function handlePush(e: PushEvent): Promise<void> {
    const title = 'Anteater';
    const body = e.data?.text() || 'New student loan information available';
    const options = {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: e.data?.url || '/' },
        actions: [
            { action: 'view', title: 'View', icon: '/icons/icon-72x72.png' }
        ]
    };

    await self.registration.showNotification(title, options);
}

async function handleNotificationClick(e: NotificationClickEvent): Promise<void> {
    e.notification.close();

    if (e.action === 'view') {
        await clients.openWindow(e.notification.data.url);
    } else {
        await clients.openWindow(e.notification.data.url);
    }
}

declare var self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);
            await preloadModel();
            await preloadCacheFromIndexedDB();
            await self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        (async () => {
            await cleanupOldCaches();
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(
        (async () => {
            try {
                return await handleFetch(event);
            } catch (error) {
                const cached = await caches.match(event.request);
                if (cached) {
                    return cached;
                }
                throw error;
            }
        })()
    );
});

self.addEventListener('push', (event: PushEvent) => {
    event.waitUntil(handlePush(event));
});

self.addEventListener('notificationclick', (event: NotificationClickEvent) => {
    event.waitUntil(handleNotificationClick(event));
});

self.addEventListener('message', (event: MessageEvent) => {
    const { type, data } = event.data || {};

    if (type === 'retrieve-context') {
        (async () => {
            try {
                const response = await fetch('/api/retrieve-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    event.ports[0]?.postMessage({ type: 'context-retrieved', data: result });
                }
            } catch (error) {
                event.ports[0]?.postMessage({ type: 'error', data: { message: 'Failed to retrieve context' } });
            }
        })();
    }
});