import { useEffect, useState } from 'react';

interface TrackingData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
  referrer: string;
  landing_page: string;
}

export const useTracking = () => {
  const [trackingData, setTrackingData] = useState<TrackingData>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    gclid: '',
    fbclid: '',
    referrer: '',
    landing_page: '',
  });

  useEffect(() => {
    // Only run once on mount
    const searchParams = new URLSearchParams(window.location.search);
    
    // Parse URL params
    const utm_source = searchParams.get('utm_source') || '';
    const utm_medium = searchParams.get('utm_medium') || '';
    const utm_campaign = searchParams.get('utm_campaign') || '';
    const utm_term = searchParams.get('utm_term') || '';
    const gclid = searchParams.get('gclid') || '';
    const fbclid = searchParams.get('fbclid') || '';
    
    // Get document info
    const referrer = document.referrer || '';
    const landing_page = window.location.href;

    setTrackingData({
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      gclid,
      fbclid,
      referrer,
      landing_page
    });
  }, []);

  return trackingData;
};
