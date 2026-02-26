
import React, { useState, useEffect } from 'react';
import { Search, Phone, Menu, X } from 'lucide-react';
import { KEYWORD_MAPPING, PLACEHOLDERS } from '../constants';
import { SectionID } from '../types';

const Header: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const element = document.getElementById(id);
    if (element) {
      const isMobile = window.innerWidth < 1024;
      const headerOffset = isMobile ? 130 : 100;
      
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
    <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-[1550px] mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between">
        
        {/* 1. Logo Section */}
        <div 
          className="flex items-center shrink-0 cursor-pointer group" 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        >
          <div className="relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center mr-1.5 md:mr-2">
             <div className="absolute inset-0 border-[1px] border-slate-200 rounded-full"></div>
             <div className="absolute inset-[2px] border-[1.5px] border-slate-800 rounded-full border-t-transparent -rotate-45"></div>
             <span className="text-lg md:text-xl font-black text-[#1A202C] z-10 font-sans tracking-tight">99</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl md:text-2xl font-bold text-[#2D3748] tracking-tight">Logos</span>
            <span className="text-[8px] md:text-[9px] font-bold text-[#718096] self-start uppercase tracking-wider">BY COOLDELHI</span>
          </div>
        </div>

        {/* 2. Menu Options - Precisely in the middle of Logo and Search Bar */}
        <nav className="hidden xl:flex items-center justify-center gap-8 flex-1 px-8">
          <button 
            onClick={() => scrollTo(SectionID.INSTALL)} 
            className="flex flex-col items-center justify-center text-[13px] font-bold text-slate-600 hover:text-blue-600 transition-colors leading-tight whitespace-nowrap"
          >
            <span>Installation/</span>
            <span>Uninstallation</span>
          </button>
          <button onClick={() => scrollTo(SectionID.CLEANING)} className="text-[14px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Service</button>
          <button onClick={() => scrollTo(SectionID.REPAIR)} className="text-[14px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Repair</button>
          <button onClick={() => scrollTo(SectionID.GAS)} className="text-[14px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Gas Charging</button>
        </nav>

        {/* 3. Action Block - Search Bar + Dash + Book Now + Call */}
        <div className="hidden md:flex items-center shrink-0 gap-3">
          
          {/* Search Bar - Shifted 2px down as requested */}
          <div className="w-[200px] lg:w-[240px] xl:w-[260px] translate-y-[2px]">
            <form onSubmit={handleSearch} className="relative group w-full flex items-center">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchValue ? "" : displayText}
                className="w-full h-11 bg-[#F8FAFC] border border-slate-200 rounded-full pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-[14px] typewriter-cursor font-medium shadow-sm leading-none"
              />
            </form>
          </div>

          {/* Dash (Vertical Separator) - Left of Book Now */}
          <div className="w-[1px] h-6 bg-slate-300 mx-1 shrink-0"></div>

          {/* Book Now Button */}
          <button 
            onClick={() => scrollTo('booking-form')}
            className="h-11 bg-[#2D2D2D] text-white px-6 rounded-full font-bold text-[14px] hover:bg-black transition-all active:scale-95 shadow-md shrink-0"
          >
            Book Now
          </button>

          {/* Call Button */}
          <a 
            href="tel:+919999999999" 
            className="h-11 flex items-center gap-2 bg-[#FD3752] text-white px-5 rounded-full font-bold text-sm hover:bg-[#e02d46] transition-all shadow-lg active:scale-95 shrink-0"
          >
            <div className="bg-white/20 p-1 rounded-full shrink-0">
              <Phone className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <span className="whitespace-nowrap tracking-wide">+91 9999999999</span>
          </a>
        </div>

        {/* Mobile Hamburger & Call (Only < MD) */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Mobile Call Button with Number - Matching Desktop style */}
          <a 
            href="tel:+919999999999" 
            className="h-9 flex items-center gap-1.5 bg-[#FD3752] text-white px-2.5 rounded-full font-bold text-[10px] shadow-md shrink-0"
          >
            <div className="bg-white/20 p-1 rounded-full shrink-0">
              <Phone className="w-2.5 h-2.5 fill-white text-white" />
            </div>
            <span className="whitespace-nowrap tracking-tight">+91 9999999999</span>
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
  );
};

export default Header;
