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
        <div className="gc-body flex min-h-dvh flex-col bg-white text-gc-text">
            <a href="#wb-cont" className="gc-skip">
                Skip to main content
            </a>
            <a href="#wb-info" className="gc-skip">
                Skip to about this guide
            </a>

            <header>
                <div className="border-b border-gc-border">
                    <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <span
                                className="grid h-10 w-10 shrink-0 place-items-center bg-gc-navy text-lg font-bold text-white"
                                aria-hidden="true"
                            >
                                A
                            </span>
                            <div>
                                <p className="text-lg leading-tight font-bold">Anteater</p>
                                <p className="text-sm leading-tight">Student loan guide: federal and BC</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <OfflineBanner isOffline={isOffline} onRetry={() => window.location.reload()} />

            <main id="wb-cont" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10">
                <h1 className="gc-h1 mt-6">Student loan guide: federal and BC programs</h1>
                <p className="gc-lead mt-3 max-w-3xl">
                    Scholarships, loans, grants, repayment help, and borrowing tips, in plain
                    language. This is an <strong>unofficial guide</strong> built from saved copies of
                    official passages. It is not a Government of Canada or Province of British
                    Columbia site.
                </p>

                <div className="mt-6 grid gap-8 lg:grid-cols-3">
                    <section aria-label="Guide questions and answers" className="lg:col-span-2">
                        <ChatInterface />
                    </section>

                    <aside className="space-y-6">
                        <section className="lnkbx" aria-labelledby="official-sources">
                            <h2 id="official-sources">Official sources</h2>
                            <ul>
                                <li>
                                    <a
                                        href="https://www.canada.ca/en/services/finance/educationfunding.html"
                                        rel="external"
                                    >
                                        Education funding &ndash; Canada.ca
                                    </a>
                                </li>
                                <li>
                                    <a href="https://studentaidbc.ca/" rel="external">
                                        StudentAid BC
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.canada.ca/en/services/benefits/education.html"
                                        rel="external"
                                    >
                                        Student aid and education planning &ndash; Canada.ca
                                    </a>
                                </li>
                            </ul>
                            <p className="mt-3 text-sm">
                                Confirm every answer on these sites before you apply or repay.
                            </p>
                        </section>

                        <section className="lnkbx" aria-labelledby="about-answers">
                            <h2 id="about-answers">About these answers</h2>
                            <p className="text-sm">
                                Answers are generated on your device from saved passages and may be out
                                of date. They cite the passages used. Official program rules always
                                take precedence.
                            </p>
                        </section>
                    </aside>
                </div>

                <section aria-label="Page details" className="mt-10 border-t border-gc-border pt-4 text-sm">
                    <h2 className="sr-only">Page details</h2>
                    <p>
                        Date modified: <time dateTime="2026-09-10">2026-09-10</time>
                    </p>
                </section>
            </main>

            <footer id="wb-info">
                <div className="border-t-4 border-gc-navy bg-gc-grey">
                    <div className="gc-body mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:grid-cols-2">
                        <nav aria-label="About this guide">
                            <h2 className="gc-h3">About this guide</h2>
                            <ul className="mt-2 list-disc pl-5">
                                <li>
                                    <a href="#guide-chat">How answers work</a>
                                </li>
                                <li>
                                    <a href="#about-answers">About these answers</a>
                                </li>
                                <li>
                                    <a href="#official-sources">Official sources</a>
                                </li>
                            </ul>
                        </nav>
                        <div>
                            <h2 className="gc-h3">Independent guide</h2>
                            <p className="mt-2 text-sm">
                                Anteater is built by an independent developer. It is not affiliated
                                with, endorsed by, or acting for the Government of Canada or the
                                Province of British Columbia.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gc-navy text-white">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                        <p>Unofficial guide. Verify program details on the official sites above.</p>
                        <a href="#wb-cont" className="text-white underline">
                            Top of page
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
