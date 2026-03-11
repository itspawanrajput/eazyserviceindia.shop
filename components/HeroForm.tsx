import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User, MessageSquare, ChevronDown, Loader2, Mail, FormInput } from 'lucide-react';
import { createLead, detectLocation, getForms } from '../services/api';
import Editable from '../src/components/Editable';
import { useTracking } from '../src/hooks/useTracking';

const HeroForm: React.FC = () => {
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
    // Load dynamic form fields
    const loadFields = async () => {
      try {
        const allForms = await getForms();
        const heroForm = allForms.find((f: any) => f.id === 'hero-booking-form');
        if (heroForm && heroForm.fields_json && heroForm.fields_json.length > 0) {
          setFields(heroForm.fields_json);
        } else {
          // Fallback to default fields
          setFields([
            { id: 'name', type: 'text', placeholder: 'Your Name', required: true },
            { id: 'phone', type: 'tel', placeholder: 'Phone Number', required: true },
            { id: 'email', type: 'email', placeholder: 'Email Address', required: false },
            { id: 'location', type: 'text', placeholder: 'Location / Area', required: false },
            { id: 'service_type', type: 'select', options: ['Service & Cleaning', 'Repair & Parts', 'Installation/Uninstalltion', 'Gas Refill'], required: true },
            { id: 'message', type: 'textarea', placeholder: 'Describe your problem here......', required: false }
          ]);
        }
      } catch (e) {
        console.error("Failed to load hero form config", e);
        // Fallback
        setFields([
          { id: 'name', type: 'text', placeholder: 'Your Name', required: true },
          { id: 'phone', type: 'tel', placeholder: 'Phone Number', required: true },
          { id: 'service_type', type: 'select', options: ['Service & Cleaning', 'Repair & Parts', 'Installation/Uninstalltion', 'Gas Refill'], required: true }
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

    // Check for optional fields on first attempt (if they exist in config)
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
      // Map form data dynamically
      const payload: any = { source: 'Hero Form', ...trackingData };
      if (coords) {
        payload.lat = coords.lat;
        payload.lng = coords.lng;
      }
      Object.keys(formData).forEach(key => {
        payload[key] = formData[key];
      });

      await createLead(payload);

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
      case 'name': return <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />;
      case 'phone': return <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />;
      case 'email': return <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />;
      case 'location': return <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />;
      case 'message': return <MessageSquare className="absolute left-4 top-3 w-4 h-4 text-white/60" />;
      default: return type !== 'select' ? <FormInput className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" /> : null;
    }
  };

  return (
    <div className="relative z-20 w-full max-w-sm md:max-w-xl mx-auto md:ml-auto">
      <Editable id="hero-form-card" type="section">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-8 shadow-2xl">
          <div className="text-center md:text-left mb-6">
            <Editable id="hero-form-title" type="text">
              <h3 className="text-xl md:text-2xl font-black text-white mb-1">Book a Fast Service Visit Now</h3>
            </Editable>
            <Editable id="hero-form-subtitle" type="text">
              <p className="text-[#FFDC64] text-[10px] md:text-xs font-bold uppercase tracking-wider">Get an Instant Callback Within 10 Minutes</p>
            </Editable>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-white font-black text-lg mb-2">Thank you!</h4>
              <p className="text-green-100 text-sm font-medium">Your request has been received. Our team will contact you shortly.</p>
              <button
                onClick={() => setSubmitStatus('idle')}
                className="mt-6 text-white/60 hover:text-white text-xs font-bold underline underline-offset-4"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form id="hero-booking-form" onSubmit={handleSubmit} className="space-y-3">
              {submitStatus === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center text-red-100 text-xs font-bold">
                  Something went wrong. Please try again.
                </div>
              )}

              {attemptCount === 1 && (showWarnings.email || showWarnings.location) && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 text-center text-yellow-100 text-[10px] font-bold animate-pulse">
                  You can still submit without these fields. Click Submit again to continue.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.filter(f => f.type !== 'textarea' && f.type !== 'select').map((field) => (
                  <div key={field.id} className="relative">
                    {getIconForField(field.id, field.type)}
                    <input
                      type={field.type}
                      placeholder={field.placeholder || field.label}
                      required={field.required}
                      className={`w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 ${field.id === 'location' ? 'pr-24' : 'pr-4'} text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                      value={formData[field.id] || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, [field.id]: e.target.value });
                        if (field.id === 'email' && e.target.value) setShowWarnings(prev => ({ ...prev, email: false }));
                        if (field.id === 'location' && e.target.value) setShowWarnings(prev => ({ ...prev, location: false }));
                      }}
                    />

                    {/* Location Detect Button */}
                    {field.id === 'location' && (
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetecting}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {isDetecting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MapPin className="w-2.5 h-2.5" />}
                        Detect
                      </button>
                    )}

                    {/* Warnings */}
                    {field.id === 'email' && showWarnings.email && (
                      <p className="text-yellow-400 text-[9px] mt-1 font-bold leading-tight">
                        Add your email to receive future discounts and service updates.
                      </p>
                    )}
                    {field.id === 'location' && showWarnings.location && (
                      <p className="text-yellow-400 text-[9px] mt-1 font-bold leading-tight">
                        Click the blue Detect button. Location helps our technician reach you faster.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Select Fields */}
              {fields.filter(f => f.type === 'select').map((field) => (
                <div key={field.id} className="relative">
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
                  <select
                    required={field.required}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  >
                    <option value="" disabled className="bg-slate-900">{field.placeholder || `Select ${field.label}`}</option>
                    {field.options && field.options.map((opt: string) => (
                      <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Textarea Fields */}
              {fields.filter(f => f.type === 'textarea').map((field) => (
                <div key={field.id} className="relative">
                  {getIconForField(field.id, field.type)}
                  <textarea
                    placeholder={field.placeholder || field.label}
                    required={field.required}
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  />
                </div>
              ))}

              <Editable id="hero-form-submit" type="button">
                <button
                  id="hero-booking-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] mt-1 text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : 'Submit Request'}
                </button>
              </Editable>
              <p className="text-center text-white/60 text-[9px] mt-2 font-medium">
                1-Month Repeat Visit Guarantee Included
              </p>
            </form>
          )}
        </div>
      </Editable>
    </div>
  );
};

export default HeroForm;
