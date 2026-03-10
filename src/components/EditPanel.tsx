import React, { useRef, useState } from 'react';
import { useVisualBuilder } from '../context/VisualBuilderContext';
import { X, Type, Palette, Link, Image as ImageIcon, Layout, Smartphone, Monitor, Tablet, Settings, Upload, Share2, Video, ChevronDown } from 'lucide-react';
import { uploadFile } from '../../services/api';

const LINK_OPTIONS = [
  { label: '── Page Sections ──', value: '', disabled: true },
  { label: 'Hero', value: '#hero' },
  { label: 'AC Repair', value: '#repair' },
  { label: 'AC Cleaning', value: '#cleaning' },
  { label: 'AC Installation', value: '#install' },
  { label: 'AC Gas Charging', value: '#gas' },
  { label: 'Booking Form', value: '#booking-form' },
  { label: 'Reviews', value: '#reviews' },
  { label: 'FAQ', value: '#faq' },
  { label: '── External Links ──', value: '', disabled: true },
  { label: 'WhatsApp Chat', value: 'https://wa.link/50lzkv' },
  { label: 'Phone Call', value: 'tel:+919911481331' },
  { label: '── Other ──', value: '', disabled: true },
  { label: 'Custom URL...', value: '__custom__' },
];

const EditPanel: React.FC = () => {
  const { selectedElementId, setSelectedElementId, selectedElementType, pageData, setPageData, device } = useVisualBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const [applyAll, setApplyAll] = useState(false);

  if (!selectedElementId) return null;

  const elementData = pageData[selectedElementId] || {};
  const currentStyles = elementData[device] || {};

  const updateStyle = (key: string, value: any) => {
    const newData = { ...pageData };
    if (!newData[selectedElementId]) newData[selectedElementId] = {};

    const devices = applyAll ? ['desktop', 'tablet', 'mobile'] : [device];
    devices.forEach(d => {
      if (!newData[selectedElementId][d]) newData[selectedElementId][d] = {};
      newData[selectedElementId][d][key] = value;
    });

    setPageData(newData);
  };

  // Upload background image / GIF for sections
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      if (selectedElementType === 'section') {
        updateStyle('backgroundImage', url);
      } else {
        updateStyle('value', url);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload file');
    }
  };

  // Upload video for section backgrounds
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      updateStyle('backgroundVideo', url);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload video');
    }
  };

  // Upload icon/social image
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      updateStyle('iconImage', url);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload icon');
    }
  };

  const isSocial = selectedElementType === 'social';
  const isLink = selectedElementType === 'link';
  const isSection = selectedElementType === 'section';
  const isImage = selectedElementType === 'image';
  const isIcon = selectedElementType === 'icon';
  const isButton = selectedElementType === 'button';

  // Badge color per type
  const badgeColor =
    isSocial ? 'bg-pink-100 text-pink-700 border-pink-200' :
    isLink ? 'bg-green-100 text-green-700 border-green-200' :
    isSection ? 'bg-purple-100 text-purple-700 border-purple-200' :
    isImage ? 'bg-orange-100 text-orange-700 border-orange-200' :
    'bg-blue-100 text-blue-700 border-blue-200';

  return (
    <div className="fixed top-16 right-0 w-80 bottom-0 bg-white border-l border-slate-200 shadow-2xl z-[9998] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span className="font-black text-sm uppercase tracking-wider">Edit</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>{selectedElementType}</span>
        </div>
        <button onClick={() => setSelectedElementId(null)} className="p-1 hover:bg-slate-200 rounded-lg transition-all">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Device Context */}
        <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-3 border border-blue-100">
          {device === 'desktop' && <Monitor className="w-4 h-4 text-blue-600" />}
          {device === 'tablet' && <Tablet className="w-4 h-4 text-blue-600" />}
          {device === 'mobile' && <Smartphone className="w-4 h-4 text-blue-600" />}
          <span className="text-[10px] font-black text-blue-700 uppercase">Editing for {device}</span>
        </div>

        {/* ─── SOCIAL MEDIA SECTION ─── */}
        {isSocial && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Social Media</span>
            </div>

            {/* Social Link */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Profile / Page URL</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.link || ''}
                onChange={(e) => updateStyle('link', e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            {/* Social Icon Image */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Custom Icon Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.iconImage || ''}
                  onChange={(e) => updateStyle('iconImage', e.target.value)}
                  placeholder="https://... or upload →"
                />
                <input type="file" ref={iconFileRef} onChange={handleIconUpload} className="hidden" accept="image/*,.gif,.svg" />
                <button
                  onClick={() => iconFileRef.current?.click()}
                  className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-all"
                  title="Upload Icon"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {currentStyles.iconImage && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={currentStyles.iconImage} alt="preview" className="w-8 h-8 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-slate-400 font-bold">Preview</span>
                  <button onClick={() => updateStyle('iconImage', '')} className="ml-auto text-[10px] text-red-400 hover:text-red-600 font-bold">Remove</button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── LINK / WHATSAPP SECTION ─── */}
        {isLink && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Link className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Link Settings</span>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Link URL</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold appearance-none cursor-pointer"
                value={LINK_OPTIONS.some(o => o.value === currentStyles.link) ? currentStyles.link : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') return;
                  updateStyle('link', e.target.value);
                }}
              >
                <option value="" disabled>Select a link...</option>
                {LINK_OPTIONS.map((opt, i) => (
                  <option key={i} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
                ))}
              </select>
              {(!LINK_OPTIONS.some(o => !o.disabled && o.value === currentStyles.link) || currentStyles.link === '') && (
                <input
                  type="text"
                  className="w-full p-2 mt-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.link || ''}
                  onChange={(e) => updateStyle('link', e.target.value)}
                  placeholder="Enter custom URL..."
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Link Text (if not icon)</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.text || ''}
                onChange={(e) => updateStyle('text', e.target.value)}
                placeholder="Button label..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Custom Icon / Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.iconImage || ''}
                  onChange={(e) => updateStyle('iconImage', e.target.value)}
                  placeholder="Image URL (replaces icon)"
                />
                <input type="file" ref={iconFileRef} onChange={handleIconUpload} className="hidden" accept="image/*,.gif,.svg" />
                <button
                  onClick={() => iconFileRef.current?.click()}
                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                  title="Upload Icon"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {currentStyles.iconImage && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={currentStyles.iconImage} alt="preview" className="w-8 h-8 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-slate-400 font-bold">Preview</span>
                  <button onClick={() => updateStyle('iconImage', '')} className="ml-auto text-[10px] text-red-400 hover:text-red-600 font-bold">Remove</button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── IMAGE / ICON CONTENT ─── */}
        {(isImage || isIcon) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{isIcon ? 'Icon Image' : 'Image'}</span>
            </div>

            {/* Image URL + Upload */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.value || ''}
                  onChange={(e) => updateStyle('value', e.target.value)}
                  placeholder="https://..."
                />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.gif,.svg" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all"
                  title="Upload Image"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>

              {/* Image Preview */}
              {currentStyles.value && (
                <div className="mt-2 relative group/preview">
                  <img
                    src={currentStyles.value}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    onClick={() => updateStyle('value', '')}
                    className="absolute top-1 right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold opacity-0 group-hover/preview:opacity-100 transition-opacity"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            {/* Image Fit */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Image Fit</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.objectFit || 'cover'}
                onChange={(e) => updateStyle('objectFit', e.target.value)}
              >
                <option value="cover">Cover (fill area, crop if needed)</option>
                <option value="contain">Contain (fit inside, no crop)</option>
                <option value="fill">Stretch (fill area exactly)</option>
                <option value="none">Original Size (no resize)</option>
                <option value="scale-down">Scale Down (shrink only)</option>
              </select>
            </div>

            {/* Image Position */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Image Position</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.objectPosition || 'center'}
                onChange={(e) => updateStyle('objectPosition', e.target.value)}
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
                <option value="bottom left">Bottom Left</option>
                <option value="bottom right">Bottom Right</option>
              </select>
            </div>

            {/* Width & Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Width</label>
                <input
                  type="text"
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.imgWidth || ''}
                  onChange={(e) => updateStyle('imgWidth', e.target.value)}
                  placeholder="e.g. 100%, 200px"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Height</label>
                <input
                  type="text"
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.imgHeight || ''}
                  onChange={(e) => updateStyle('imgHeight', e.target.value)}
                  placeholder="e.g. auto, 300px"
                />
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Border Radius</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.imgBorderRadius || ''}
                onChange={(e) => updateStyle('imgBorderRadius', e.target.value)}
                placeholder="e.g. 8px, 50%, 1rem"
              />
            </div>
          </section>
        )}

        {/* ─── BUTTON CONTENT ─── */}
        {isButton && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Link className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Button</span>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Button Text</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.text || ''}
                onChange={(e) => updateStyle('text', e.target.value)}
                placeholder="Text..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Link URL (optional)</label>
              <select
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold appearance-none cursor-pointer"
                value={LINK_OPTIONS.some(o => o.value === currentStyles.link) ? currentStyles.link : (currentStyles.link ? '__custom__' : '')}
                onChange={(e) => {
                  if (e.target.value === '__custom__') return;
                  updateStyle('link', e.target.value);
                }}
              >
                <option value="">None (no link)</option>
                {LINK_OPTIONS.map((opt, i) => (
                  <option key={i} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
                ))}
              </select>
              {currentStyles.link && !LINK_OPTIONS.some(o => !o.disabled && o.value === currentStyles.link) && (
                <input
                  type="text"
                  className="w-full p-2 mt-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.link || ''}
                  onChange={(e) => updateStyle('link', e.target.value)}
                  placeholder="Enter custom URL..."
                />
              )}
            </div>
          </section>
        )}

        {/* ─── SECTION BACKGROUND ─── */}
        {isSection && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Background Media</span>
            </div>

            {/* Background Image / GIF URL */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Background Image / GIF URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.backgroundImage || ''}
                  onChange={(e) => updateStyle('backgroundImage', e.target.value)}
                  placeholder="https://... (jpg, png, gif)"
                />
                {/* Upload image or GIF */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.gif" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                  title="Upload Image / GIF"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {currentStyles.backgroundImage && (
                <div className="mt-2 relative">
                  <img src={currentStyles.backgroundImage} alt="bg preview" className="w-full h-16 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                  <button onClick={() => updateStyle('backgroundImage', '')} className="absolute top-1 right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">✕</button>
                </div>
              )}
            </div>

            {/* Background Video URL */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Background Video URL (MP4 / WebM)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.backgroundVideo || ''}
                  onChange={(e) => updateStyle('backgroundVideo', e.target.value)}
                  placeholder="https://...video.mp4"
                />
                <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" accept="video/mp4,video/webm" />
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                  title="Upload Video"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* BG Size & Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">BG Size</label>
                <select
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.backgroundSize || 'cover'}
                  onChange={(e) => updateStyle('backgroundSize', e.target.value)}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">BG Position</label>
                <select
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.backgroundPosition || 'center'}
                  onChange={(e) => updateStyle('backgroundPosition', e.target.value)}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* ─── TYPOGRAPHY (for text / button / link) ─── */}
        {!isSocial && !isSection && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Type className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Typography</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Font Size</label>
                <input
                  type="text"
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.fontSize || ''}
                  onChange={(e) => updateStyle('fontSize', e.target.value)}
                  placeholder="e.g. 16px"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Font Weight</label>
                <select
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.fontWeight || ''}
                  onChange={(e) => updateStyle('fontWeight', e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="400">Normal</option>
                  <option value="600">Semi-Bold</option>
                  <option value="900">Black</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded-lg border-none p-0 bg-transparent cursor-pointer"
                  value={currentStyles.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                  value={currentStyles.color || ''}
                  onChange={(e) => updateStyle('color', e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* ─── SPACING ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Layout className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Spacing</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Margin</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.margin || ''}
                onChange={(e) => updateStyle('margin', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Padding</label>
              <input
                type="text"
                className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold"
                value={currentStyles.padding || ''}
                onChange={(e) => updateStyle('padding', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ─── BACKGROUND COLOR ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Palette className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Background Color</span>
          </div>
          <input
            type="color"
            className="w-full h-10 rounded-lg border-none p-0 bg-transparent cursor-pointer"
            value={currentStyles.backgroundColor || '#ffffff'}
            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
          />
        </section>

        {/* ─── APPLY TO ALL DEVICES ─── */}
        <div className="pt-6 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setApplyAll(v => !v)}>
            <div className="relative">
              <div className={`w-10 h-6 rounded-full transition-all ${applyAll ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${applyAll ? 'translate-x-4' : ''}`}></div>
            </div>
            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Apply to all devices</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => setSelectedElementId(null)}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
        >
          DONE
        </button>
      </div>
    </div>
  );
};

export default EditPanel;
