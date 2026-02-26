
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServiceSection from './components/ServiceSection';
import BookingForm from './components/BookingForm';
import Reviews from './components/Reviews';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import MobileCTA from './components/MobileCTA';
import WhatsAppButton from './components/WhatsAppButton';
import { SERVICES } from './constants';
import { ServiceData } from './types';

const App: React.FC = () => {
  const [orderedServices, setOrderedServices] = useState<ServiceData[]>(SERVICES);
  const [isReordered, setIsReordered] = useState(false);
  const reorderTriggered = useRef(false);

  useEffect(() => {
    const handleInitialHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && SERVICES.some(s => s.id === hash)) {
        // Requirements: 1-second hero visibility before auto-scroll/reorder
        setTimeout(() => {
          setOrderedServices(prev => {
            const index = prev.findIndex(s => s.id === hash);
            if (index === -1) return prev;
            const newOrder = [...prev];
            const [selected] = newOrder.splice(index, 1);
            return [selected, ...newOrder];
          });
          setIsReordered(true);
          
          // Smooth scroll to the section
          const target = document.getElementById(hash);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 1000);
      }
    };

    if (!reorderTriggered.current) {
      handleInitialHash();
      reorderTriggered.current = true;
    }
  }, []);

  return (
    <div className="min-h-screen relative pb-20 md:pb-0">
      <Header />
      <Hero />
      
      <main id="main-content">
        {orderedServices.map((service, index) => (
          <ServiceSection 
            key={service.id} 
            service={service} 
            alternate={index % 2 === 0} 
          />
        ))}
        
        <BookingForm />
        <Reviews />
        <FAQ />
      </main>

      <Footer />
      <WhatsAppButton />
      <MobileCTA />
    </div>
  );
};

export default App;
