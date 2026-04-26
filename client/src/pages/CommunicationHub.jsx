import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  Building2,
  Calendar,
  Eye
} from 'lucide-react';
import { superadminService } from '../services/superadmin.service.js';

const CommunicationHub = () => {
  const [communications, setCommunications] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComm, setSelectedComm] = useState(null);
  const [filters, setFilters] = useState({
    tenantId: '',
    status: '',
    type: 'email'
  });

  useEffect(() => {
    fetchData();
    fetchTenants();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await superadminService.getCommunications(filters);
      setCommunications(data);
    } catch (err) {
      console.error('Failed to load communications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const data = await superadminService.getTenants();
      setTenants(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> Sent</span>;
      case 'failed':
        return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 rounded-full border border-rose-100"><ShieldAlert className="w-3 h-3" /> Failed</span>;
      case 'mocked':
        return <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 rounded-full border border-amber-100"><Clock className="w-3 h-3" /> Mocked</span>;
      default:
        return <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 rounded-full border border-slate-100">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Communication <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Centralized monitoring of all cross-shard communications.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl p-2 rounded-2xl border border-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200">
            <Building2 className="w-5 h-5 text-slate-400" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer"
              value={filters.tenantId}
              onChange={(e) => setFilters({...filters, tenantId: e.target.value})}
            >
              <option value="">All Shards</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="mocked">Mocked</option>
            </select>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid of communications */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : communications.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No Communications Found</h3>
            <p className="text-slate-500 max-w-md mx-auto">We couldn't find any message history matching your current filters. Try selecting a different shard or status.</p>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-bottom border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shard / Recipient</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  <th className="px-6 py-5 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {communications.map((comm) => (
                  <tr key={comm.id} className="group hover:bg-indigo-50/30 transition-all border-b border-slate-50 last:border-0">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {comm.tenantName || 'Global Platform'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 truncate max-w-[200px]">
                          {comm.recipient}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-700 truncate max-w-[300px]">
                        {comm.subject}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(comm.status)}
                    </td>
                    <td className="px-6 py-5 text-right text-xs font-bold text-slate-400">
                      {new Date(comm.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => setSelectedComm(comm)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing content */}
      {selectedComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Communication Detail</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedComm.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedComm(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
              >
                ×
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Recipient</label>
                    <p className="text-sm font-bold text-slate-900">{selectedComm.recipient}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subject</label>
                    <p className="text-sm font-bold text-slate-900">{selectedComm.subject}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Timestamp</label>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {new Date(selectedComm.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Delivery Status</label>
                    {getStatusBadge(selectedComm.status)}
                  </div>
                </div>
              </div>

              {selectedComm.errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-sm font-bold text-rose-700">
                    <p className="mb-1 uppercase tracking-widest text-[10px]">Error Details</p>
                    {selectedComm.errorMessage}
                  </div>
                </div>
              )}

              <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50">
                <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                  </div>
                </div>
                <div className="p-6 overflow-x-auto">
                   {/* Iframe to sandbox the email HTML content */}
                   <iframe 
                     srcDoc={selectedComm.content}
                     className="w-full min-h-[400px] border-none bg-white rounded-xl shadow-inner"
                     title="Email Content"
                   />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button 
                onClick={() => setSelectedComm(null)}
                className="px-6 py-3 text-sm font-black text-slate-600 hover:text-slate-900 transition-colors"
              >
                Close Preview
              </button>
              {selectedComm.status === 'failed' && (
                <button className="px-6 py-3 bg-indigo-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                  Retry Dispatch
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationHub;
