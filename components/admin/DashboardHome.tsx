import React, { useState, useEffect, useRef } from 'react';
import { Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getLeads, getVisitors } from '../../services/api';

// ─── Tiny sparkline chart using canvas ──────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: h - ((v - min) / range) * (h - 4) - 2,
    }));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cp = { x: (pts[i - 1].x + pts[i].x) / 2, y: pts[i - 1].y };
      ctx.bezierCurveTo(cp.x, cp.y, cp.x, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Fill under line
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = color + '18';
    ctx.fill();
  }, [data, color]);
  return <canvas ref={ref} width={120} height={28} style={{ display: 'block', width: '100%' }} />;
};

// ─── Helper: format visit_time safely ───────────────────────────────────────
function formatTime(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return '—';
  const diff = Math.round((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Helper: get traffic source label ───────────────────────────────────────
function getSource(v: any): string {
  if (v.utm_source) return v.utm_source;
  if (v.referrer) return v.referrer.replace(/^https?:\/\//, '').split('/')[0];
  return 'Direct';
}

// ─── DashboardHome ───────────────────────────────────────────────────────────
const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({ totalLeads: 0, newLeads: 0, conversionRate: 0, uniqueVisitors: 0 });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [sourceCounts, setSourceCounts] = useState<{ label: string; val: number; color: string }[]>([]);
  const [leadsOverTime, setLeadsOverTime] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [leads, visitorsData] = await Promise.all([getLeads(), getVisitors()]);

        // Pipeline counts
        const pipe: Record<string, number> = {};
        leads.forEach((l: any) => { pipe[l.status] = (pipe[l.status] || 0) + 1; });
        setPipeline(pipe);

        // KPI
        setStats({
          totalLeads: leads.length,
          newLeads: leads.filter((l: any) => l.status === 'new').length,
          conversionRate: leads.length > 0 ? Math.round((leads.filter((l: any) => l.status === 'completed').length / leads.length) * 100) : 0,
          uniqueVisitors: visitorsData?.stats?.unique_visitors || 0,
        });

        setRecentLeads(leads.slice(0, 5));
        setRecentVisitors(visitorsData?.visitors?.slice(0, 6) || []);

        // Leads over time (last 30 days)
        const now = Date.now();
        const buckets = Array(30).fill(0);
        leads.forEach((l: any) => {
          if (!l.created_at) return;
          const d = new Date(l.created_at.replace(' ', 'T') + 'Z');
          const daysAgo = Math.floor((now - d.getTime()) / 86400000);
          if (daysAgo >= 0 && daysAgo < 30) buckets[29 - daysAgo]++;
        });
        setLeadsOverTime(buckets);

        // Traffic sources from visitors
        const srcMap: Record<string, number> = { Direct: 0, Organic: 0, Paid: 0, Social: 0, Referral: 0 };
        (visitorsData?.visitors || []).forEach((v: any) => {
          if (v.utm_source) {
            const s = v.utm_source.toLowerCase();
            if (s.includes('google') && v.utm_medium === 'cpc') srcMap.Paid++;
            else if (s.includes('facebook') || s.includes('instagram')) srcMap.Social++;
            else srcMap.Referral++;
          } else if (v.referrer) {
            srcMap.Organic++;
          } else {
            srcMap.Direct++;
          }
        });
        const colors = { Direct: '#7F77DD', Organic: '#378ADD', Paid: '#1D9E75', Social: '#EF9F27', Referral: '#E05C5C' };
        const total = Object.values(srcMap).reduce((a, b) => a + b, 0) || 1;
        setSourceCounts(Object.entries(srcMap).filter(([, v]) => v > 0).map(([label, val]) => ({
          label,
          val: Math.round((val / total) * 100),
          color: (colors as any)[label] || '#999',
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusColor: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700',
    contacted: 'bg-purple-50 text-purple-700',
    qualified: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-teal-50 text-teal-700',
    lost: 'bg-rose-50 text-rose-700',
  };

  const pipelineConfig = [
    { key: 'new', label: 'New', color: '#378ADD' },
    { key: 'contacted', label: 'Contacted', color: '#7F77DD' },
    { key: 'qualified', label: 'Qualified', color: '#1D9E75' },
    { key: 'completed', label: 'Closed', color: '#639922' },
    { key: 'lost', label: 'Lost', color: '#E05C5C' },
  ];
  const pipeMax = Math.max(...pipelineConfig.map(p => pipeline[p.key] || 0), 1);

  const kpis = [
    { label: 'Total Leads', value: stats.totalLeads, trend: 'up', trendLabel: '+12%', color: '#378ADD', spark: leadsOverTime.length ? leadsOverTime : [0] },
    { label: 'New Leads', value: stats.newLeads, trend: 'up', trendLabel: '+5%', color: '#1D9E75', spark: leadsOverTime.length ? leadsOverTime.map(v => Math.round(v * 0.4)) : [0] },
    { label: 'Unique Visitors', value: stats.uniqueVisitors, trend: 'up', trendLabel: '+18%', color: '#7F77DD', spark: [80, 110, 95, 140, 120, 160, 155, 180, 170, stats.uniqueVisitors || 200] },
    { label: 'Conversion', value: `${stats.conversionRate}%`, trend: 'down', trendLabel: '-2%', color: '#EF9F27', spark: [3.8, 3.5, 3.9, 3.2, 3.7, 3.4, 3.1, 3.5, 3.3, stats.conversionRate || 0] },
    { label: 'Avg. Response', value: '2.4h', trend: 'neutral', trendLabel: 'No change', color: '#888', spark: [2.1, 2.4, 2.2, 2.5, 2.3, 2.4, 2.6, 2.4, 2.3, 2.4] },
  ];

  const Skeleton = ({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) => (
    <div className={`${h} ${w} bg-slate-100 rounded animate-pulse`} />
  );

  return (
    <div className="space-y-4 text-[13px]">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-medium text-slate-900">Dashboard Overview</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Welcome back — here's what's happening with your leads today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] bg-[#EAF3DE] text-[#3B6D11] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#639922] rounded-full animate-pulse" /> Live
          </span>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1 hover:border-slate-300 transition-colors">
            <div className="text-[11px] text-slate-500">{k.label}</div>
            {loading ? <Skeleton h="h-7" w="w-16" /> : (
              <div className="text-[22px] font-medium text-slate-900 leading-none">{k.value}</div>
            )}
            <div className={`text-[11px] flex items-center gap-1 ${k.trend === 'up' ? 'text-[#3B6D11]' : k.trend === 'down' ? 'text-[#A32D2D]' : 'text-slate-400'}`}>
              {k.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : k.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
              {k.trendLabel}
            </div>
            <div className="mt-1">
              <Sparkline data={k.spark} color={k.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Mid grid: Leads chart | Traffic donut | System ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Leads over time */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-slate-900">Leads over time</span>
            <span className="text-[11px] text-blue-600 cursor-pointer">Last 30 days</span>
          </div>
          <div className="h-[120px] relative">
            <LeadsLineChart data={leadsOverTime} />
          </div>
        </div>

        {/* Traffic sources donut */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-slate-900">Traffic sources</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-4"><Skeleton h="h-24" w="w-24" /><div className="flex-1 space-y-2"><Skeleton /><Skeleton /><Skeleton /></div></div>
          ) : (
            <div className="flex items-center gap-4">
              <DonutChart data={sourceCounts} />
              <div className="flex flex-col gap-1.5 text-[12px]">
                {sourceCounts.map(s => (
                  <span key={s.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-slate-500">{s.label}</span>
                    <span className="font-medium ml-auto pl-2">{s.val}%</span>
                  </span>
                ))}
                {sourceCounts.length === 0 && <span className="text-slate-400 text-[11px]">No visitor data yet</span>}
              </div>
            </div>
          )}
        </div>

        {/* System status + Quick actions */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <div className="text-[13px] font-medium text-slate-900 mb-3">System Status</div>
          {[
            { label: 'Database', status: 'Connected', color: '#639922', dot: 'bg-[#639922]' },
            { label: 'Auth Service', status: 'Active', color: '#639922', dot: 'bg-[#639922]' },
            { label: 'Storage', status: '92% used', color: '#BA7517', dot: 'bg-amber-500' },
            { label: 'API Uptime', status: '99.9%', color: '#639922', dot: 'bg-[#639922]' },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-none text-[12px]">
              <span className="text-slate-600">{s.label}</span>
              <span className="flex items-center gap-1.5 font-medium" style={{ color: s.color }}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.status}
              </span>
            </div>
          ))}
          <div className="mt-3 space-y-2">
            <button className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-700 hover:bg-white transition-colors">
              Add new lead <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </button>
            <button className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-700 hover:bg-white transition-colors">
              Update content <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </button>
            <button className="w-full px-3 py-2 rounded-lg bg-[#185FA5] text-white text-[12px] font-medium hover:bg-[#0C447C] transition-colors">
              Launch Visual Builder
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom grid: Leads table | Pipeline + Traffic ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-slate-900">Recent Leads</span>
            <span className="text-[11px] text-blue-600 cursor-pointer">View all ↗</span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-slate-400 text-[11px] border-b border-slate-100">
                <th className="text-left font-medium pb-2">Customer</th>
                <th className="text-left font-medium pb-2">Service</th>
                <th className="text-left font-medium pb-2">Status</th>
                <th className="text-left font-medium pb-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? [1, 2, 3, 4].map(i => (
                <tr key={i}><td colSpan={4} className="py-2"><Skeleton h="h-8" /></td></tr>
              )) : recentLeads.length > 0 ? recentLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-800">{lead.name}</div>
                    <div className="text-[11px] text-slate-400">{lead.phone}</div>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{lead.service_type}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2 text-[11px] text-slate-400">
                    {lead.created_at ? new Date(lead.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">No leads yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pipeline + Live Traffic */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col gap-4">

          {/* Pipeline */}
          <div>
            <div className="text-[13px] font-medium text-slate-900 mb-3">Lead Pipeline</div>
            <div className="flex flex-col gap-2">
              {pipelineConfig.map(p => {
                const count = pipeline[p.key] || 0;
                const pct = Math.round((count / pipeMax) * 100);
                return (
                  <div key={p.key} className="flex items-center gap-2 text-[12px]">
                    <span className="w-16 text-slate-500 flex-shrink-0">{p.label}</span>
                    <div className="flex-1 bg-slate-100 rounded h-1.5 overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                    <span className="w-4 text-right font-medium text-slate-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Traffic */}
          <div className="border-t border-slate-100 pt-3 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[13px] font-medium text-slate-900">Live Traffic</span>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left font-medium pb-1.5">IP / Path</th>
                  <th className="text-left font-medium pb-1.5">Device</th>
                  <th className="text-left font-medium pb-1.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? [1, 2, 3].map(i => (
                  <tr key={i}><td colSpan={3} className="py-1.5"><Skeleton h="h-6" /></td></tr>
                )) : recentVisitors.length > 0 ? recentVisitors.slice(0, 4).map(v => (
                  <tr key={v.id}>
                    <td className="py-1.5 pr-2">
                      <div className="font-mono text-[10px] text-slate-500">{v.ip_address?.split(',')[0].trim()}</div>
                      <div className="text-blue-500">{(v.path || '/').split('?')[0]}</div>
                    </td>
                    <td className="py-1.5 pr-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${v.device_type === 'mobile' ? 'bg-[#EEEDFE] text-[#534AB7]' : 'bg-[#E6F1FB] text-[#185FA5]'}`}>
                        {v.device_type || 'desktop'}
                      </span>
                    </td>
                    <td className="py-1.5 text-slate-400">{formatTime(v.visit_time)}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="py-4 text-center text-slate-400">No visitors yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Leads Line Chart (canvas) ───────────────────────────────────────────────
const LeadsLineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const pad = { left: 20, right: 8, top: 8, bottom: 18 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const maxV = Math.max(...data, 1);
    const pts = data.map((v, i) => ({
      x: pad.left + (i / (data.length - 1)) * chartW,
      y: pad.top + chartH - (v / maxV) * chartH,
    }));
    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,.05)';
    ctx.lineWidth = 0.5;
    [0.25, 0.5, 0.75, 1].forEach(fraction => {
      const y = pad.top + chartH - fraction * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    });
    // X axis labels (every ~6 points)
    ctx.fillStyle = '#999';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    const now = new Date();
    data.forEach((_, i) => {
      if (i % 5 !== 0 && i !== data.length - 1) return;
      const d = new Date(now);
      d.setDate(d.getDate() - (data.length - 1 - i));
      const lbl = `${d.getDate()}/${d.getMonth() + 1}`;
      ctx.fillText(lbl, pts[i].x, h - 3);
    });
    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cp = { x: (pts[i - 1].x + pts[i].x) / 2, y: pts[i - 1].y };
      ctx.bezierCurveTo(cp.x, cp.y, cp.x, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = '#378ADD';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, 'rgba(55,138,221,0.2)');
    grad.addColorStop(1, 'rgba(55,138,221,0)');
    ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
    ctx.lineTo(pts[0].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }, [data]);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

// ─── Donut Chart (canvas) ────────────────────────────────────────────────────
const DonutChart: React.FC<{ data: { label: string; val: number; color: string }[] }> = ({ data }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6, inner = r * 0.65;
    const total = data.reduce((a, b) => a + b.val, 0) || 1;
    let angle = -Math.PI / 2;
    data.forEach(({ val, color }) => {
      const sweep = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      angle += sweep;
    });
    // Cut out centre
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, [data]);
  if (!data.length) return <div className="w-24 h-24 bg-slate-100 rounded-full" />;
  return <canvas ref={ref} style={{ width: 96, height: 96 }} />;
};

export default DashboardHome;
