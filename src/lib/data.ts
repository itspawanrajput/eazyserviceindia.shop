import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'site-content.json');

export interface ServiceData {
  id: string;
  title: string;
  heading: string;
  description: string;
  subheadings: string[];
  badge: string;
  content: string[];
  bullets: string[];
  highlight: string;
  image: string;
}

export interface ReviewData {
  name: string;
  location: string;
  text: string;
}

export interface FAQData {
  q: string;
  a: string;
}

export interface BrandData {
  name: string;
  tagline: string;
  heroHeadline: string;
  heroRating: string;
  heroBookingCount: string;
  heroBackgroundImage: string;
  heroPersonImage: string;
  vipText: string;
}

export interface ContactData {
  phone: string;
  phoneLink: string;
  email: string;
  address: string;
  whatsapp: string;
  businessHours: string;
  facebook: string;
  instagram: string;
  twitter: string;
}

export interface SiteContent {
  brand: BrandData;
  contact: ContactData;
  serviceAreas: string[];
  services: ServiceData[];
  reviews: ReviewData[];
  faqs: FAQData[];
  searchPlaceholders: string[];
}

const FALLBACK_CONTENT: SiteContent = {
  brand: { name: "EazyService", tagline: "BY EAZYSERVICE INDIA", heroHeadline: "Best AC Service & Repair in Delhi-NCR", heroRating: "4.8", heroBookingCount: "3.8M bookings near you", heroBackgroundImage: "", heroPersonImage: "", vipText: "Save upto 15% off on cleaning, plumbing and ac services" },
  contact: { phone: "+91 9999999999", phoneLink: "tel:+919999999999", email: "info@eazyserviceindia.shop", address: "Delhi, 110001", whatsapp: "919999999999", businessHours: "Mon - Sun: 8:00 AM - 10:00 PM", facebook: "#", instagram: "#", twitter: "#" },
  serviceAreas: ["Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
  services: [],
  reviews: [],
  faqs: [],
  searchPlaceholders: ["AC Service", "AC Repair"],
};

export function getSiteContent(): SiteContent {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      DATA_FILE,
      path.resolve('./data/site-content.json'),
      path.join(__dirname, '..', '..', 'data', 'site-content.json'),
      path.join(__dirname, '..', '..', '..', 'data', 'site-content.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      }
    }

    console.error('[DATA] site-content.json not found at any path. CWD:', process.cwd(), 'Tried:', possiblePaths);
    return FALLBACK_CONTENT;
  } catch (err) {
    console.error('[DATA] Error reading site-content.json:', err);
    return FALLBACK_CONTENT;
  }
}

export function updateSiteContent(updates: Partial<SiteContent>): SiteContent {
  try {
    const current = getSiteContent();
    const updated = { ...current, ...updates };

    const possiblePaths = [
      DATA_FILE,
      path.resolve('./data/site-content.json'),
    ];

    for (const p of possiblePaths) {
      try {
        // Ensure directory exists
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(p, JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
      } catch {
        continue;
      }
    }

    console.error('[DATA] Could not write to any path');
    return updated;
  } catch (err) {
    console.error('[DATA] Error updating content:', err);
    return getSiteContent();
  }
}
