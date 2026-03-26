import { useState } from 'react';
import { 
  Droplet, 
  Users, 
  Activity, 
  History, 
  Heart, 
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import MetricCard from '../components/MetricCard.jsx';

export default function DonorPage({ tenant }) {
  const [searchTerm, setSearchTerm] = useState('');

  const bloodInventory = [
    { group: 'A+', units: 42, pulse: 'Stable', level: 85 },
    { group: 'A-', units: 12, pulse: 'Low', level: 40 },
    { group: 'B+', units: 38, pulse: 'Stable', level: 75 },
    { group: 'O+', units: 65, pulse: 'Optimum', level: 95 },
    { group: 'O-', units: 8, pulse: 'CRITICAL', level: 15 },
    { group: 'AB+', units: 15, pulse: 'Stable', level: 60 },
  ];

  const recentDonors = [
    { id: 'D-9021', name: 'James Wilson', group: 'O+', date: '2026-03-25', vitals: 'Excellent', status: 'Cleared' },
    { id: 'D-9022', name: 'Sarah Connor', group: 'A-', date: '2026-03-24', vitals: 'Stable', status: 'In Review' },
    { id: 'D-9023', name: 'Michael Chen', group: 'AB+', date: '2026-03-23', vitals: 'Good', status: 'Cleared' },
  ];

  return (
    <div className="intelligence-hub slide-up space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="page-title-rich">Blood Bank Hub</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Droplet size={14} className="text-red-500 animate-pulse" />
            Strategic donor registry & vital inventory management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search donor registry (ID, Name, Group)..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5 font-bold text-xs uppercase tracking-wider">
            <Plus size={18} />
            Register Donor
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Active Donors" value="1,248" change="+42" icon={Users} accent="blue" />
        <MetricCard label="Blood Units" value="284" change="-12" icon={Droplet} accent="red" />
        <MetricCard label="Emergency Requests" value="14" change="100%" icon={AlertCircle} accent="amber" />
        <MetricCard label="Success Rate" value="98.2%" change="+0.5" icon={Activity} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Live Inventory Pulse</h3>
                  <p className="text-meta-sm">Real-time supply chain monitoring</p>
                </div>
              </div>
              <button className="text-red-600 font-bold text-[10px] uppercase tracking-widest hover:underline px-4 py-2 bg-red-50 rounded-xl transition-all">
                Full Inventory Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bloodInventory.map((item) => (
                <div key={item.group} className="group p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] transition-all hover:bg-white hover:shadow-xl hover:border-red-100 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                        item.pulse === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-slate-800'
                      }`}>
                        {item.group}
                      </div>
                      <div>
                        <span className="text-caps-label text-slate-400">Total Units Available</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900">{item.units}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            item.pulse === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.pulse}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-meta-sm font-bold text-slate-400 mb-1">{item.level}% Utility</span>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            item.level < 30 ? 'bg-red-500' : item.level < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${item.level}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  {item.pulse === 'CRITICAL' && (
                    <div className="absolute top-0 right-0 p-2">
                      <AlertCircle size={14} className="text-red-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Recent Registrations</h3>
              <div className="flex gap-2">
                {['All', 'Cleared', 'Review'].map(f => (
                  <button key={f} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all ${
                    f === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left py-4 text-caps-label text-slate-400">Donor Identity</th>
                    <th className="text-center py-4 text-caps-label text-slate-400">Group</th>
                    <th className="text-center py-4 text-caps-label text-slate-400">Evaluation</th>
                    <th className="text-center py-4 text-caps-label text-slate-400">Hub Status</th>
                    <th className="text-right py-4 text-caps-label text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonors.map((donor) => (
                    <tr key={donor.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                            {donor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{donor.name}</div>
                            <div className="text-meta-sm text-slate-400">{donor.id} • {donor.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-black text-slate-900 text-lg">{donor.group}</span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-meta-info text-emerald-600 font-bold">{donor.vitals}</span>
                          <span className="text-[10px] text-slate-400">Screening OK</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          donor.status === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            donor.status === 'Cleared' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          {donor.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-red-500 transition-all">
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vital Info Panel */}
        <div className="space-y-6">
          <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 overflow-hidden relative group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 mb-6 group-hover:scale-110 transition-transform">
                <Heart size={24} />
              </div>
              <h3 className="text-xl font-black text-red-900 leading-tight">Emergency Protocol Gamma</h3>
              <p className="text-red-700/70 text-sm mt-3 leading-relaxed">
                Critical shortage detected for O- Negative blood in East Wing. Activating "Direct Donation Drive" (D3) workflow.
              </p>
              <button className="mt-8 w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
                Initiate Urgent Call
              </button>
            </div>
            <Droplet className="absolute -bottom-10 -right-10 text-red-100 w-48 h-48 -rotate-12 group-hover:rotate-0 transition-transform duration-700 opacity-50" />
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Intelligence Trends
            </h3>
            <div className="space-y-6">
              {[
                { label: 'O- Stock', val: 'Low', color: 'red' },
                { label: 'Weekly Donors', val: '↑ 14%', color: 'emerald' },
                { label: 'Discarded Units', val: '2 Units', color: 'slate' }
              ].map(t => (
                <div key={t.label} className="flex items-center justify-between group">
                  <span className="text-meta-info text-slate-500">{t.label}</span>
                  <span className={`text-meta-info font-black text-${t.color}-600 group-hover:translate-x-[-4px] transition-transform`}>{t.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
