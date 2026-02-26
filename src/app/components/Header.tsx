'use client';
import { useState, useEffect } from 'react';
import { Search, Phone, Menu, X } from 'lucide-react';
import { ContactData } from '@/lib/data';

interface HeaderProps {
    brand: { name: string; tagline: string };
    contact: ContactData;
    searchPlaceholders: string[];
    serviceIds: { id: string; title: string }[];
}

export default function Header({ brand, contact, searchPlaceholders, serviceIds }: HeaderProps) {
    const [searchValue, setSearchValue] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (searchPlaceholders.length === 0) return;
        const currentFullText = searchPlaceholders[placeholderIndex];
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
                    setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
                }
            }
        }, typingSpeed);

        return () => clearTimeout(timer);
    }, [displayText, isDeleting, placeholderIndex, searchPlaceholders]);

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const isMobile = window.innerWidth < 1024;
            const headerOffset = isMobile ? 130 : 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchValue.toLowerCase().trim();
        if (!query) return;
        const keywords: Record<string, string> = {
            repair: 'ac-repair-service', fix: 'ac-repair-service', cooling: 'ac-repair-service',
            cleaning: 'ac-dry-wet-cleaning-service', service: 'ac-dry-wet-cleaning-service',
            install: 'ac-install-uninstall-service', uninstall: 'ac-install-uninstall-service',
            gas: 'ac-gas-refilling-service', refill: 'ac-gas-refilling-service',
        };
        for (const [key, id] of Object.entries(keywords)) {
            if (query.includes(key)) { scrollTo(id); break; }
        }
    };

    return (
        <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
            <div className="max-w-[1550px] mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between">
                <div className="flex items-center shrink-0 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center mr-1.5 md:mr-2">
                        <div className="absolute inset-0 border-[1px] border-slate-200 rounded-full"></div>
                        <div className="absolute inset-[2px] border-[1.5px] border-slate-800 rounded-full border-t-transparent -rotate-45"></div>
                        <span className="text-lg md:text-xl font-black text-[#1A202C] z-10 font-sans tracking-tight">ES</span>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-xl md:text-2xl font-bold text-[#2D3748] tracking-tight">{brand.name}</span>
                        <span className="text-[8px] md:text-[9px] font-bold text-[#718096] self-start uppercase tracking-wider">{brand.tagline}</span>
                    </div>
                </div>

                <nav className="hidden xl:flex items-center justify-center gap-8 flex-1 px-8">
                    {serviceIds.map((s) => (
                        <button key={s.id} onClick={() => scrollTo(s.id)} className="text-[14px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                            {s.title}
                        </button>
                    ))}
                </nav>

                <div className="hidden md:flex items-center shrink-0 gap-3">
                    <div className="w-[200px] lg:w-[240px] xl:w-[260px] translate-y-[2px]">
                        <form onSubmit={handleSearch} className="relative group w-full flex items-center">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={searchValue ? "" : displayText}
                                className="w-full h-11 bg-[#F8FAFC] border border-slate-200 rounded-full pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-[14px] typewriter-cursor font-medium shadow-sm leading-none" />
                        </form>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-300 mx-1 shrink-0"></div>
                    <button onClick={() => scrollTo('booking-form')} className="h-11 bg-[#2D2D2D] text-white px-6 rounded-full font-bold text-[14px] hover:bg-black transition-all active:scale-95 shadow-md shrink-0">Book Now</button>
                    <a href={contact.phoneLink} className="h-11 flex items-center gap-2 bg-[#FD3752] text-white px-5 rounded-full font-bold text-sm hover:bg-[#e02d46] transition-all shadow-lg active:scale-95 shrink-0">
                        <div className="bg-white/20 p-1 rounded-full shrink-0"><Phone className="w-3.5 h-3.5 fill-white text-white" /></div>
                        <span className="whitespace-nowrap tracking-wide">{contact.phone}</span>
                    </a>
                </div>

                <div className="flex md:hidden items-center gap-1.5">
                    <a href={contact.phoneLink} className="h-9 flex items-center gap-1.5 bg-[#FD3752] text-white px-2.5 rounded-full font-bold text-[10px] shadow-md shrink-0">
                        <div className="bg-white/20 p-1 rounded-full shrink-0"><Phone className="w-2.5 h-2.5 fill-white text-white" /></div>
                        <span className="whitespace-nowrap tracking-tight">{contact.phone}</span>
                    </a>
                    <button className="p-2 text-slate-900 bg-slate-50 rounded-lg shrink-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className="md:hidden px-4 pb-3">
                <form onSubmit={handleSearch} className="relative w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2"><Search className="w-4 h-4 text-slate-400" /></div>
                    <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={searchValue ? "" : displayText}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 text-[14px] typewriter-cursor" />
                </form>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 absolute w-full left-0 top-full shadow-2xl p-6 flex flex-col gap-4 z-[110]">
                    <div className="flex flex-col gap-1">
                        {serviceIds.map((s) => (
                            <button key={s.id} onClick={() => scrollTo(s.id)} className="text-left py-4 px-2 font-bold text-slate-700 border-b border-slate-50">{s.title}</button>
                        ))}
                    </div>
                    <button onClick={() => scrollTo('booking-form')} className="w-full bg-[#2D2D2D] text-white py-4 rounded-xl font-bold text-lg shadow-xl">Book Now</button>
                </div>
            )}
        </header>
    );
}
