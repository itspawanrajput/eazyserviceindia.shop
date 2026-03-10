
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
  CLEANING = 'cleaning',
  REPAIR = 'repair',
  INSTALL = 'install',
  GAS = 'gas'
}
