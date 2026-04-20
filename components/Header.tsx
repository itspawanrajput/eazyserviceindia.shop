
import React, { useState, useEffect } from 'react';
import { Search, Phone, Menu, X } from 'lucide-react';
import { KEYWORD_MAPPING, PLACEHOLDERS } from '../constants';
import { SectionID } from '../types';

import Editable from '../src/components/Editable';
import { getSettings } from '../services/api';
import { useVisualBuilder } from '../src/context/VisualBuilderContext';

const Header: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [logoError, setLogoError] = useState(false);
  const { isEditMode } = useVisualBuilder();

  useEffect(() => {
    getSettings().then((settings) => {
      setSiteSettings(settings);
      setLogoError(false); // Reset error when settings reload
    }).catch(console.error);
  }, []);

  // Typewriter effect for animated search bar placeholder
  useEffect(() => {
    const currentFullText = PLACEHOLDERS[placeholderIndex];
    const typingSpeed = isDeleting ? 40 : 80;
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        if (displayText.length === currentFullText.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        if (displayText.length === 0) {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, placeholderIndex]);

  const scrollTo = (id: string) => {
    // Visual builder prefixes service IDs with 'service-'
    // while the live site might just use the raw id (e.g. 'cleaning')
    const prefixedId = (Object.values(SectionID) as string[]).includes(id) ? `service-${id}` : id;
    const element = document.getElementById(prefixedId) || document.getElementById(id);
    
    if (element) {
      const isMobile = window.innerWidth < 1024;
      const headerOffset = isMobile ? 120 : 90;
      
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setMobileMenuOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchValue.toLowerCase().trim();
    if (!query) return;

    let targetId = "";
    for (const [key, id] of Object.entries(KEYWORD_MAPPING)) {
      if (query.includes(key)) {
        targetId = id;
        break;
      }
    }

    if (targetId) {
      scrollTo(targetId);
    }
  };

  return (
    <Editable id="header-section" type="section">
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* 1. Logo Section */}
        <div 
          className="flex items-center shrink-0 cursor-pointer group hover:opacity-90 transition-opacity" 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        >
          <Editable id="header-logo" type="image">
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mr-3">
              {siteSettings.logoUrl && !logoError ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt={siteSettings.siteName || "EazyService Logo"} 
                  className="w-full h-full object-cover rounded-full shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              ) : isEditMode ? (
                <div className="w-full h-full rounded-full bg-slate-200 animate-pulse" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center shadow-sm">
                  <span className="text-white text-[10px] font-black tracking-tight">ES</span>
                </div>
              )}
            </div>
          </Editable>
          <div className="flex flex-col leading-tight justify-center mt-0.5">
            <Editable id="header-brand-name" type="text">
              <span className="text-[20px] md:text-[22px] font-black text-slate-900 tracking-tight leading-none">{siteSettings.siteName || "EazyService"}</span>
            </Editable>
            <Editable id="header-brand-tagline" type="text">
              <span className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-[0.15em] mt-1 leading-none block">{siteSettings.siteTagline || "Expert AC Care"}</span>
            </Editable>
          </div>
        </div>

        {/* 2. Menu Options - Clean and evenly spaced */}
        <nav className="hidden xl:flex items-center justify-center gap-7 lg:gap-10 flex-1 px-4">
          <Editable id="nav-item-1" type="button">
            <button 
              onClick={() => scrollTo(SectionID.INSTALL)} 
              className="text-[14px] font-bold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              Installation
            </button>
          </Editable>
          <Editable id="nav-item-2" type="button">
            <button onClick={() => scrollTo(SectionID.CLEANING)} className="text-[14px] font-bold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap">Service</button>
          </Editable>
          <Editable id="nav-item-3" type="button">
            <button onClick={() => scrollTo(SectionID.REPAIR)} className="text-[14px] font-bold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap">Repair</button>
          </Editable>
          <Editable id="nav-item-4" type="button">
            <button onClick={() => scrollTo(SectionID.GAS)} className="text-[14px] font-bold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap">Gas Charging</button>
          </Editable>
        </nav>

        {/* 3. Action Block - Search Bar + Dash + Book Now + Call */}
        <div className="hidden md:flex items-center shrink-0 gap-3 lg:gap-4">
          
          {/* Search Bar - Refined style */}
          <div className="w-[180px] lg:w-[240px] xl:w-[280px]">
            <form onSubmit={handleSearch} className="relative group w-full flex items-center">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchValue ? "" : displayText}
                className="w-full h-[44px] bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 focus:border-blue-100 rounded-full pl-11 pr-4 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-400 text-[14px] typewriter-cursor font-semibold text-slate-700 shadow-sm leading-none"
              />
            </form>
          </div>

          {/* Dash (Vertical Separator) */}
          <div className="hidden lg:block w-[1px] h-8 bg-slate-200 shrink-0 mx-1"></div>

          {/* Book Now Button */}
          <Editable id="header-book-now" type="button">
            <button 
              onClick={() => scrollTo('booking-form')}
              className="h-[44px] bg-slate-900 text-white px-6 rounded-full font-bold text-[14px] hover:bg-black transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0"
            >
              Book Now
            </button>
          </Editable>

          {/* Call Button */}
          <Editable id="header-call-btn" type="button">
            <a 
              href="tel:+919911481331" 
              className="h-[44px] flex items-center gap-2 bg-[#FD3752] text-white px-5 rounded-full font-bold text-[14px] hover:bg-[#E02D46] transition-all shadow-md hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0"
            >
              <div className="bg-white/20 p-1.5 rounded-full shrink-0">
                <Phone className="w-3.5 h-3.5 fill-white text-white" />
              </div>
              <span className="whitespace-nowrap tracking-wide">+91 9911481331</span>
            </a>
          </Editable>
        </div>

        {/* Mobile Hamburger & Call (Only < MD) */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Mobile Call Button with Number - Matching Desktop style */}
          <a 
            href="tel:+919911481331" 
            className="h-9 flex items-center gap-1.5 bg-[#FD3752] text-white px-2.5 rounded-full font-bold text-[10px] shadow-md shrink-0"
          >
            <div className="bg-white/20 p-1 rounded-full shrink-0">
              <Phone className="w-2.5 h-2.5 fill-white text-white" />
            </div>
            <span className="whitespace-nowrap tracking-tight">+91 9911481331</span>
          </a>
          <button 
            className="p-2 text-slate-900 bg-slate-50 rounded-lg shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Row (Only < MD) */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative w-full">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchValue ? "" : displayText}
            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 text-[14px] typewriter-cursor"
          />
        </form>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full left-0 top-full shadow-2xl p-6 flex flex-col gap-4 z-[110] animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-1">
            <button onClick={() => scrollTo(SectionID.INSTALL)} className="text-left py-4 px-2 font-bold text-slate-700 border-b border-slate-50">Installation/Uninstallation</button>
            <button onClick={() => scrollTo(SectionID.CLEANING)} className="text-left py-4 px-2 font-bold text-slate-700 border-b border-slate-50">Service</button>
            <button onClick={() => scrollTo(SectionID.REPAIR)} className="text-left py-4 px-2 font-bold text-slate-700 border-b border-slate-50">Repair</button>
            <button onClick={() => scrollTo(SectionID.GAS)} className="text-left py-4 px-2 font-bold text-slate-700 border-b border-slate-50">Gas Charging</button>
          </div>
          <button 
            onClick={() => scrollTo('booking-form')}
            className="w-full bg-[#2D2D2D] text-white py-4 rounded-xl font-bold text-lg shadow-xl"
          >
            Book Now
          </button>
        </div>
      )}
    </header>
    </Editable>
  );
};

export default Header;
