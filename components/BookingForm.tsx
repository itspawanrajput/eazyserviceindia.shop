import React, { useState, useEffect } from 'react';
import { Send, MapPin, Loader2, User, Phone, Mail, MessageSquare, ChevronDown, FormInput } from 'lucide-react';
import { createLead, detectLocation, getForms } from '../services/api';
import Editable from '../src/components/Editable';
import { useVisualBuilder } from '../src/context/VisualBuilderContext';
import { useTracking } from '../src/hooks/useTracking';

const BookingForm: React.FC = () => {
  const { pageData, device } = useVisualBuilder();
  const [fields, setFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showWarnings, setShowWarnings] = useState({ email: false, location: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const trackingData = useTracking();

  useEffect(() => {
    const loadFields = async () => {
      try {
        const allForms = await getForms();
        const mainForm = allForms.find((f: any) => f.id === 'main-booking-form');
        if (mainForm && mainForm.fields_json && mainForm.fields_json.length > 0) {
          setFields(mainForm.fields_json);
        } else {
          setFields([
            { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter name', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter number', required: true },
            { id: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email', required: false },
            { id: 'location', label: 'Location / Area', type: 'text', placeholder: 'Location', required: false },
            { id: 'service_type', label: 'Service Type', type: 'select', options: ['Service & Cleaning', 'Repair & Parts', 'Installation/Uninstallation', 'Gas Refill'], required: true },
            { id: 'message', label: 'Message (Optional)', type: 'textarea', placeholder: 'Describe your problem here......', required: false }
          ]);
        }
      } catch (e) {
        console.error("Failed to load main form config", e);
        setFields([
          { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter name', required: true },
          { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter number', required: true },
          { id: 'service_type', label: 'Service Category', type: 'select', options: ['Service & Cleaning', 'Repair & Parts', 'Installation/Uninstallation', 'Gas Refill'], required: true }
        ]);
      }
    };
    loadFields();
  }, []);

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          try {
            const area = await detectLocation(latitude, longitude);
            setFormData(prev => ({ ...prev, location: area }));
            setShowWarnings(prev => ({ ...prev, location: false }));
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          } finally {
            setIsDetecting(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsDetecting(false);
          alert("Could not detect location. Please enter it manually.");
        }
      );
    } else {
      setIsDetecting(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasEmailField = fields.some(f => f.id === 'email');
    const hasLocField = fields.some(f => f.id === 'location');

    if (attemptCount === 0 && ((hasEmailField && !formData.email) || (hasLocField && !formData.location))) {
      setShowWarnings({
        email: hasEmailField && !formData.email,
        location: hasLocField && !formData.location
      });
      setAttemptCount(1);
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const event_id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const payload: any = { source: 'Booking Form', event_id, ...trackingData };
      if (coords) {
        payload.lat = coords.lat;
        payload.lng = coords.lng;
      }
      Object.keys(formData).forEach(key => {
        payload[key] = formData[key];
      });

      await createLead(payload);

      // Fire Browser Pixel Event for Deduplication
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: formData.service_type || 'General Service',
          event_id: event_id
        });
      }

      setSubmitStatus('success');
      setFormData({});
      setCoords(null);
      setAttemptCount(0);
      setShowWarnings({ email: false, location: false });
    } catch (err) {
      console.error('Failed to save lead', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForField = (id: string, type: string) => {
    switch (id) {
      case 'name': return <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />;
      case 'phone': return <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />;
      case 'email': return <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />;
      case 'location': return <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />;
      case 'message': return <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />;
      default: return type !== 'select' ? <FormInput className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> : null;
    }
  };

  const bookingSectionData = pageData['booking-section'] || {};
  const bookingSectionStyles = bookingSectionData[device] || bookingSectionData['desktop'] || {};
  const bgImageUrl = bookingSectionStyles.backgroundImage || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000&auto=format&fit=crop';

  return (
    <Editable id="booking-section" type="section">
      <section id="booking-form" className="relative py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={bgImageUrl}
            alt="AC Service Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
            <div className="relative w-full lg:w-[400px] lg:flex-shrink-0 min-h-[280px] lg:min-h-[560px]">
              <Editable id="booking-panel-image" type="image" className="absolute inset-0 z-10">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop"
                  alt="Professional AC Technician"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </Editable>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-end justify-around gap-2">
                  <div className="text-center">
                    <p className="text-2xl font-black">100%</p>
                    <p className="text-[11px] text-white/75 font-semibold leading-tight mt-0.5">Happy<br />customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">10+</p>
                    <p className="text-[11px] text-white/75 font-semibold leading-tight mt-0.5">Years in<br />Industry</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">4.9</p>
                    <p className="text-[11px] text-white/75 font-semibold leading-tight mt-0.5">Yelp &<br />Google reviews</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-7 md:p-9 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Booking</p>
              <Editable id="booking-title" type="text">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-5 leading-tight">
                  Get Your Estimate &<br />Book Now
                </h2>
              </Editable>

              {submitStatus === 'success' ? (
                <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Thank you!</h4>
                  <p className="text-slate-500 font-medium text-sm">Your request has been received. Our team will contact you shortly.</p>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="mt-6 bg-blue-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form id="main-booking-form" className="space-y-3.5" onSubmit={handleSubmit}>
                  {submitStatus === 'error' && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-bold text-center">
                      Something went wrong. Please try again.
                    </div>
                  )}
                  {attemptCount === 1 && (showWarnings.email || showWarnings.location) && (
                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-3 rounded-xl text-sm font-bold text-center">
                      You can still submit without these fields. Click Submit again to continue.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {fields.filter(f => f.type !== 'textarea' && f.type !== 'select').map((field) => (
                      <div key={field.id} className={field.id === 'email' || field.id === 'location' || field.type === 'text' || field.type === 'tel' ? '' : 'sm:col-span-2'}>
                        <label className="block text-xs font-bold text-slate-700 mb-1">{field.label || field.id}</label>
                        <div className="relative">
                          {getIconForField(field.id, field.type)}
                          <input
                            type={field.type}
                            required={field.required}
                            className={`w-full py-3 pl-10 ${field.id === 'location' ? 'pr-24' : 'pr-3'} rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all text-sm`}
                            placeholder={field.placeholder || `Enter ${field.label || field.id}`}
                            value={formData[field.id] || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, [field.id]: e.target.value });
                              if (field.id === 'email' && e.target.value) setShowWarnings(prev => ({ ...prev, email: false }));
                              if (field.id === 'location' && e.target.value) setShowWarnings(prev => ({ ...prev, location: false }));
                            }}
                          />

                          {field.id === 'location' && (
                            <button
                              type="button"
                              onClick={handleDetectLocation}
                              disabled={isDetecting}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                              {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                              Detect
                            </button>
                          )}
                        </div>

                        {field.id === 'email' && showWarnings.email && (
                          <p className="text-yellow-600 text-[10px] mt-1 font-bold leading-tight">Add email to receive future discounts.</p>
                        )}
                        {field.id === 'location' && showWarnings.location && (
                          <p className="text-yellow-600 text-[10px] mt-1 font-bold leading-tight">Click Detect so our technician reaches you faster.</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {fields.filter(f => f.type === 'select').map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{field.label || field.id}</label>
                      <div className="relative">
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          required={field.required}
                          className="w-full py-3 px-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-sm"
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        >
                          <option value="" disabled>{field.placeholder || `Select ${field.label || field.id}`}</option>
                          {field.options && field.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {fields.filter(f => f.type === 'textarea').map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{field.label || field.id}</label>
                      <div className="relative">
                        {getIconForField(field.id, field.type)}
                        <textarea
                          required={field.required}
                          className="w-full py-3 pl-10 pr-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none text-sm"
                          placeholder={field.placeholder || `Enter ${field.label || field.id}`}
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">{field.placeholder || ''}</p>
                      </div>
                    </div>
                  ))}

                  <button
                    id="main-booking-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-extrabold text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><span>Book My Slot Now</span><Send className="w-4 h-4" /></>
                    )}
                  </button>
                  <p className="text-center text-slate-400 text-xs mt-1 font-medium italic">
                    * 1-Month Repeat Visit Guarantee Included
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Editable>
  );
};

export default BookingForm;
