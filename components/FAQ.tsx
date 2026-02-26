
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  { q: "How fast can you reach in Delhi-NCR?", a: "We aim to reach any location in Delhi, Gurgaon, Noida, and surrounding areas within 20 to 45 minutes of booking, depending on traffic and exact location." },
  { q: "Do you provide same-day AC repair?", a: "Yes, we specialize in same-day emergency repairs. Most calls are handled on the same day if booked before 6 PM." },
  { q: "Which AC brands do you support?", a: "We support all major brands including Voltas, LG, Samsung, Daikin, Mitsubishi, Blue Star, Carrier, Godrej, and more." },
  { q: "Do you offer warranty?", a: "Yes, we provide a 30-day free repeat visit guarantee on all our repair and service work. If the same issue recurs, we fix it for free." }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                {faq.q}
                {openIndex === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {openIndex === idx && (
                <div className="px-6 pb-5 text-slate-600 animate-in fade-in slide-in-from-top-2 duration-300">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
