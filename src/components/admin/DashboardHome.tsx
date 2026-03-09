import React, { useState, useEffect } from 'react';
import { getLeads, getSections } from '../../services/api';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalSections: 0,
    recentLeads: [] as any[]
  });

  useEffect(() => {
    Promise.all([getLeads(), getSections()]).then(([leads, sections]) => {
      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter((l: any) => l.status === 'new').length,
        totalSections: sections.length,
        recentLeads: leads.slice(0, 5)
      });
    });
  }, []);

  const cards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'bg-blue-600', trend: '+12%', up: true },
    { label: 'New Leads', value: stats.newLeads, icon: Clock, color: 'bg-yellow-500', trend: '+5%', up: true },
    { label: 'Total Sections', value: stats.totalSections, icon: FileText, color: 'bg-purple-600', trend: '0%', up: true },
    { label: 'Conversion Rate', value: '18%', icon: TrendingUp, color: 'bg-green-600', trend: '-2%', up: false },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Welcome back, Admin!</h1>
        <p className="text-slate-500 font-medium">Here's what's happening with your website today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${card.up ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend}
                {card.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-sm font-bold mb-1">{card.label}</span>
              <span className="text-3xl font-black text-slate-900">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Recent Leads</h3>
            <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentLeads.map((lead) => (
              <div key={lead.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">
                    {lead.name[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{lead.name}</span>
                    <span className="text-xs text-slate-500 font-medium">{lead.service_type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider mb-1 ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left font-bold transition-all flex items-center justify-between">
                Update Hero Text
                <ArrowUpRight className="w-5 h-5" />
              </button>
              <button className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left font-bold transition-all flex items-center justify-between">
                Upload New Image
                <ArrowUpRight className="w-5 h-5" />
              </button>
              <button className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left font-bold transition-all flex items-center justify-between">
                Export Reports
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-10 p-6 bg-blue-600 rounded-3xl">
            <p className="font-bold mb-2">Need help?</p>
            <p className="text-sm text-blue-100 mb-4">Check our documentation or contact support.</p>
            <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black">Get Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
