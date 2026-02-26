
export interface ServiceData {
  id: string;
  title: string;
  heading: string;
  subheadings?: string[];
  description?: string;
  content: string[];
  bullets: string[];
  highlight?: string;
  image: string;
  badge?: string; // New: "Trending", "Free Gas Checkup", etc.
}

export enum SectionID {
  REPAIR = 'ac-repair-service-goa',
  CLEANING = 'ac-dry-wet-cleaning-service',
  INSTALL = 'ac-install-uninstall-service',
  GAS = 'ac-gas-refilling-service'
}
