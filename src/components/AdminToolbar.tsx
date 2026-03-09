import React from 'react';
import { useVisualBuilder } from '../context/VisualBuilderContext';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Save, 
  Send, 
  Eye, 
  Users, 
  Settings, 
  LogOut, 
  MousePointer2,
  Type
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/api';

const AdminToolbar: React.FC = () => {
  const { 
    isEditMode, setIsEditMode, 
    device, setDevice, 
    save, publish 
  } = useVisualBuilder();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-[9999] flex items-center justify-between px-6 shadow-2xl border-b border-white/10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-sm">B</div>
          <span className="font-black tracking-tighter text-lg">BUILDER</span>
        </div>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <div className="flex items-center bg-white/5 rounded-xl p-1">
          <button 
            onClick={() => setIsEditMode(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            EDIT
          </button>
          <button 
            onClick={() => setIsEditMode(false)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isEditMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            PREVIEW
          </button>
        </div>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-lg transition-all ${device === 'desktop' ? 'bg-white/10 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded-lg transition-all ${device === 'tablet' ? 'bg-white/10 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-lg transition-all ${device === 'mobile' ? 'bg-white/10 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/admin/leads')}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white font-bold text-xs transition-all"
        >
          <Users className="w-4 h-4" />
          LEADS
        </button>
        <button 
          onClick={() => navigate('/admin/security')}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white font-bold text-xs transition-all"
        >
          <Settings className="w-4 h-4" />
          ACCOUNT
        </button>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <button 
          onClick={save}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs transition-all"
        >
          <Save className="w-4 h-4" />
          SAVE DRAFT
        </button>
        <button 
          onClick={publish}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-900/20"
        >
          <Send className="w-4 h-4 text-white" />
          PUBLISH
        </button>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <button 
          onClick={handleLogout}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AdminToolbar;
