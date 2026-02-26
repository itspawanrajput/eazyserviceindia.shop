import { Phone, Calendar } from 'lucide-react';

interface MobileCTAProps {
    phoneLink: string;
}

export default function MobileCTA({ phoneLink }: MobileCTAProps) {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200">
            <div className="flex gap-3">
                <a href={phoneLink} className="flex-1 bg-blue-600 text-white flex items-center justify-center py-4 rounded-2xl font-extrabold text-lg shadow-lg shadow-blue-200">
                    <Phone className="w-5 h-5 mr-2" /> Call Now
                </a>
                <a href="#booking-form" className="flex-1 bg-slate-900 text-white flex items-center justify-center py-4 rounded-2xl font-extrabold text-lg shadow-lg">
                    <Calendar className="w-5 h-5 mr-2" /> Book Now
                </a>
            </div>
        </div>
    );
}
