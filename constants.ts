
import { SectionID, ServiceData } from './types';

export const SERVICES: ServiceData[] = [
  {
    id: SectionID.CLEANING,
    title: "Service",
    heading: "Deep AC Dry & Wet Cleaning.",
    description: "Breathe healthier air with our comprehensive cleaning service. We use eco-friendly chemicals and high-pressure pumps to remove every speck of dust and mold.",
    subheadings: [
      "Deep cleaning for better air quality.",
      "Eco-friendly chemicals and high-pressure wash."
    ],
    badge: "Free Gas Checkup",
    content: [
      "Coil Cleaning",
      "Drain Flush",
      "Dust Removal",
      "Filter Wash",
      "Outdoor Unit"
    ],
    bullets: [
      "Better Cooling",
      "Lower Bills",
      "No Odors"
    ],
    highlight: "Regular servicing improves cooling efficiency by up to 40%.",
    image: "https://picsum.photos/seed/cleaning/1200/800"
  },
  {
    id: SectionID.REPAIR,
    title: "Repair",
    heading: "Fast & Reliable AC Repair Services.",
    description: "Don't let the heat get to you. Our expert team diagnoses and fixes all AC issues within hours, ensuring your comfort is restored immediately.",
    subheadings: [
      "Fast, reliable & affordable AC repair at your doorstep.",
      "Same-day service across Goa by certified technicians."
    ],
    badge: "Assured Cooling",
    content: [
      "No Cooling",
      "Water Leak",
      "Gas Leak",
      "Loud Noise",
      "No Power"
    ],
    bullets: [
      "Same-Day Fix",
      "Local Experts",
      "Fair Pricing"
    ],
    image: "https://picsum.photos/seed/repair/1200/800"
  },
  {
    id: SectionID.INSTALL,
    title: "Installation/Uninstallation",
    heading: "Expert AC Installation & Uninstallation.",
    description: "We provide seamless setup and relocation for all major AC brands. Our technicians ensure perfect alignment and leak-proof fitting for long-lasting performance.",
    subheadings: [
      "Professional setup for all AC brands.",
      "Safe uninstallation and relocation services."
    ],
    badge: "Trending",
    content: [
      "Split AC",
      "Window AC",
      "AC Shifting",
      "Copper Pipe",
      "Wall Mount"
    ],
    bullets: [
      "Certified Techs",
      "90-Day Warranty",
      "No Hidden Fees"
    ],
    image: "https://picsum.photos/seed/install/1200/800"
  },
  {
    id: SectionID.GAS,
    title: "Gas Charging",
    heading: "Premium AC Gas Refilling.",
    description: "Restore your AC's cooling power with genuine refrigerant gas. We perform thorough leak detection before refilling to ensure a permanent solution.",
    subheadings: [
      "Genuine refrigerant gas for all models.",
      "Leak detection and pressure testing included."
    ],
    badge: "Upto 60% off",
    content: [
      "R22 Refill",
      "R32 Refill",
      "R410A Refill",
      "Pressure Check",
      "Leak Detect"
    ],
    bullets: [
      "Full Charge",
      "Leak Repair",
      "Cooling Guarantee"
    ],
    image: "https://picsum.photos/seed/gas/1200/800"
  }
];

export const KEYWORD_MAPPING: Record<string, SectionID> = {
  repair: SectionID.REPAIR,
  fix: SectionID.REPAIR,
  cooling: SectionID.REPAIR,
  leakage: SectionID.REPAIR,
  issue: SectionID.REPAIR,
  compressor: SectionID.REPAIR,
  cleaning: SectionID.CLEANING,
  service: SectionID.CLEANING,
  dry: SectionID.CLEANING,
  wet: SectionID.CLEANING,
  coil: SectionID.CLEANING,
  filter: SectionID.CLEANING,
  install: SectionID.INSTALL,
  uninstall: SectionID.INSTALL,
  shifting: SectionID.INSTALL,
  fitting: SectionID.INSTALL,
  gas: SectionID.GAS,
  refill: SectionID.GAS,
  r32: SectionID.GAS,
  r410a: SectionID.GAS,
  r22: SectionID.GAS,
};

export const PLACEHOLDERS = [
  "AC Dry & Wet Cleaning Service",
  "AC Repair Service Delhi-NCR",
  "AC Install & Uninstall Service",
  "AC Gas Refilling Service"
];

export const GOA_AREAS = [
  "Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"
];
