import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointer2, 
  DollarSign, 
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';

interface MetaInsight {
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  reach: string;
  cpc: string;
  ctr: string;
}

const FacebookAds: React.FC = () => {
  const [data, setData] = useState<MetaInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/meta/ads');
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.details || result.error || "Failed to fetch ads data");
      
      setData(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalSpend = data.reduce((sum, item) => sum + parseFloat(item.spend), 0);
  const totalImpressions = data.reduce((sum, item) => sum + parseInt(item.impressions), 0);
  const totalClicks = data.reduce((sum, item) => sum + parseInt(item.clicks), 0);
  const avgCtr = data.length > 0 ? data.reduce((sum, item) => sum + parseFloat(item.ctr), 0) / data.length : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Fetching Live Meta Insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Meta Ads Engine
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time performance for the last 7 days</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href="https://adsmanager.facebook.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            Meta Ads Manager
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-100 p-6 rounded-[24px] flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-red-900 font-black text-lg mb-1">Connection Error</h4>
            <p className="text-red-600 font-medium text-sm leading-relaxed max-w-2xl">{error}</p>
            <div className="mt-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <span>Possible Fixes:</span>
              <span className="text-red-400">• Check Ad Account ID</span>
              <span className="text-red-400">• Refresh Access Token</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Spend', value: `₹${totalSpend.toLocaleString()}`, icon: DollarSign, color: 'blue' },
          { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'indigo' },
          { label: 'Clicks', value: totalClicks.toLocaleString(), icon: MousePointer2, color: 'purple' },
          { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, color: 'emerald' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Campaigns Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-black text-slate-900">Active Campaigns</h3>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">
            Live from Meta
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Campaign Name</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Spend</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">CTR</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">CPC</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Impressions</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((campaign, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-default">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{campaign.campaign_name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-slate-900">₹{parseFloat(campaign.spend).toLocaleString()}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{parseFloat(campaign.ctr).toFixed(2)}%</span>
                      <div className="w-16 h-1 background bg-slate-100 rounded-full mt-1.5">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(parseFloat(campaign.ctr) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-slate-500 font-bold text-sm">₹{parseFloat(campaign.cpc || '0').toFixed(2)}</span>
                  </td>
                  <td className="p-6 font-bold text-slate-600">
                    {parseInt(campaign.impressions).toLocaleString()}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 font-black text-blue-600 text-sm">
                      {campaign.clicks} <span className="text-[10px] text-slate-400 font-black uppercase">Clicks</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="text-slate-400 font-bold">No active campaigns found in the last 7 days.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default FacebookAds;
