
import React, { useState } from 'react';
import { Send, Clock, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { GOA_AREAS } from '../constants';
import { GoogleGenAI } from "@google/genai";

const BookingForm: React.FC = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [manualLocation, setManualLocation] = useState(GOA_AREAS[0]);
  const [useManual, setUseManual] = useState(false);

  const handleAutoLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setUseManual(true);
      return;
    }

    setIsDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use Gemini to map coordinates to one of our service areas
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `The user is at coordinates ${latitude}, ${longitude} in Delhi-NCR. 
                      Based on these coordinates, which of these specific service areas is closest? 
                      Areas: ${GOA_AREAS.join(", ")}. 
                      Return ONLY the name of the area. If it's not close to any, return 'Delhi-NCR (Other)'.`,
            config: {
              temperature: 0.1,
            }
          });

          const area = response.text?.trim() || "Delhi-NCR (Other)";
          setDetectedLocation(area);
          setUseManual(false);
        } catch (error) {
          console.error("Error detecting location:", error);
          setUseManual(true);
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetecting(false);
        setUseManual(true);
        alert("Could not access your location. Please select manually.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <section id="booking-form" className="py-20 bg-blue-600 text-white overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-500 rounded-l-[100px] opacity-50 -z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Book Your AC Service <br /> in Delhi-NCR Today
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-lg mx-auto lg:mx-0">
              Fill in your details and our expert technician will contact you within 10 minutes to confirm your slot.
            </p>
            
            <div className="inline-flex items-center px-6 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-2xl">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center mr-4 shadow-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Response Time</p>
                <p className="text-blue-100">We respond within 10 minutes.</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-slate-900">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input type="text" className="w-full p-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter name" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" className="w-full p-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter number" required />
                  </div>
                </div>

                {/* Priority Location Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location in Delhi-NCR</label>
                  
                  {!useManual && !detectedLocation && !isDetecting ? (
                    <button
                      type="button"
                      onClick={handleAutoLocation}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold hover:bg-blue-100 transition-all group"
                    >
                      <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Detect My Current Location
                    </button>
                  ) : isDetecting ? (
                    <div className="w-full flex items-center justify-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-medium italic">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Fetching your location...
                    </div>
                  ) : detectedLocation && !useManual ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>Detected: {detectedLocation}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setUseManual(true)} 
                          className="text-xs text-green-600 underline underline-offset-2 hover:text-green-800"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                      >
                        {GOA_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                        <option value="other">Other Area</option>
                      </select>
                      <button 
                        type="button"
                        onClick={handleAutoLocation}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 font-bold text-xs"
                      >
                        Auto-Detect
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">AC Type</label>
                  <select className="w-full p-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>Split AC</option>
                    <option>Window AC</option>
                    <option>Cassette AC</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Service Type</label>
                  <select className="w-full p-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>AC Repair</option>
                    <option>AC Cleaning</option>
                    <option>Installation / Uninstallation</option>
                    <option>Gas Refilling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Message (Optional)</label>
                  <textarea className="w-full p-4 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 transition-all h-24" placeholder="Tell us about the issue..."></textarea>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-xl font-extrabold text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center">
                  Book Service Now
                  <Send className="w-5 h-5 ml-3" />
                </button>
                <p className="text-center text-slate-400 text-sm mt-4 font-medium italic">
                  * 1-Month Repeat Visit Guarantee Included
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
