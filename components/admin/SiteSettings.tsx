import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Layers, Image as ImageIcon, Upload, Trash2, Copy, Check,
  ChevronUp, ChevronDown, Eye, EyeOff, Save, Loader2, CheckCircle,
  AlertCircle, Video, FileText, X, Edit3, ExternalLink, Mail, Info, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getSettings, updateSettings, getPageData, saveDraft, publishPage,
  uploadFile, getMediaList, deleteMedia, testEmailConfig
} from '../../services/api';
import { SERVICES } from '../../constants';

const DEFAULT_SECTION_ORDER = [
  'hero',
  'service-cleaning', 'service-repair', 'service-install', 'service-gas',
  'booking-form',
  'reviews',
  'faq',
];

const SECTION_LABELS: Record<string, string> = {
  'hero': '🏠 Hero Banner',
  'service-cleaning': '🧹 AC Cleaning',
  'service-repair': '🔧 AC Repair',
  'service-install': '📦 Installation',
  'service-gas': '⛽ Gas Charging',
  'booking-form': '📋 Booking Form',
  'reviews': '⭐ Reviews',
  'faq': '❓ FAQ',
};

type Tab = 'sections' | 'branding' | 'media' | 'email' | 'tracking';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  modified: string;
  isVideo: boolean;
}

const SiteSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sections state
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState("");
  const [pageData, setPageData] = useState<any>({});
  const [serviceBadges, setServiceBadges] = useState<Record<string, string>>({});
  const [serviceTitles, setServiceTitles] = useState<Record<string, string>>({});

  // Branding state
  const [settings, setSettings] = useState<any>({
    siteName: '',
    siteTagline: '',
    logoUrl: '',
    faviconUrl: '',
    smtpHost: '',
    smtpPort: '465',
    smtpUser: '',
    smtpPassword: '',
    notificationEmail: '',
    metaPixelId: '',
    metaAccessToken: '',
    metaTestCode: '',
    metaAdAccountId: ''
  });
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Media state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Email Test State
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{success: boolean, message: string, fullError?: string} | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsData, pageResult] = await Promise.all([
        getSettings(),
        getPageData('home'),
      ]);

      if (Object.keys(settingsData).length > 0) {
        setSettings((prev: any) => ({ ...prev, ...settingsData }));
      }

      const resolved = pageResult.draft && Object.keys(pageResult.draft).length > 0
        ? pageResult.draft : pageResult.published;
      setPageData(resolved);

      if (resolved._sectionOrder) {
        setSectionOrder(resolved._sectionOrder);
      }
      if (resolved._hiddenSections) {
        setHiddenSections(resolved._hiddenSections);
      }
      if (resolved._sectionLabels) {
        setSectionLabels(resolved._sectionLabels);
      }
      if (resolved._serviceBadges) {
        setServiceBadges(resolved._serviceBadges);
      }
      if (resolved._serviceTitles) {
        setServiceTitles(resolved._serviceTitles);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  };

  // ─── SECTIONS ─────────────────────────────────────────────────────
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[index], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[index]];
    setSectionOrder(newOrder);
  };

  const toggleSectionVisibility = (id: string) => {
    setHiddenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSaveLabel = (id: string) => {
    setSectionLabels(prev => ({ ...prev, [id]: tempLabel }));
    setEditingSectionId(null);
  };

  const saveSections = async () => {
    setSaving(true);
    try {
      const newPageData = {
        ...pageData,
        _sectionOrder: sectionOrder,
        _hiddenSections: hiddenSections,
        _sectionLabels: sectionLabels,
        _serviceBadges: serviceBadges,
        _serviceTitles: serviceTitles,
      };
      await saveDraft('home', newPageData);
      await publishPage('home');
      setPageData(newPageData);
      showStatus('success', 'Sections saved & published!');
    } catch (err) {
      showStatus('error', 'Failed to save sections');
    } finally {
      setSaving(false);
    }
  };

  // ─── BRANDING ─────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      setSettings((prev: any) => ({ ...prev, logoUrl: url }));
    } catch (err) {
      showStatus('error', 'Failed to upload logo');
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      setSettings((prev: any) => ({ ...prev, faviconUrl: url }));
    } catch (err) {
      showStatus('error', 'Failed to upload favicon');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      showStatus('success', 'Settings saved successfully!');
    } catch (err) {
      showStatus('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      // Auto-save the latest typed settings before testing
      await updateSettings(settings);
      
      const result = await testEmailConfig();
      setEmailTestResult(result);
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err.response?.data?.error || "Failed to test email connection.",
        fullError: err.response?.data?.fullError || String(err)
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // ─── MEDIA LIBRARY ────────────────────────────────────────────────
  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const files = await getMediaList();
      setMediaFiles(files);
    } catch (err) {
      console.error('Failed to load media', err);
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'media') loadMedia();
  }, [activeTab]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadFile(file);
      await loadMedia();
      showStatus('success', 'File uploaded!');
    } catch (err) {
      showStatus('error', 'Upload failed');
    } finally {
      setUploading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteMedia = async (filename: string) => {
    if (!window.confirm('Delete this file permanently?')) return;
    try {
      await deleteMedia(filename);
      setMediaFiles(prev => prev.filter(f => f.name !== filename));
      showStatus('success', 'File deleted');
    } catch (err) {
      showStatus('error', 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'sections', label: 'Sections', icon: Layers },
    { id: 'branding', label: 'Logo & Branding', icon: Globe },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'email', label: 'Email Configuration', icon: Mail },
    { id: 'tracking', label: 'Tracking & Pixel', icon: Target },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Site Settings</h1>
        <p className="text-slate-500 font-medium">Manage sections, branding, and media for your website.</p>
      </div>

      {/* Status Toast */}
      {status && (
        <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 font-bold text-sm ${
          status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.message}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ SECTIONS TAB ═══ */}
      {activeTab === 'sections' && (
        <>
        <div className="space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-slate-900">Section Order & Visibility</h2>
              </div>
              <button
                onClick={saveSections}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save & Publish
              </button>
            </div>

            <div className="p-6 space-y-2">
              {sectionOrder.map((id, index) => {
                const isHidden = hiddenSections.includes(id);
                const isEditing = editingSectionId === id;
                const currentLabel = sectionLabels[id] || SECTION_LABELS[id] || id;

                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isHidden ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-xs font-black text-slate-300 w-6 text-center">{index + 1}</span>
                      
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 text-sm font-bold text-slate-900 bg-white border-2 border-blue-500 rounded-lg outline-none"
                            value={tempLabel}
                            onChange={(e) => setTempLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(id)}
                            autoFocus
                          />
                          <button onClick={() => handleSaveLabel(id)} className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingSectionId(null)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-sm ${isHidden ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {currentLabel}
                          </span>
                          <button 
                            onClick={() => { setEditingSectionId(id); setTempLabel(currentLabel); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                            title="Rename Section"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/edit#${id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 mr-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        title="Edit content in Visual Builder"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Edit Content
                      </Link>
                      
                      <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>

                      <button
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-all"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sectionOrder.length - 1}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-all"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleSectionVisibility(id)}
                        className={`p-2 rounded-lg transition-all ${
                          isHidden ? 'text-red-400 bg-red-50 hover:bg-red-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                        title={isHidden ? 'Show Section' : 'Hide Section'}
                      >
                        {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Service Badge Editor */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="font-bold text-slate-900">Service Badges</h2>
                <p className="text-xs text-slate-500 mt-0.5">Edit the floating badge text shown above each service icon on the homepage</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICES.map(service => (
                <div key={service.id} className="p-4 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                      {service.title.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">AC {service.title}</h3>
                      <p className="text-[10px] text-slate-400">Edit badge and icon title</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={serviceBadges[service.id] ?? service.badge ?? ''}
                        onChange={(e) => setServiceBadges(prev => ({ ...prev, [service.id]: e.target.value }))}
                        placeholder="e.g. Trending, 50% off"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Service Label (Below Icon)</label>
                      <input
                        type="text"
                        value={serviceTitles[service.id] ?? service.title ?? ''}
                        onChange={(e) => setServiceTitles(prev => ({ ...prev, [service.id]: e.target.value }))}
                        placeholder="e.g. Repair"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-4">💡 Leave fields empty to hide badges or use defaults. Changes apply after clicking "Save & Publish" at the top.</p>
          </div>
        </div>
        </>
      )}

      {/* ═══ BRANDING TAB ═══ */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Logo & Branding</h2>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Site Logo</label>
                <div className="flex items-start gap-6">
                  {settings.logoUrl ? (
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <button
                        onClick={() => setSettings((prev: any) => ({ ...prev, logoUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold">No Logo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*,.svg" />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all mb-3"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    <p className="text-xs text-slate-400 font-medium">Recommended: PNG or SVG, transparent background, 200×200px or larger.</p>

                    <div className="mt-3">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Or paste URL</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="https://..."
                        value={settings.logoUrl || ''}
                        onChange={(e) => setSettings((prev: any) => ({ ...prev, logoUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Favicon</label>
                <div className="flex items-center gap-4">
                  {settings.faviconUrl ? (
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-xl border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img src={settings.faviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain p-1" referrerPolicy="no-referrer" />
                      </div>
                      <button
                        onClick={() => setSettings((prev: any) => ({ ...prev, faviconUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <Globe className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" ref={faviconInputRef} onChange={handleFaviconUpload} className="hidden" accept="image/*,.ico,.svg" />
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all mb-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Favicon
                    </button>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Or paste favicon URL..."
                      value={settings.faviconUrl || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, faviconUrl: e.target.value }))}
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Recommended: 32×32px or 64×64px ICO/PNG file.</p>
                  </div>
                </div>
              </div>

              {/* Brand Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Brand Name</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium"
                    placeholder="Your Business Name"
                    value={settings.siteName || ''}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Brand Tagline</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium"
                    placeholder="Your catchy tagline"
                    value={settings.siteTagline || ''}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, siteTagline: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMAIL TAB ═══ */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900">Email Configuration</h2>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Email Settings
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Notification Email */}
              <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-lg font-black text-slate-900 mb-2">Notification Email</h3>
                <p className="text-sm font-medium text-slate-600 mb-4">Where should we send new leads and booking notifications?</p>
                <input
                  type="email"
                  className="w-full md:w-1/2 p-3.5 rounded-xl bg-white border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium"
                  placeholder="e.g., admin@yourdomain.com"
                  value={settings.notificationEmail || ''}
                  onChange={(e) => setSettings((prev: any) => ({ ...prev, notificationEmail: e.target.value }))}
                />
              </div>

              {/* SMTP Settings */}
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">SMTP Server Settings</h3>
                <p className="text-sm font-medium text-slate-600 mb-6">Configure your email provider to send outgoing notification emails.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">SMTP Host</label>
                    <input
                      type="text"
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium"
                      placeholder="e.g., smtp.gmail.com"
                      value={settings.smtpHost || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, smtpHost: e.target.value }))}
                    />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">SMTP Port</label>
                     <select
                       className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium cursor-pointer"
                       value={settings.smtpPort || '465'}
                       onChange={(e) => setSettings((prev: any) => ({ ...prev, smtpPort: e.target.value }))}
                     >
                        <option value="465">465 (SSL/TLS - Recommended)</option>
                        <option value="587">587 (STARTTLS)</option>
                        <option value="25">25 (Unsecured)</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">SMTP Username / Email</label>
                    <input
                      type="text"
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium"
                      placeholder="e.g., you@gmail.com"
                      value={settings.smtpUser || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, smtpUser: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">SMTP Password</label>
                    <input
                      type="password"
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 font-medium"
                      placeholder="••••••••••••••••"
                      value={settings.smtpPassword || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, smtpPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-8 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">Using Gmail?</p>
                    <p className="text-xs text-blue-700 mb-2">If you are using a Gmail account, you cannot use your standard password. You must generate an <strong>App Password</strong>.</p>
                    <ol className="list-decimal list-inside text-xs text-blue-700 space-y-1">
                      <li>Go to your Google Account Settings &gt; Security.</li>
                      <li>Enable 2-Step Verification if it isn't already.</li>
                      <li>Search for "App Passwords" and create a new one for "Mail".</li>
                      <li>Paste the generated 16-character password into the <strong>SMTP Password</strong> field above.</li>
                    </ol>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-8 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Verify Configuration</h4>
                    <p className="text-xs text-slate-500">Save your settings and attempt to send a test email to your Notification Email.</p>
                  </div>
                  <button
                    onClick={handleTestEmail}
                    disabled={testingEmail || saving}
                    className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Test Connection
                  </button>
                </div>

                {emailTestResult && (
                  <div className={`mt-6 p-5 rounded-xl border ${emailTestResult.success ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                       {emailTestResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                       <h4 className={`text-sm font-bold ${emailTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                         {emailTestResult.message}
                       </h4>
                    </div>
                    
                    {!emailTestResult.success && emailTestResult.fullError && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Raw Server Error Log (Show this to your host):</p>
                        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-red-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {emailTestResult.fullError}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══ MEDIA LIBRARY TAB ═══ */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-orange-600" />
                <h2 className="font-bold text-slate-900">Media Library</h2>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{mediaFiles.length} files</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" accept="image/*,.gif,.svg,video/mp4,video/webm" />
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </button>
              </div>
            </div>

            <div className="p-6">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No media files uploaded yet</p>
                  <p className="text-slate-400 text-sm">Upload images or videos to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaFiles.map(file => (
                    <div key={file.name} className="group relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 transition-all">
                      {/* Preview */}
                      <div className="aspect-square flex items-center justify-center bg-slate-100 overflow-hidden">
                        {file.isVideo ? (
                          <div className="flex flex-col items-center text-slate-400">
                            <Video className="w-10 h-10 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Video</span>
                          </div>
                        ) : (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[11px] font-bold text-slate-700 truncate" title={file.name}>
                          {file.name.replace(/^\d+-/, '')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCopyUrl(file.url)}
                          className="p-2.5 bg-white rounded-xl text-slate-700 hover:bg-blue-50 transition-all"
                          title="Copy URL"
                        >
                          {copiedUrl === file.url ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(file.name)}
                          className="p-2.5 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRACKING TAB ═══ */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-red-600" />
                <h2 className="font-bold text-slate-900">Tracking & Conversions API</h2>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Tracking Settings
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-black text-slate-900 mb-2">Meta Pixel & CAPI</h3>
                <p className="text-sm font-medium text-slate-600 mb-4">Enable server-side lead tracking to improve ad performance and attribution.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Pixel ID</label>
                    <input
                      type="text"
                      className="w-full md:w-1/2 p-3.5 rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium"
                      placeholder="e.g., 123456789012345"
                      value={settings.metaPixelId || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, metaPixelId: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Conversions API (CAPI) Access Token</label>
                    <textarea
                      className="w-full p-3.5 rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium min-h-[120px]"
                      placeholder="EAAB..."
                      value={settings.metaAccessToken || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, metaAccessToken: e.target.value }))}
                    />
                    <p className="text-[11px] text-slate-500 mt-2">Generate this in the Meta Events Manager &gt; Settings &gt; Conversions API &gt; Generate access token.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Test Event Code (Optional)</label>
                    <input
                      type="text"
                      className="w-full md:w-1/2 p-3.5 rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium"
                      placeholder="e.g., TEST12345"
                      value={settings.metaTestCode || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, metaTestCode: e.target.value }))}
                    />
                    <p className="text-[11px] text-slate-500 mt-2">Use this to see real-time events in the **Test Events** tab of Meta Events Manager.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Ad Account ID (Optional)</label>
                    <input
                      type="text"
                      className="w-full md:w-1/2 p-3.5 rounded-xl bg-white border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium"
                      placeholder="e.g., 123456789012345"
                      value={settings.metaAdAccountId || ''}
                      onChange={(e) => setSettings((prev: any) => ({ ...prev, metaAdAccountId: e.target.value }))}
                    />
                    <p className="text-[11px] text-slate-500 mt-2">Required for the on-site Ads Dashboard. Copy this from Meta Ads Manager URL or Settings.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" /> Implementation Details
                </h3>
                <ul className="text-[12px] space-y-3 text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>The Meta Pixel code will be automatically injected into your website's header.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>When a lead is submitted, the server will securely send a <strong>Lead</strong> event with hashed customer details (Email, Phone) via the Conversions API.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>Deduplication is handled automatically using the unique Lead ID.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteSettings;
