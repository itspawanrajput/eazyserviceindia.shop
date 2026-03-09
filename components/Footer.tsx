
import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { GOA_AREAS } from '../constants';

import Editable from '../src/components/Editable';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-slate-800 pb-12">
        
        {/* Brand */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Editable id="footer-logo" type="image">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-800">
                <img 
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop" 
                  alt="EazyService Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Editable>
            <Editable id="footer-brand-name" type="text">
              <span className="text-2xl font-black tracking-tight">EazyService</span>
            </Editable>
          </div>
          <Editable id="footer-brand-desc" type="text">
            <p className="text-slate-400 mb-6">
              Delhi-NCR's most trusted AC service provider. Expert technicians at your doorstep within 20 minutes.
            </p>
          </Editable>

          {/* Social Icons — each wrapped as Editable type="social" */}
          <div className="flex space-x-4">
            <Editable id="footer-social-facebook" type="social">
              <a 
                href="https://www.facebook.com/eazyserviceindia/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </Editable>

            <Editable id="footer-social-instagram" type="social">
              <a 
                href="https://www.instagram.com/eazyserviceindia/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </Editable>

            <Editable id="footer-social-whatsapp" type="social">
              <a 
                href="https://wa.link/50lzkv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-green-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </Editable>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-lg mb-6">Quick Links</h4>
          <ul className="space-y-4 text-slate-400">
            <li><a href="#repair" className="hover:text-blue-500 transition-colors">AC Repair</a></li>
            <li><a href="#cleaning" className="hover:text-blue-500 transition-colors">AC Cleaning</a></li>
            <li><a href="#install" className="hover:text-blue-500 transition-colors">AC Installation</a></li>
            <li><a href="#gas" className="hover:text-blue-500 transition-colors">AC Gas Refill</a></li>
            <li><a href="#booking-form" className="hover:text-blue-500 transition-colors">Book a Service</a></li>
          </ul>
        </div>

        {/* Areas */}
        <div>
          <h4 className="font-bold text-lg mb-6">Service Areas</h4>
          <div className="flex flex-wrap gap-2">
            {GOA_AREAS.map(area => (
              <span key={area} className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-400">
                {area}
              </span>
            ))}
            <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-400">Across Delhi-NCR</span>
          </div>
        </div>

        {/* Contact */}
        <div>
          <Editable id="footer-contact-title" type="text">
            <h4 className="font-bold text-lg mb-6">Contact Info</h4>
          </Editable>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-blue-500" />
              <Editable id="footer-phone" type="text">
                <a href="tel:+919911481331">+91 9911481331</a>
              </Editable>
            </li>
            <li className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-blue-500" />
              <Editable id="footer-email" type="text">
                <a href="mailto:info@eazyservice.in">info@eazyservice.in</a>
              </Editable>
            </li>
            <li className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-blue-500 mt-1" />
              <Editable id="footer-address" type="text">
                <span>Connaught Place, New Delhi, 110001</span>
              </Editable>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-slate-800 rounded-xl text-sm">
            <p className="font-bold text-white mb-1">Business Hours:</p>
            <p>Mon - Sun: 8:00 AM - 10:00 PM</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} EazyService AC Services. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
