import { useEffect } from 'react';
import { UAParser } from 'ua-parser-js';

const safelyTrackVisit = async () => {
    // Check if we've already tracked this session in memory
    if (window.sessionStorage.getItem('visit_tracked')) return;

    try {
        const parser = new UAParser();
        const result = parser.getResult();

        await fetch('/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_agent: navigator.userAgent,
                browser: `${result.browser.name} ${result.browser.version}`.trim() || 'Unknown Browser',
                os: `${result.os.name} ${result.os.version}`.trim() || 'Unknown OS',
                device_type: result.device.type || 'desktop',
                path: window.location.pathname,
            }),
        });

        // Mark as tracked for this session so we don't spam the API on navigation
        window.sessionStorage.setItem('visit_tracked', 'true');
    } catch (error) {
        // Fail silently - analytics shouldn't break the user experience
        console.warn('Failed to track visit');
    }
};

export const useVisitorTracking = () => {
    useEffect(() => {
        // Small delay to ensure the page has loaded and we don't block render
        const timer = setTimeout(() => {
            safelyTrackVisit();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);
};
