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
  Calendar,
  X,
  MessageSquare,
  Eye
} from 'lucide-react';

const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
    const csvEscape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

    const headers = ['Name', 'Phone', 'Email', 'Location', 'Service', 'Source', 'Message', 'Status', 'Created At', 'Preferred Date', 'Preferred Time'];
    const rows = leads.map(l => [
      csvEscape(l.name),
      csvEscape(l.phone),
      csvEscape(l.email),
      csvEscape(l.location),
      csvEscape(l.service_type),
      csvEscape(l.source || 'Unknown'),
      csvEscape(l.message),
      csvEscape(l.status),
      csvEscape(new Date(l.created_at).toLocaleString()),
      csvEscape(l.preferred_date || ''),
      csvEscape(l.preferred_time || '')
    ]);

    const csvContent = [headers.map(csvEscape), ...rows].map(e => e.join(",")).join("\n");
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
                          onClick={() => setSelectedLead(lead)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="View Full Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Lead"
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

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedLead.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{new Date(selectedLead.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Message Block (The most important part) */}
              {selectedLead.message && (
                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Customer Message
                  </h4>
                  <p className="text-slate-700 italic">"{selectedLead.message}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="font-bold text-slate-900 break-all">{selectedLead.phone}</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                              className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-1"
                              title="Call Customer"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-[#E8F8F0] text-[#25D366] rounded-lg text-xs font-bold hover:bg-[#D1F1E1] transition-colors flex items-center gap-1"
                              title="Message on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Email Address</p>
                        {selectedLead.email ? (
                          <a href={`mailto:${selectedLead.email}`} className="font-bold text-blue-600 hover:underline break-all mt-1 block">
                            {selectedLead.email}
                          </a>
                        ) : (
                          <p className="font-bold text-slate-900 break-all mt-1">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Service Details</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <span className="font-black text-blue-600">S</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Service Requested</p>
                        <p className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit mt-1">{selectedLead.service_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Detected Location</p>
                        <p className="font-bold text-slate-900 mt-1">{selectedLead.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields (From Form Builder) */}
              {selectedLead.custom_data && selectedLead.custom_data !== "{}" && (() => {
                try {
                  const customFields = JSON.parse(selectedLead.custom_data);
                  const keys = Object.keys(customFields);
                  if (keys.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Additional Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {keys.map(key => (
                          <div key={key} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="font-bold text-slate-900 break-words">{customFields[key] || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })()}

              {/* Extras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Customer Preference</h4>
                  {(selectedLead.preferred_date || selectedLead.preferred_time) ? (
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      {selectedLead.preferred_date || 'Any Date'} at {selectedLead.preferred_time || 'Any Time'}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">ASAP / Flexible</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Acquisition Source</h4>
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg ${selectedLead.source === 'Hero Form' ? 'bg-purple-100 text-purple-600' :
                    selectedLead.source === 'Booking Form' ? 'bg-teal-100 text-teal-600' :
                      selectedLead.source === 'Popup Offer' ? 'bg-orange-100 text-orange-600' :
                        'bg-slate-100 text-slate-500'
                    }`}>
                    {selectedLead.source || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-500">Update Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => {
                    handleStatusUpdate(selectedLead.id, e.target.value);
                    setSelectedLead({ ...selectedLead, status: e.target.value });
                  }}
                  className={`text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider outline-none cursor-pointer border-2 transition-all ${selectedLead.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    selectedLead.status === 'contacted' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                      'bg-green-50 text-green-600 border-green-200'
                    }`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
