
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
  CLEANING = 'Deep_AC_Dry_&_Wet_Cleaning',
  REPAIR = 'Fast_&_Reliable_AC_Repair_Services',
  INSTALL = 'Expert_AC_Installation_&_Uninstallation',
  GAS = 'Premium_AC_Gas_Refilling'
}
