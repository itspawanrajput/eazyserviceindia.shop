
import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, ArrowUpRight, Zap } from 'lucide-react';
import Editable from '../src/components/Editable';
import { getSettings } from '../services/api';

const Footer: React.FC = () => {
  const [siteSettings, setSiteSettings] = React.useState<any>({});

  React.useEffect(() => {
    getSettings().then(setSiteSettings).catch(console.error);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[80px] bg-blue-500/5 rounded-full blur-3xl"></div>

      {/* CTA Strip */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <Editable id="footer-cta-title" type="text">
                <h3 className="text-xl md:text-2xl font-black">Need AC Service? Get a Callback in 10 Minutes</h3>
              </Editable>
              <Editable id="footer-cta-subtitle" type="text">
                <p className="text-slate-400 text-sm mt-1">Expert technicians available 7 days a week across Delhi-NCR</p>
              </Editable>
            </div>
          </div>
          <a
            href="#booking-form"
            className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Book Now
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:pr-8">
            <div className="flex items-center space-x-3 mb-5">
              <Editable id="footer-logo" type="image">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                  <img
                    src={siteSettings.logoUrl || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop"}
                    alt={siteSettings.siteName || "EazyService Logo"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </Editable>
              <Editable id="footer-brand-name" type="text">
                <span className="text-xl font-black tracking-tight">{siteSettings.siteName || "EazyService"}</span>
              </Editable>
            </div>
            <Editable id="footer-brand-desc" type="text">
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Delhi-NCR's most trusted AC service provider. Expert technicians at your doorstep within 20 minutes.
              </p>
            </Editable>

            {/* Social Icons */}
            <div className="flex space-x-3">
              <Editable id="footer-social-facebook" type="social">
                <a
                  href="https://www.facebook.com/eazyserviceindia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:scale-110 transition-all duration-300"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </Editable>

              <Editable id="footer-social-instagram" type="social">
                <a
                  href="https://www.instagram.com/eazyserviceindia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:border-pink-400 hover:scale-110 transition-all duration-300"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </Editable>

              <Editable id="footer-social-whatsapp" type="social">
                <a
                  href="https://wa.link/50lzkv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-green-500 hover:border-green-400 hover:scale-110 transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </Editable>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <Editable id="footer-quicklinks-title" type="text">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Quick Links</h4>
            </Editable>
            <ul className="space-y-3">
              {[
                { id: 'footer-link-repair', label: 'AC Repair', href: '#repair' },
                { id: 'footer-link-cleaning', label: 'AC Cleaning', href: '#cleaning' },
                { id: 'footer-link-install', label: 'AC Installation', href: '#install' },
                { id: 'footer-link-gas', label: 'AC Gas Refill', href: '#gas' },
                { id: 'footer-link-booking', label: 'Book a Service', href: '#booking-form' },
              ].map(link => (
                <li key={link.id}>
                  <Editable id={link.id} type="link">
                    <a
                      href={link.href}
                      className="group flex items-center text-slate-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mr-3 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-300"></span>
                      {link.label}
                    </a>
                  </Editable>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <Editable id="footer-areas-title" type="text">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Service Areas</h4>
            </Editable>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'footer-area-1', label: 'Delhi' },
                { id: 'footer-area-2', label: 'Gurgaon' },
                { id: 'footer-area-3', label: 'Noida' },
                { id: 'footer-area-4', label: 'Faridabad' },
                { id: 'footer-area-5', label: 'Ghaziabad' },
              ].map(area => (
                <Editable key={area.id} id={area.id} type="text">
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300 transition-all duration-300 cursor-default">
                    {area.label}
                  </span>
                </Editable>
              ))}
              <Editable id="footer-area-highlight" type="text">
                <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-bold text-blue-400">
                  Across Delhi-NCR
                </span>
              </Editable>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-center group">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-blue-400" />
                </div>
                <Editable id="footer-phone" type="text">
                  <a href={`tel:${siteSettings.contactPhone?.replace(/\s/g, '') || '+919911481331'}`} className="text-sm text-slate-300 hover:text-white transition-colors font-medium">{siteSettings.contactPhone || "+91 9911481331"}</a>
                </Editable>
              </li>
              <li className="flex items-center group">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <Editable id="footer-email" type="text">
                  <a href={`mailto:${siteSettings.contactEmail || 'info@eazyservice.in'}`} className="text-sm text-slate-300 hover:text-white transition-colors font-medium">{siteSettings.contactEmail || "info@eazyservice.in"}</a>
                </Editable>
              </li>
              <li className="flex items-start group">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-blue-500/20 transition-colors shrink-0">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <Editable id="footer-address" type="text">
                  <span className="text-sm text-slate-300 font-medium leading-relaxed">Connaught Place, New Delhi, 110001</span>
                </Editable>
              </li>
            </ul>

            {/* Business Hours */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-300">Business Hours</span>
              </div>
              <p className="text-sm text-slate-300 font-medium">Mon – Sun: 8:00 AM – 10:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} EazyService AC Services. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</a>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</a>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <button onClick={scrollToTop} className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 group">
              Back to top
              <ArrowUpRight className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
