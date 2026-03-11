import React, { useState, useEffect } from 'react';
import { getLeads, updateLead, deleteLead, Lead } from '../../services/api';
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
  Eye,
  User
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

  const handleUpdateLeadField = async (field: keyof Lead, value: any) => {
    if (!selectedLead) return;
    
    // Optimistic UI update
    setSelectedLead({ ...selectedLead, [field]: value });
    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, [field]: value } : l));

    try {
      // Determine if this is an activity-worthy event
      let new_activity = undefined;
      if (['status', 'assigned_to', 'quality_score', 'notes'].includes(field)) {
        const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        new_activity = {
          event: `${fieldName} Updated`,
          details: `Changed to: ${value || 'None'}`
        };
      }

      await updateLead(selectedLead.id, { [field]: value, new_activity });
    } catch (err) {
      console.error(`Failed to update ${field}`);
      fetchLeads(); // Revert on failure
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateLead(id, { status, new_activity: { event: 'Status Updated', details: `Changed to: ${status}` } });
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

    const headers = [
      'ID', 'Name', 'Phone', 'Email', 'Location', 'Service', 'Source', 
      'Message', 'Status', 'Quality Score', 'Assigned To', 'Notes', 'Created At', 
      'Pref Date', 'Pref Time', 'Campaign', 'Medium', 'Term', 'GCLID', 
      'FBCLID', 'Landing Page', 'Referrer', 'IP Address', 'Browser', 
      'OS', 'Device Type'
    ];
    
    const rows = leads.map(l => {
      let custom = {};
      try { custom = JSON.parse(l.custom_data || '{}'); } catch(e) {}
      
      return [
        csvEscape(String(l.id)),
        csvEscape(l.name),
        csvEscape(l.phone),
        csvEscape(l.email),
        csvEscape(l.location),
        csvEscape(l.service_type),
        csvEscape(l.source || 'Unknown'),
        csvEscape(l.message),
        csvEscape(l.status),
        csvEscape(l.quality_score || ''),
        csvEscape(l.assigned_to || ''),
        csvEscape(l.notes || ''),
        csvEscape(new Date(l.created_at).toLocaleString()),
        csvEscape(l.preferred_date || ''),
        csvEscape(l.preferred_time || ''),
        csvEscape((custom as any).utm_campaign || ''),
        csvEscape((custom as any).utm_medium || ''),
        csvEscape((custom as any).utm_term || ''),
        csvEscape((custom as any).gclid || ''),
        csvEscape((custom as any).fbclid || ''),
        csvEscape((custom as any).landing_page || ''),
        csvEscape((custom as any).referrer || ''),
        csvEscape((custom as any).ip_address || ''),
        csvEscape((custom as any).browser || ''),
        csvEscape((custom as any).os || ''),
        csvEscape((custom as any).device_type || '')
      ];
    });

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
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#25D366] hover:bg-green-50 rounded-xl transition-all"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Enhanced Lead Details Modal (CRM View) */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-[#f8fafc] rounded-2xl w-full max-w-6xl h-[90vh] md:h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Header / Top Bar */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">{selectedLead.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedLead.email || 'No email provided'}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedLead.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-bold shadow hover:bg-[#20bd5a] transition flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp
                </a>
                <div className="w-px h-8 bg-slate-200 mx-2"></div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top Control Strip */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Status</label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleUpdateLeadField('status', e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="won">Closed Won</option>
                  <option value="lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Quality Score</label>
                <select
                  value={selectedLead.quality_score || ''}
                  onChange={(e) => handleUpdateLeadField('quality_score', e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer flex items-center"
                >
                  <option value="">Unrated</option>
                  <option value="1/10">1/10 - Very Poor</option>
                  <option value="3/10">3/10 - Poor</option>
                  <option value="5/10">5/10 - Average</option>
                  <option value="7/10">7/10 - Good</option>
                  <option value="9/10">9/10 - Excellent</option>
                  <option value="10/10">10/10 - Hot Lead</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Assign To</label>
                <select
                  value={selectedLead.assigned_to || 'Unassigned'}
                  onChange={(e) => handleUpdateLeadField('assigned_to', e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="Unassigned">Unassigned</option>
                  <option value="Sales Team A">Sales Team A</option>
                  <option value="Support Team">Support Team</option>
                  <option value="Vikash">Vikash</option>
                  <option value="Rahul">Rahul</option>
                </select>
              </div>
            </div>

            {/* Main Content Area (Split Config) */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#f1f5f9]">
              
              {/* Left Column: Data & Notes (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 lg:border-r border-slate-200">
                
                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-3">
                    <User className="w-4 h-4 text-blue-600" /> Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(() => {
                      let coords: { lat?: string, lng?: string } = {};
                      try {
                        if (selectedLead.custom_data) {
                          const parsed = JSON.parse(selectedLead.custom_data);
                          if (parsed.lat && parsed.lng) coords = { lat: parsed.lat, lng: parsed.lng };
                        }
                      } catch(e) {}
                      
                      return (
                        <>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                            <a href={`tel:${selectedLead.phone}`} className="text-sm font-bold text-blue-600 hover:underline">{selectedLead.phone}</a>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                            {selectedLead.email ? (
                              <a href={`mailto:${selectedLead.email}`} className="text-sm font-bold text-blue-600 hover:underline">{selectedLead.email}</a>
                            ) : <span className="text-sm text-slate-500">Not provided</span>}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Address / Location</p>
                            <div className="flex items-start gap-2">
                              <span className="text-sm text-slate-700 leading-snug">{selectedLead.location || 'Not provided'}</span>
                              {(selectedLead.location || (coords.lat && coords.lng)) && (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords.lat && coords.lng ? `${coords.lat},${coords.lng}` : selectedLead.location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 shrink-0 mt-0.5"
                                >
                                  <MapPin className="w-3 h-3" /> Directions
                                </a>
                              )}
                            </div>
                          </div>
                          {coords.lat && coords.lng && (
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Coordinates</p>
                              <span className="text-[10px] font-mono font-bold text-slate-500">{coords.lat}, {coords.lng}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Service Type</p>
                      <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded inline-block">{selectedLead.service_type}</span>
                    </div>
                    <div className="md:col-span-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Customer Message</p>
                       <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                         {selectedLead.message ? `"${selectedLead.message}"` : "No message provided."}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Attribution & Tracking Data */}
                {(() => {
                  let trackingFieldActive = false;
                  let parsedData: any = {};
                  try {
                    if (selectedLead.custom_data) {
                      parsedData = JSON.parse(selectedLead.custom_data);
                      const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'fbclid', 'referrer', 'landing_page', 'ip_address', 'browser', 'os'];
                      trackingFieldActive = trackingKeys.some(key => !!parsedData[key]);
                    }
                  } catch (e) {}

                  return trackingFieldActive ? (
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-3">
                          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          Attribution Data
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Source</p>
                            <span className="text-sm font-bold text-slate-800">{parsedData.utm_source || selectedLead.source || '-'}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Medium</p>
                            <span className="text-sm font-bold text-slate-800">{parsedData.utm_medium || '-'}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Campaign</p>
                            <span className="text-sm font-bold text-slate-800">{parsedData.utm_campaign || '-'}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Term / Keyword</p>
                            <span className="text-sm font-bold text-slate-800">{parsedData.utm_term || '-'}</span>
                          </div>
                          
                          <div className="col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">GCLID (Google Ads)</p>
                            <span className="text-xs font-mono text-slate-600 break-all">{parsedData.gclid || '-'}</span>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">FBCLID (Facebook)</p>
                            <span className="text-xs font-mono text-slate-600 break-all">{parsedData.fbclid || '-'}</span>
                          </div>

                          <div className="col-span-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Landing Page</p>
                            <a href={parsedData.landing_page} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline break-all">{parsedData.landing_page || '-'}</a>
                          </div>
                          <div className="col-span-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Referrer</p>
                            <span className="text-xs font-medium text-slate-600 break-all">{parsedData.referrer || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-3">
                          <MapPin className="w-4 h-4 text-teal-600" /> Visitor Information
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="col-span-2 md:col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">IP Address</p>
                            <span className="text-xs font-bold font-mono text-slate-700 break-all">{parsedData.ip_address || '-'}</span>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Device Form Factor</p>
                             <span className="text-xs font-bold text-slate-700 capitalize">{parsedData.device_type || 'Unknown'}</span>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Browser</p>
                             <span className="text-xs font-bold text-slate-700">{parsedData.browser || 'Unknown'}</span>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">OS</p>
                             <span className="text-xs font-bold text-slate-700">{parsedData.os || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Notes Input Area */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-3">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes
                  </h4>
                  <div className="bg-yellow-50/50 -mx-6 -mb-6 p-6 border-t border-yellow-100">
                     <textarea 
                       placeholder="Add notes about this lead..."
                       className="w-full h-32 bg-white border border-yellow-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none mb-3"
                       onBlur={(e) => {
                         if(e.target.value.trim() && e.target.value !== selectedLead.notes) {
                           handleUpdateLeadField('notes', e.target.value);
                         }
                       }}
                       defaultValue={selectedLead.notes || ''}
                     ></textarea>
                     <p className="text-[10px] text-slate-400 font-medium">Notes automatically save when you click away.</p>
                  </div>
                </div>

              </div>
              
              {/* Right Column: Activity Timeline & Timestamps */}
              <div className="w-full lg:w-80 bg-white flex flex-col shrink-0 border-l border-slate-200">
                
                {/* Timeline Box */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-6">
                    <Clock className="w-4 h-4 text-slate-500" /> Activity
                  </h4>
                  
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                    {(() => {
                      let activities: any[] = [];
                      try {
                        if (selectedLead.activities) {
                          activities = JSON.parse(selectedLead.activities);
                          // Sort newest first
                          activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        }
                      } catch(e) {}

                      if (activities.length === 0) {
                        return <p className="text-xs text-slate-400 pl-6">No activity recorded.</p>;
                      }

                      return activities.map((act, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className="absolute w-3.5 h-3.5 bg-white border-2 border-blue-500 rounded-full -left-[9px] top-1"></div>
                          <p className="text-xs font-bold text-slate-800 mb-0.5">{act.event}</p>
                          {act.details && <p className="text-[11px] text-slate-500 leading-snug break-words mb-1">{act.details}</p>}
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System • {new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Timestamps Box */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4 pb-3 border-b border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-500" /> Timestamps
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Lead Date</p>
                      <p className="text-xs font-bold text-slate-700">
                        {new Date(selectedLead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(selectedLead.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
