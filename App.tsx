
import React, { useState, useEffect, useRef } from 'react';
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
import ProtectedRoute from './src/components/ProtectedRoute';

const PublicWebsite: React.FC<{ isEditMode?: boolean }> = ({ isEditMode = false }) => {
  const [orderedServices, setOrderedServices] = useState<ServiceData[]>(SERVICES);
  const reorderTriggered = useRef(false);
  const { sectionId } = useParams<{ sectionId?: string }>();
  const { device } = useVisualBuilder();

  useEffect(() => {
    const handleInitialHash = () => {
      const hash = window.location.hash.replace('#', '') || sectionId;
      if (hash && SERVICES.some(s => s.id === hash)) {
        setTimeout(() => {
          setOrderedServices(prev => {
            const index = prev.findIndex(s => s.id === hash);
            if (index === -1) return prev;
            const newOrder = [...prev];
            const [selected] = newOrder.splice(index, 1);
            return [selected, ...newOrder];
          });

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
  }, [sectionId]);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
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
        <ModalForm />
      </div>
    </div>
  );
};

import { useVisitorTracking } from './src/hooks/useVisitorTracking';

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
