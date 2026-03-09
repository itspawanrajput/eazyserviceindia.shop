
import React from 'react';
import { Star } from 'lucide-react';

import Editable from '../src/components/Editable';

const REVIEWS = [
  { name: "Rahul S.", location: "Delhi", text: "Best AC service I've had in Delhi-NCR. They arrived within 25 minutes of calling for an emergency repair. Highly recommend!" },
  { name: "Anita Sharma", location: "Gurgaon", text: "Professional technicians. They did a wet cleaning of my split AC and the cooling is like new now. Affordable too." },
  { name: "John Singh", location: "Noida", text: "Needed urgent installation for my new AC. These guys were prompt and did a very clean job. Great service." },
  { name: "Vikram K.", location: "Ghaziabad", text: "Gas refilling was done at a very reasonable price. Honest technicians who don't charge extra. My go-to for AC now." }
];

const Reviews: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Editable id="reviews-title" type="text">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">What Delhi-NCR Customers Say About Us</h2>
          </Editable>
          <div className="flex flex-col items-center justify-center">
             <div className="flex items-center space-x-1 mb-2">
               {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
             </div>
             <Editable id="reviews-rating-text" type="text">
               <p className="text-xl font-bold text-slate-800">4.8 Star Rating <span className="text-slate-400 font-normal">| Google Verified</span></p>
             </Editable>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {REVIEWS.map((review, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                  {review.name[0]}
                </div>
                <div>
                  <Editable id={`review-name-${idx}`} type="text">
                    <p className="font-bold text-slate-900">{review.name}</p>
                  </Editable>
                  <Editable id={`review-location-${idx}`} type="text">
                    <p className="text-sm text-slate-500">{review.location}, Delhi-NCR</p>
                  </Editable>
                </div>
              </div>
              <Editable id={`review-text-${idx}`} type="text">
                <p className="text-slate-600 italic leading-relaxed">"{review.text}"</p>
              </Editable>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
