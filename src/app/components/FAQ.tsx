'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQData } from '@/lib/data';

interface FAQProps {
    faqs: FAQData[];
}

export default function FAQ({ faqs }: FAQProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-20 bg-slate-50">
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-800 hover:text-blue-600 transition-colors">
                                {faq.q}
                                {openIndex === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            {openIndex === idx && (
                                <div className="px-6 pb-5 text-slate-600">{faq.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
