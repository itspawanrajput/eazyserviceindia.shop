import { useEffect } from 'react';
import { UAParser } from 'ua-parser-js';

const safelyTrackVisit = async () => {
    // Check if we've already tracked this session in memory
    if (window.sessionStorage.getItem('visit_tracked')) return;

    try {
        const parser = new UAParser();
        const result = parser.getResult();

        // Collect UTM parameters from URL
        const searchParams = new URLSearchParams(window.location.search);
        const utmData: Record<string, string> = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
            const val = searchParams.get(key);
            if (val) utmData[key] = val;
        });

        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_agent: navigator.userAgent,
                browser: `${result.browser.name} ${result.browser.version}`.trim() || 'Unknown Browser',
                os: `${result.os.name} ${result.os.version}`.trim() || 'Unknown OS',
                device_type: result.device.type || 'desktop',
                path: window.location.pathname + window.location.search,
                page_title: document.title,
                referrer: document.referrer || 'direct',
                screen: `${screen.width}x${screen.height}`,
                language: navigator.language || 'unknown',
                ...utmData,
            }),
        });

        window.sessionStorage.setItem('visit_tracked', 'true');
    } catch (error) {
        console.warn('Failed to track visit');
    }
};

export const useVisitorTracking = () => {
    useEffect(() => {
        const timer = setTimeout(() => {
            safelyTrackVisit();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);
};
