
import React from 'react';
import { ArrowRight, Phone, Check } from 'lucide-react';
import { ServiceData } from '../types';
import { motion } from 'motion/react';

interface Props {
  service: ServiceData;
  alternate: boolean;
}

const ServiceSection: React.FC<Props> = ({ service, alternate }) => {
  // Split heading into parts to colorize (mimicking the style the user liked)
  const words = service.heading.split(' ');
  const firstPart = words.slice(0, words.length - 2).join(' ');
  const highlightPart = words.slice(words.length - 2).join(' ');

  return (
    <section id={service.id} className={`py-12 md:py-20 ${alternate ? 'bg-white' : 'bg-[#fcfcf9]'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex flex-col ${alternate ? 'md:flex-row' : 'md:flex-row-reverse'} items-stretch gap-8 lg:gap-16`}>
          
          {/* Image Side with Large Rounded Corners & Transparent Strip */}
          <div className="w-full md:w-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative group"
            >
              {/* The Image with Large Rounded Corners (Pill-like) */}
              <div className="overflow-hidden rounded-[40px] md:rounded-[50px] shadow-xl aspect-[4/3] md:aspect-square lg:aspect-[4/3]">
                <img 
                  src={service.image} 
                  alt={service.heading} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Bottom Status Strip */}
              <div className="absolute bottom-4 left-4 right-4 bg-blue-600/90 backdrop-blur-sm py-1 md:py-1.5 px-3 rounded-xl border border-white/10 shadow-lg overflow-hidden">
                <div className="animate-marquee-strip flex items-center">
                  {/* Repeated content for seamless marquee */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-8 md:gap-12 pr-8 md:pr-12 shrink-0">
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 text-blue-600" />
                        </div>
                        <span className="text-[7px] md:text-[10px] font-black text-white uppercase tracking-tighter md:tracking-normal whitespace-nowrap">Super-fast Visit 20 min</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 text-blue-600" />
                        </div>
                        <span className="text-[7px] md:text-[10px] font-black text-white uppercase tracking-tighter md:tracking-normal whitespace-nowrap">Doorstep Service</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-2 h-2 text-blue-600" />
                        </div>
                        <span className="text-[7px] md:text-[10px] font-black text-white uppercase tracking-tighter md:tracking-normal whitespace-nowrap">1-month repeat Free visit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Text Content Side - Constrained to image height */}
          <div className="w-full md:w-1/2 flex flex-col py-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-between h-full"
            >
              <div>
                {/* Heading - Slightly larger on desktop, 2-color */}
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  {firstPart} <span className="text-blue-600">{highlightPart}</span>
                </h2>

                {/* Common Problems (Short Tags) - Stylized 2-column grid on desktop */}
                <div className="flex flex-wrap md:grid md:grid-cols-2 gap-x-6 gap-y-3 mb-6">
                  {service.content.map((item, idx) => (
                    <div key={idx} className="flex items-center group">
                      <div className="w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center mr-3 border border-blue-100 group-hover:bg-blue-600 transition-colors hidden md:flex">
                        <Check className="w-3 h-3 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <span className="bg-blue-50 md:bg-transparent text-blue-700 md:text-slate-700 px-2 py-0.5 md:px-0 md:py-0 rounded-md md:rounded-none text-[9px] md:text-xs uppercase font-black tracking-wider border border-blue-100 md:border-none">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description - Slightly larger on desktop, same on mobile */}
                {service.description && (
                  <p className="text-slate-500 text-xs md:text-[15px] leading-relaxed max-w-lg">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Buttons - Slightly larger on desktop, same on mobile */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <motion.a 
                  href="#booking-form"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-slate-900 text-white px-6 py-3 md:px-10 md:py-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all"
                >
                  Book Now
                  <ArrowRight className="ml-2 w-3.5 h-3.5 md:w-4 md:h-4" />
                </motion.a>
                
                <motion.a 
                  href="tel:+911234567890"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-50 text-blue-600 border border-blue-100 px-6 py-3 md:px-10 md:py-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group"
                >
                  <Phone className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-600 group-hover:text-white transition-colors" />
                  Call Now
                </motion.a>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ServiceSection;
