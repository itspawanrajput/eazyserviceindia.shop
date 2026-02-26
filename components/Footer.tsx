
import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { GOA_AREAS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-slate-800 pb-12">
        
        {/* Brand */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">CoolDelhi</span>
          </div>
          <p className="text-slate-400 mb-6">
            Delhi-NCR's most trusted AC service provider. Expert technicians at your doorstep within 20 minutes.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-lg mb-6">Quick Links</h4>
          <ul className="space-y-4 text-slate-400">
            <li><a href="#ac-repair-service-goa" className="hover:text-blue-500 transition-colors">AC Repair</a></li>
            <li><a href="#ac-dry-wet-cleaning-service" className="hover:text-blue-500 transition-colors">AC Cleaning</a></li>
            <li><a href="#ac-install-uninstall-service" className="hover:text-blue-500 transition-colors">AC Installation</a></li>
            <li><a href="#ac-gas-refilling-service" className="hover:text-blue-500 transition-colors">AC Gas Refill</a></li>
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
          <h4 className="font-bold text-lg mb-6">Contact Info</h4>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-blue-500" />
              <a href="tel:+911234567890">+91 123 456 7890</a>
            </li>
            <li className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-blue-500" />
              <a href="mailto:info@coolgoa.com">info@coolgoa.com</a>
            </li>
            <li className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-blue-500 mt-1" />
              <span>Connaught Place, New Delhi, 110001</span>
            </li>
          </ul>
          <div className="mt-6 p-4 bg-slate-800 rounded-xl text-sm">
            <p className="font-bold text-white mb-1">Business Hours:</p>
            <p>Mon - Sun: 8:00 AM - 10:00 PM</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CoolDelhi AC Services. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
