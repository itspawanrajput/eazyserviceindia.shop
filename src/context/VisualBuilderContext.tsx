import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPageData, saveDraft, publishPage } from '../../services/api';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEFAULT_SECTION_ORDER = [
  'hero',
  'service-cleaning', 'service-repair', 'service-install', 'service-gas',
  'booking-form',
  'reviews',
  'faq',
];

interface VisualBuilderContextType {
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  device: Device;
  setDevice: (device: Device) => void;
  pageData: any;
  setPageData: (data: any) => void;
  save: () => Promise<void>;
  publish: () => Promise<void>;
  loading: boolean;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  selectedElementType: string | null;
  setSelectedElementType: (type: string | null) => void;
  sectionOrder: string[];
  moveSection: (id: string, direction: 'up' | 'down') => void;
}

const VisualBuilderContext = createContext<VisualBuilderContextType | undefined>(undefined);

export const VisualBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [device, setDevice] = useState<Device>('desktop');
  
  // Use server-injected state if available for instant load
  const initialState = (window as any).__INITIAL_STATE__;
  const [pageData, setPageData] = useState<any>(initialState?.pageData || {});
  const [loading, setLoading] = useState(!initialState?.pageData);
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have injected state
    if (!initialState?.pageData) {
      fetchPageData();
    }
  }, []);

  const fetchPageData = async () => {
    try {
      const data = await getPageData('home');
      const resolved = data.draft && Object.keys(data.draft).length > 0 ? data.draft : data.published;
      setPageData(resolved);
    } catch (err) {
      console.error('Failed to fetch page data', err);
    } finally {
      setLoading(false);
    }
  };

  // Section order — stored inside pageData._sectionOrder
  const sectionOrder: string[] = pageData._sectionOrder || DEFAULT_SECTION_ORDER;

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const order = [...sectionOrder];
    const index = order.indexOf(id);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= order.length) return;

    // Swap
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];

    setPageData({ ...pageData, _sectionOrder: order });
  };

  const save = async () => {
    try {
      await saveDraft('home', pageData);
      alert('Draft saved successfully!');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save draft');
    }
  };

  const publish = async () => {
    try {
      // Send latest pageData with publish to ensure draft is auto-saved first
      await publishPage('home', pageData);
      alert('Page published successfully!');
    } catch (err) {
      console.error('Publish failed', err);
      alert('Failed to publish page');
    }
  };

  return (
    <VisualBuilderContext.Provider value={{
      isEditMode, setIsEditMode,
      device, setDevice,
      pageData, setPageData,
      save, publish,
      loading,
      selectedElementId, setSelectedElementId,
      selectedElementType, setSelectedElementType,
      sectionOrder, moveSection
    }}>
      {children}
    </VisualBuilderContext.Provider>
  );
};

export const useVisualBuilder = () => {
  const context = useContext(VisualBuilderContext);
  if (!context) throw new Error('useVisualBuilder must be used within a VisualBuilderProvider');
  return context;
};
