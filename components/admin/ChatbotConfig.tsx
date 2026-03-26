import React, { useState, useEffect } from 'react';
import { Bot, Save, Loader2, MessageSquare, Clock, User, Sparkles } from 'lucide-react';
import { getChatConfig, updateChatbotConfig, getChatSessions, getChatSession } from '../../services/api';

const ChatbotConfig: React.FC = () => {
  const [config, setConfig] = useState({ enabled: false, greeting: '', systemPrompt: '' });
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  useEffect(() => {
    Promise.all([getChatConfig(), getChatSessions()])
      .then(([cfg, sess]) => {
        setConfig({
          enabled: cfg.enabled,
          greeting: cfg.greeting || '',
          systemPrompt: cfg.systemPrompt || '' 
        });
        setSessions(sess || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateChatbotConfig(config);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const loadSession = async (id: string) => {
    setSelectedSession(id);
    setLoadingTranscript(true);
    try {
      const msgs = await getChatSession(id);
      setTranscript(msgs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const formatDate = (ts: string) => {
    if (!ts) return '';
    return new Date(ts.replace(' ', 'T') + 'Z').toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
          <Bot className="w-7 h-7 text-blue-600" /> AI Chatbot Configuration
        </h1>
        <p className="text-slate-500 mt-1">Manage Gemini AI settings, monitor conversations, and update domain knowledge.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> General Settings
            </h2>
            
            <div className="space-y-4 text-[13px]">
              <label className="flex items-center justify-between cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-slate-900">Enable Chatbot</div>
                  <div className="text-[11px] text-slate-500">Show widget on website</div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <input type="checkbox" className="sr-only" checked={config.enabled} onChange={e => setConfig({...config, enabled: e.target.checked})} />
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Greeting Message</label>
                <textarea
                  value={config.greeting}
                  onChange={e => setConfig({...config, greeting: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Welcome message..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>System Prompt (Domain Knowledge)</span>
                  <span className="text-[10px] text-slate-400 font-normal">{config.systemPrompt.length} chars</span>
                </label>
                <textarea
                  value={config.systemPrompt}
                  onChange={e => setConfig({...config, systemPrompt: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y h-[250px] font-mono text-[11px]"
                  placeholder="Add custom pricing, services, or rules...&#10;The system already knows EazyService basic details."
                />
                <p className="text-[10px] text-slate-400 mt-1">This text is injected into Gemini's base context to guide its answers.</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sessions & Transcript */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="grid grid-cols-3 h-full divide-x divide-slate-100">
              
              {/* Session List */}
              <div className="col-span-1 flex flex-col bg-slate-50/50">
                <div className="p-3 border-b border-slate-100 bg-white shadow-sm z-10">
                  <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" /> Recent Conversations
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {sessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-[12px]">No conversations yet</div>
                  ) : sessions.map(s => (
                    <div
                      key={s.session_id}
                      onClick={() => loadSession(s.session_id)}
                      className={`p-3 cursor-pointer transition-colors ${selectedSession === s.session_id ? 'bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-slate-100 border-l-2 border-transparent'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-500 truncate mr-2">{s.session_id.split('_')[1]}</span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {formatDate(s.last_active)}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-2 leading-snug">
                        {s.first_message || 'Empty session...'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{s.message_count} msgs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transcript View */}
              <div className="col-span-2 flex flex-col bg-white">
                {!selectedSession ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-[13px] font-medium">Select a conversation to view</p>
                  </div>
                ) : loadingTranscript ? (
                  <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : (
                  <>
                    <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                        Transcript <span className="text-[10px] font-normal font-mono text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">{selectedSession}</span>
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">{transcript.length} messages</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                      {transcript.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 shrink-0"><Bot className="w-3.5 h-3.5 text-blue-600" /></div>}
                          <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                            {msg.content}
                            <div className={`text-[9px] mt-1.5 text-right opacity-60 font-medium`}>{formatDate(msg.created_at)}</div>
                          </div>
                          {msg.role === 'user' && <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center ml-2 mt-0.5 shrink-0"><User className="w-3.5 h-3.5 text-slate-600" /></div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatbotConfig;
