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

export function getSiteContent(): SiteContent {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function updateSiteContent(updates: Partial<SiteContent>): SiteContent {
  const current = getSiteContent();
  const updated = { ...current, ...updates };
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
