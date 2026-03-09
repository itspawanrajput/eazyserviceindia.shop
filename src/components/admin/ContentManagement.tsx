import React, { useState, useEffect } from 'react';
import { getSections, saveSection, deleteSection, Section, uploadFile } from '../../services/api';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Save, 
  Image as ImageIcon, 
  Monitor, 
  Smartphone, 
  Tablet,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

const ContentManagement: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const data = await getSections();
      setSections(data);
    } catch (err) {
      console.error('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (section: Section) => {
    try {
      await saveSection({ ...section, is_visible: !section.is_visible });
      fetchSections();
    } catch (err) {
      console.error('Failed to toggle visibility');
    }
  };

  const handleSave = async (section: Section) => {
    try {
      await saveSection(section);
      alert('Section saved successfully!');
      fetchSections();
    } catch (err) {
      console.error('Failed to save section');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await deleteSection(id);
      fetchSections();
    } catch (err) {
      console.error('Failed to delete section');
    }
  };

  const handleAddSection = () => {
    const newId = `section_${Date.now()}`;
    const newSection: Section = {
      id: newId,
      title: 'New Section',
      content: [],
      order_index: sections.length,
      is_visible: true,
      config: {
        desktop: { fontSize: '16px', padding: '20px' },
        mobile: { fontSize: '14px', padding: '10px' }
      }
    };
    setSections([...sections, newSection]);
    setExpandedId(newId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Content Management</h1>
          <p className="text-slate-500 font-medium">Edit your website sections dynamically</p>
        </div>
        <button 
          onClick={handleAddSection}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-20 text-center bg-white rounded-[32px] border border-slate-200">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Loading content...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[32px] border border-slate-200">
            <p className="text-slate-500 font-bold">No sections found. Start by adding one!</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <div key={section.id} className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-slate-300 cursor-move" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Section {index + 1}</span>
                    <span className="font-bold text-slate-900">{section.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleVisibility(section)}
                    className={`p-2 rounded-xl transition-all ${section.is_visible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-100'}`}
                  >
                    {section.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    {expandedId === section.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {expandedId === section.id && (
                <div className="p-8 border-t border-slate-100 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Basic Info</h3>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Section ID (for anchors)</label>
                        <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          value={section.id}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[index].id = e.target.value;
                            setSections(newSections);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Display Title</label>
                        <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          value={section.title}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[index].title = e.target.value;
                            setSections(newSections);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Device Settings</h3>
                      <div className="flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl font-bold text-xs">
                          <Monitor className="w-4 h-4" /> Desktop
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs">
                          <Tablet className="w-4 h-4" /> Tablet
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs">
                          <Smartphone className="w-4 h-4" /> Mobile
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Font Size</label>
                          <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                            value={section.config.desktop?.fontSize || '16px'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Padding</label>
                          <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                            value={section.config.desktop?.padding || '20px'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => handleDelete(section.id)}
                      className="flex items-center gap-2 px-6 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Section
                    </button>
                    <button 
                      onClick={() => handleSave(section)}
                      className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentManagement;
