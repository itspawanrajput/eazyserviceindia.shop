import React, { useState, useEffect } from 'react';
import { getLeads, updateLeadStatus, deleteLead, Lead } from '../../services/api';
import {
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateLeadStatus(id, status);
      fetchLeads();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await deleteLead(id);
      fetchLeads();
    } catch (err) {
      console.error('Failed to delete lead');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Location', 'Service', 'Source', 'Message', 'Status', 'Created At', 'Preferred Date', 'Preferred Time'];
    const rows = leads.map(l => [
      l.name,
      l.phone,
      l.email,
      l.location,
      l.service_type,
      l.source || 'Unknown',
      l.message.replace(/,/g, ' '),
      l.status,
      new Date(l.created_at).toLocaleString(),
      l.preferred_date || '',
      l.preferred_time || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sourceColors: Record<string, string> = {
    'Hero Form': 'bg-purple-50 text-purple-600',
    'Booking Form': 'bg-teal-50 text-teal-600',
    'Popup Offer': 'bg-orange-50 text-orange-600',
    'unknown': 'bg-slate-50 text-slate-500'
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || (lead.source || 'unknown') === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Lead Management</h1>
          <p className="text-slate-500 font-medium">Track and manage your customer inquiries</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="Hero Form">Hero Form</option>
            <option value="Booking Form">Booking Form</option>
            <option value="Popup Offer">Popup Offer</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Service & Location</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Source</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <Clock className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Loading leads...</p>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="text-slate-500 font-bold">No leads found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 mb-1">{lead.name}</span>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider w-fit mb-2">
                          {lead.service_type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                          <MapPin className="w-3 h-3" /> {lead.location}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${sourceColors[lead.source || 'unknown'] || sourceColors['unknown']}`}>
                        {lead.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(lead.created_at).toLocaleDateString()}
                          <span className="text-slate-300">|</span>
                          {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {(lead.preferred_date || lead.preferred_time) && (
                          <div className="text-[10px] text-blue-600 font-black uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                            Pref: {lead.preferred_date} {lead.preferred_time}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider outline-none border-none cursor-pointer ${lead.status === 'new' ? 'bg-blue-100 text-blue-600' :
                          lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadManagement;
