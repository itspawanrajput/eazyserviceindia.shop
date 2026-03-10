
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import ServiceSection from './components/ServiceSection';
import BookingForm from './components/BookingForm';
import Reviews from './components/Reviews';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ModalForm from './components/ModalForm';
import { SERVICES } from './constants';
import { ServiceData } from './types';
import { useVisitorTracking } from './src/hooks/useVisitorTracking';

// Admin Components
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './components/admin/DashboardHome';
import LeadManagement from './components/admin/LeadManagement';
import ContentManagement from './components/admin/ContentManagement';
import FormBuilder from './components/admin/FormBuilder';
import SecuritySettings from './components/admin/SecuritySettings';
import Settings from './components/admin/Settings';
import { VisualBuilderProvider, useVisualBuilder } from './src/context/VisualBuilderContext';
import AdminToolbar from './src/components/AdminToolbar';
import EditPanel from './src/components/EditPanel';
import SectionWrapper from './src/components/SectionWrapper';
import ProtectedRoute from './src/components/ProtectedRoute';

// Section registry — maps section IDs to their component + label
const SECTION_LABELS: Record<string, string> = {
  'hero': 'Hero',
  'service-cleaning': 'AC Cleaning',
  'service-repair': 'AC Repair',
  'service-install': 'Installation',
  'service-gas': 'Gas Charging',
  'booking-form': 'Booking Form',
  'reviews': 'Reviews',
  'faq': 'FAQ',
};

const SERVICE_MAP: Record<string, ServiceData> = {};
SERVICES.forEach(s => { SERVICE_MAP[`service-${s.id}`] = s; });

const PublicWebsite: React.FC<{ isEditMode?: boolean }> = ({ isEditMode = false }) => {
  const { device, sectionOrder, moveSection } = useVisualBuilder();
  const { sectionId } = useParams<{ sectionId?: string }>();
  const scrollTriggered = useRef(false);

  // Handle hash/URL-based scroll on mount
  useEffect(() => {
    if (scrollTriggered.current) return;
    const hash = window.location.hash.replace('#', '') || sectionId;
    if (hash) {
      setTimeout(() => {
        const target = document.getElementById(hash);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
    scrollTriggered.current = true;
  }, [sectionId]);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  // Render a section by its ID
  const renderSection = (id: string, index: number) => {
    const isFirst = index === 0;
    const isLast = index === sectionOrder.length - 1;

    let component: React.ReactNode = null;

    if (id === 'hero') {
      component = <Hero />;
    } else if (id.startsWith('service-')) {
      const service = SERVICE_MAP[id];
      if (!service) return null;
      component = <ServiceSection key={service.id} service={service} alternate={index % 2 === 0} />;
    } else if (id === 'booking-form') {
      component = <BookingForm />;
    } else if (id === 'reviews') {
      component = <Reviews />;
    } else if (id === 'faq') {
      component = <FAQ />;
    }

    if (!component) return null;

    return (
      <SectionWrapper
        key={id}
        id={id}
        label={SECTION_LABELS[id] || id}
        isFirst={isFirst}
        isLast={isLast}
        onMoveUp={() => moveSection(id, 'up')}
        onMoveDown={() => moveSection(id, 'down')}
      >
        {component}
      </SectionWrapper>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-100 transition-all duration-300 ${isEditMode ? 'pt-16 pr-80' : ''}`}>
      {isEditMode && <AdminToolbar />}
      {isEditMode && <EditPanel />}

      <div
        className={`mx-auto bg-white shadow-2xl transition-all duration-500 ${isEditMode ? 'my-8 rounded-xl overflow-hidden border border-slate-200' : ''}`}
        style={{ width: isEditMode ? deviceWidths[device] : '100%' }}
      >
        <Header />

        <main id="main-content">
          {sectionOrder.map((id, index) => renderSection(id, index))}
        </main>

        <Footer />
        <WhatsAppButton />
        <ModalForm />
      </div>
    </div>
  );
};


const App: React.FC = () => {
  useVisitorTracking();

  return (
    <Router>
      <VisualBuilderProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicWebsite />} />
          <Route path="/:sectionId" element={<PublicWebsite />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/edit"
            element={
              <ProtectedRoute>
                <PublicWebsite isEditMode={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="forms" element={<FormBuilder />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </VisualBuilderProvider>
    </Router>
  );
};

export default App;
