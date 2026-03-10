
import React from 'react';
import { Star } from 'lucide-react';
import { SERVICES } from '../constants';
import { SectionID } from '../types';
import HeroForm from './HeroForm';
import Editable from '../src/components/Editable';

const Hero: React.FC = () => {
  const scrollTo = (id: SectionID) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = window.innerWidth < 1024 ? 130 : 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };
  
  return (
    <Editable id="hero-section" type="section">
      <section className="bg-white pb-8 md:pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto md:px-4">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 md:pt-10">
          
          {/* Left Side: Service Details */}
          <div className="w-full md:w-1/2 px-4 md:px-0 order-2 md:order-1 md:pt-8">
            <Editable id="hero-title" type="text">
              <h1 className="text-4xl md:text-6xl font-black text-[#464646] leading-tight mb-2">
                Best AC Service & Repair in Delhi-NCR
              </h1>
            </Editable>
            
            <div className="flex items-center space-x-2 mb-8">
              <Editable id="hero-rating" type="text">
                <div className="flex items-center bg-yellow-400/20 px-1.5 py-0.5 rounded">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 mr-1" />
                  <span className="font-bold text-sm text-slate-800">4.8</span>
                </div>
              </Editable>
              <Editable id="hero-bookings" type="text">
                <span className="text-slate-500 text-sm">(3.8M bookings near you)</span>
              </Editable>
            </div>
            
            {/* Service Icons Grid */}
            <div className="grid grid-cols-4 gap-2 mb-10">
              {SERVICES.map((service) => (
                <div key={service.id} className="flex flex-col items-center group relative pt-4">
                  <div 
                    onClick={() => scrollTo(service.id as SectionID)}
                    className="flex flex-col items-center cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        scrollTo(service.id as SectionID);
                      }
                    }}
                  >
                    {service.badge && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-[#FFF1DB] text-[#D19234] text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border border-[#F6E2C2] shadow-sm">
                          {service.badge}
                        </span>
                      </div>
                    )}

                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F8F9FF] rounded-full flex items-center justify-center mb-2 border border-slate-50 transition-all group-hover:bg-blue-50 group-hover:scale-105">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Editable id={`hero-icon-${service.id}`} type="icon">
                          <div className="w-10 h-10 flex items-center justify-center">
                            {/* Installation Icon */}
                            {service.id === SectionID.INSTALL && (
                              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="8" y="24" width="42" height="18" rx="4" fill="#6B72D6" />
                                <rect x="24" y="32" width="10" height="2" fill="#C7D2FE" />
                                <path d="M25 45 C15 35 45 10 55 25" stroke="#FD3752" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                                <g transform="translate(48, 40)">
                                  <circle cx="0" cy="0" r="5" fill="#FD3752" />
                                  {[0, 90, 180, 270].map(deg => (
                                    <rect key={deg} x="-1.5" y="-7" width="3" height="3" fill="#FD3752" transform={`rotate(${deg})`} />
                                  ))}
                                </g>
                              </svg>
                            )}

                            {/* Cleaning Icon */}
                            {service.id === SectionID.CLEANING && (
                              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="12" y="26" width="42" height="18" rx="6" fill="#6B72D6" />
                                <rect x="28" y="33" width="10" height="3" rx="1.5" fill="#C7D2FE" />
                                <g transform="translate(10, 12)">
                                   <path d="M8 8 L18 18" stroke="#FD3752" strokeWidth="6" strokeLinecap="round" />
                                   <rect x="4" y="4" width="8" height="10" rx="2" fill="#FD3752" transform="rotate(-45)" />
                                </g>
                                <path d="M52 25 L54 28 L56 25 L54 22 Z" fill="#FD3752" />
                              </svg>
                            )}

                            {/* Repair Icon */}
                            {service.id === SectionID.REPAIR && (
                              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="18" y="25" width="38" height="18" rx="4" fill="#6B72D6" />
                                <rect x="34" y="33" width="8" height="2" fill="#C7D2FE" />
                                <g transform="translate(18, 34)">
                                  <path d="M-2 -12 A 14 14 0 1 0 -2 12" fill="#FD3752" />
                                  {[0, 90, 180, 270].map(deg => (
                                    <rect key={deg} x="-18" y="-3" width="6" height="6" rx="1" fill="#FD3752" transform={`rotate(${deg})`} />
                                  ))}
                                </g>
                              </svg>
                            )}

                            {/* Gas Icon */}
                            {service.id === SectionID.GAS && (
                              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="10" y="20" width="38" height="24" rx="3" fill="#6B72D6" />
                                <circle cx="22" cy="32" r="9" fill="#C7D2FE" />
                                <rect x="38" y="35" width="16" height="22" rx="4" fill="#FD3752" />
                                <path d="M42 35 V30 C42 28 50 28 50 30 V35" stroke="#FD3752" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>
                        </Editable>
                      </div>
                    </div>

                    <Editable id={`hero-service-title-${service.id}`} type="text">
                      <span className="text-[10px] md:text-[12px] font-bold text-center text-[#464646] leading-tight px-1 group-hover:text-blue-600 flex flex-col items-center">
                        {service.title === "Installation/Uninstallation" ? (
                          <>
                            <span>Installation/</span>
                            <span>Uninstallation</span>
                          </>
                        ) : service.title}
                      </span>
                    </Editable>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Marketing Banner & Form */}
          <div className="w-full md:w-1/2 order-1 md:order-2 px-4 md:px-0">
            <Editable id="hero-form-container" type="section">
              <div className="relative min-h-[500px] md:min-h-[600px] rounded-2xl md:rounded-3xl overflow-hidden bg-[#78544B] shadow-2xl group flex items-center justify-center p-6 md:p-10">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000&auto=format&fit=crop" 
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent"></div>
                </div>

                <HeroForm />
              </div>
            </Editable>
          </div>
        </div>
      </div>
    </section>
  </Editable>
);
};

export default Hero;
