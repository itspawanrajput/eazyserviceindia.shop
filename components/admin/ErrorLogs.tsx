import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, AlertCircle, Info, Search, Trash2, RefreshCw, ChevronDown, ChevronUp, X, Loader2, Shield } from 'lucide-react';
import { getErrorLogs, getErrorLogById, deleteErrorLog, clearAllErrorLogs, getErrorLogStats } from '../../services/api';

const ErrorLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, errors: 0, warnings: 0, infos: 0, last_24h: 0, errors_24h: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<any>(null);
  const [filters, setFilters] = useState({ level: '', source: '', search: '' });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.level) params.set('level', filters.level);
      if (filters.source) params.set('source', filters.source);
      if (filters.search) params.set('search', filters.search);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));
      const paramStr = params.toString() ? `?${params.toString()}` : '';

      const [logsData, statsData] = await Promise.all([
        getErrorLogs(paramStr),
        getErrorLogStats()
      ]);
      setLogs(logsData.logs || []);
      setTotal(logsData.total || 0);
      setStats(statsData || {});
    } catch (err) {
      console.error('Failed to fetch error logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); return; }
    try {
      const detail = await getErrorLogById(id);
      setExpandedDetail(detail);
      setExpandedId(id);
    } catch (err) {
      console.error('Failed to load log detail:', err);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteErrorLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); }
  };

  const handleClearAll = async () => {
    await clearAllErrorLogs();
    setLogs([]);
    setTotal(0);
    setShowClearConfirm(false);
    fetchLogs();
  };

  const levelBadge = (level: string) => {
    const cls: Record<string, string> = {
      error: 'bg-red-50 text-red-700 border-red-200',
      warn: 'bg-amber-50 text-amber-700 border-amber-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    const Icon = level === 'error' ? AlertCircle : level === 'warn' ? AlertTriangle : Info;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cls[level] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        <Icon className="w-3 h-3" />{level}
      </span>
    );
  };

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      api: 'bg-purple-50 text-purple-700',
      auth: 'bg-rose-50 text-rose-700',
      email: 'bg-sky-50 text-sky-700',
      db: 'bg-orange-50 text-orange-700',
      frontend: 'bg-indigo-50 text-indigo-700',
      chatbot: 'bg-emerald-50 text-emerald-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors[source] || 'bg-slate-100 text-slate-600'}`}>
        {source}
      </span>
    );
  };

  const formatDate = (ts: string) => {
    if (!ts) return '—';
    const d = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-4 text-[13px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-medium text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" /> Error Logs
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Monitor server errors, warnings, and frontend issues.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
          </button>
          <button onClick={() => fetchLogs()} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold hover:bg-red-100 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Total Logs', value: stats.total || 0, color: 'slate' },
          { label: 'Errors (24h)', value: stats.errors_24h || 0, color: 'red' },
          { label: 'Warnings', value: stats.warnings || 0, color: 'amber' },
          { label: 'Events (24h)', value: stats.last_24h || 0, color: 'blue' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-500">{s.label}</div>
            <div className={`text-[22px] font-medium leading-none mt-1 ${s.color === 'red' ? 'text-red-600' : s.color === 'amber' ? 'text-amber-600' : s.color === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search error messages..."
            value={filters.search}
            onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filters.level}
          onChange={e => { setFilters(p => ({ ...p, level: e.target.value })); setPage(0); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] appearance-none cursor-pointer"
        >
          <option value="">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={filters.source}
          onChange={e => { setFilters(p => ({ ...p, source: e.target.value })); setPage(0); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] appearance-none cursor-pointer"
        >
          <option value="">All Sources</option>
          <option value="api">API</option>
          <option value="auth">Auth</option>
          <option value="email">Email</option>
          <option value="db">Database</option>
          <option value="frontend">Frontend</option>
          <option value="chatbot">Chatbot</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No error logs found</p>
            <p className="text-[12px] mt-1">All systems running smoothly</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => (
              <div key={log.id}>
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => handleExpand(log.id)}
                >
                  <div className="w-20 shrink-0">{levelBadge(log.level)}</div>
                  <div className="w-20 shrink-0">{sourceBadge(log.source)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium truncate text-[12px]">{log.message}</p>
                    {log.endpoint && <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{log.endpoint}</p>}
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{formatDate(log.created_at)}</div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(log.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedId === log.id ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>

                {/* Expanded Detail */}
                {expandedId === log.id && expandedDetail && (
                  <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 py-3 text-[12px]">
                      <div><span className="text-slate-400 font-bold">IP:</span> <span className="font-mono text-slate-600">{expandedDetail.ip_address || '—'}</span></div>
                      <div><span className="text-slate-400 font-bold">Endpoint:</span> <span className="font-mono text-slate-600">{expandedDetail.endpoint || '—'}</span></div>
                      <div className="col-span-2"><span className="text-slate-400 font-bold">User Agent:</span> <span className="text-slate-600 text-[11px]">{expandedDetail.user_agent || '—'}</span></div>
                    </div>
                    {expandedDetail.stack && (
                      <div className="mt-2">
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Stack Trace:</p>
                        <pre className="bg-slate-900 text-green-400 text-[11px] p-4 rounded-xl overflow-x-auto font-mono leading-relaxed max-h-[300px] overflow-y-auto">{expandedDetail.stack}</pre>
                      </div>
                    )}
                    {expandedDetail.meta && (
                      <div className="mt-2">
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Metadata:</p>
                        <pre className="bg-slate-800 text-blue-300 text-[11px] p-3 rounded-xl overflow-x-auto font-mono">{JSON.stringify(JSON.parse(expandedDetail.meta), null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[12px]">
            <span className="text-slate-500">Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-40 font-bold">Previous</button>
              <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-40 font-bold">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Clear All Logs?</h3>
                <p className="text-[12px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors text-[13px]">Cancel</button>
              <button onClick={handleClearAll} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-[13px]">Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogs;
