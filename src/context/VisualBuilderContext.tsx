import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPageData, saveDraft, publishPage } from '../../services/api';

type Device = 'desktop' | 'tablet' | 'mobile';

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
}

const VisualBuilderContext = createContext<VisualBuilderContextType | undefined>(undefined);

export const VisualBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [device, setDevice] = useState<Device>('desktop');
  const [pageData, setPageData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<string | null>(null);

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const data = await getPageData('home');
      // If draft is empty, use published, if both empty, use default constant data
      setPageData(data.draft && Object.keys(data.draft).length > 0 ? data.draft : data.published);
    } catch (err) {
      console.error('Failed to fetch page data', err);
    } finally {
      setLoading(false);
    }
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
      await publishPage('home');
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
      selectedElementType, setSelectedElementType
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
