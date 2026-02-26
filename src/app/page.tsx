import { getSiteContent } from '@/lib/data';
import Header from './components/Header';
import Hero from './components/Hero';
import ServiceSection from './components/ServiceSection';
import BookingForm from './components/BookingForm';
import Reviews from './components/Reviews';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import MobileCTA from './components/MobileCTA';

export const dynamic = 'force-dynamic';

export default function Home() {
  const content = getSiteContent();

  return (
    <div className="min-h-screen relative pb-20 md:pb-0">
      <Header
        brand={content.brand}
        contact={content.contact}
        searchPlaceholders={content.searchPlaceholders}
        serviceIds={content.services.map(s => ({ id: s.id, title: s.title }))}
      />
      <Hero brand={content.brand} services={content.services} />

      <main id="main-content">
        {content.services.map((service, index) => (
          <ServiceSection
            key={service.id}
            service={service}
            alternate={index % 2 === 0}
            phoneLink={content.contact.phoneLink}
          />
        ))}
        <BookingForm serviceAreas={content.serviceAreas} />
        <Reviews reviews={content.reviews} />
        <FAQ faqs={content.faqs} />
      </main>

      <Footer brand={content.brand} contact={content.contact} serviceAreas={content.serviceAreas} />
      <WhatsAppButton whatsapp={content.contact.whatsapp} />
      <MobileCTA phoneLink={content.contact.phoneLink} />
    </div>
  );
}
