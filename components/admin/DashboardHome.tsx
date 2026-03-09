import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Globe
} from 'lucide-react';
import { getLeads, getVisitors } from '../../services/api';

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    conversionRate: 0,
    uniqueVisitors: 0,
    avgResponseTime: '2.4h'
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leads, visitorsData] = await Promise.all([
          getLeads(),
          getVisitors()
        ]);

        const newLeadsCount = leads.filter((l: any) => l.status === 'new').length;

        setStats(prev => ({
          ...prev,
          totalLeads: leads.length,
          newLeads: newLeadsCount,
          conversionRate: leads.length > 0 ? Math.round((leads.filter((l: any) => l.status === 'completed').length / leads.length) * 100) : 0,
          uniqueVisitors: visitorsData?.stats?.unique_visitors || 0
        }));

        setRecentLeads(leads.slice(0, 5));
        setRecentVisitors(visitorsData?.visitors?.slice(0, 5) || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening with your leads today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          trend="up"
          trendValue="12%"
          color="bg-blue-600"
        />
        <StatCard
          title="New Leads"
          value={stats.newLeads}
          icon={MessageSquare}
          trend="up"
          trendValue="5%"
          color="bg-amber-500"
        />
        <StatCard
          title="Unique Visitors"
          value={stats.uniqueVisitors}
          icon={Globe}
          color="bg-purple-600"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          trend="down"
          trendValue="2%"
          color="bg-emerald-600"
        />
        <StatCard
          title="Avg. Response"
          value={stats.avgResponseTime}
          icon={Clock}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Leads Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-bottom border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Recent Leads</h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Service</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.service_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lead.status === 'new' ? 'bg-amber-100 text-amber-700' :
                            lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'
                          }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No leads found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Calendar Mini */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors text-left flex justify-between items-center">
                Add New Lead
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </button>
              <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors text-left flex justify-between items-center">
                Update Content
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </button>
              <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-900/20">
                Launch Visual Builder
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Database</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  CONNECTED
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Auth Service</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Storage</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  92% FREE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-2">
          <div className="p-6 border-bottom border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Live Website Traffic
              </h2>
              <p className="text-xs text-slate-500 mt-1">Real-time visitor data and device tracking</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">IP Address / Path</th>
                  <th className="px-6 py-4 font-medium">Device & OS</th>
                  <th className="px-6 py-4 font-medium">Browser</th>
                  <th className="px-6 py-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : recentVisitors.length > 0 ? (
                  recentVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 font-mono text-sm tracking-tight">{v.ip_address}</div>
                        <div className="text-xs text-blue-500 truncate max-w-[200px] mt-0.5 max-h-4 overflow-hidden" title={v.path}>{v.path}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">{v.device_type}</span>
                          <span className="text-sm text-slate-600">{v.os}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{v.browser}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 text-right">
                        {new Date(v.visit_time + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No visitors logged yet. They will appear here once someone visits the public site.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
