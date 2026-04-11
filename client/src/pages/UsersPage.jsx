import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import { ShieldCheck, Mail, Shield, UserX, UserCheck, Search, Filter, MoreVertical, Terminal, Key } from 'lucide-react';
import { userName } from '../utils/format.js';
import { EmptyState } from '../components/ui/index.jsx';

export default function UsersPage({ users = [], activeUser, tenant, onUpdateUserRole, onResetPassword, onCreateUser }) {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 10;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.role?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const roles = useMemo(() => ['All', ...new Set(users.map(u => u.role))], [users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedUsers = filteredUsers.slice(pageStart, pageEnd);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Identity & Access Governance
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Security Node</span>
           </h1>
           <p className="dim-label">Personnel authorization, role-based access control, and identity lifecycle management for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Identity Logic Active • Multi-factor authentication ready
           </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white shadow-sm px-5 py-3 rounded-2xl border border-slate-200 overflow-hidden">
              <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> {filteredUsers.length} Identities Active
              </span>
           </div>
        </div>
      </header>

      <div className="action-bar-premium">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, email or operational role..."
              className="input-field pl-11 py-3 bg-white/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field py-3 bg-white/50 w-44"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowCreateModal(true)}
             className="clinical-btn bg-slate-900 !text-white px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
           >
              <UserCheck className="w-4 h-4 mr-2" />
              Provision Identity
           </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
           <div className="glass-panel w-full max-w-xl p-10 shadow-3xl animate-scale-in">
              <header className="mb-10 flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Identity Provisioning</h3>
                    <p className="dim-label uppercase tracking-widest text-[10px] mt-1 font-black">Authorized User Authorization Shard</p>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200" onClick={() => setShowCreateModal(false)}>
                    <UserX className="w-5 h-5" />
                 </button>
              </header>

              <form className="space-y-8" onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.target);
                 try {
                   await onCreateUser({
                     name: fd.get('name'),
                     email: fd.get('email'),
                     role: fd.get('role'),
                     password: fd.get('password')
                   });
                   setShowCreateModal(false);
                   showToast({ message: 'Personnel identity shard authorized!', type: 'success' });
                 } catch (err) {
                   showToast({ message: 'Provisioning failed: ' + err.message, type: 'error' });
                 }
              }}>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Name</label>
                    <input name="name" className="input-field h-14 bg-slate-50 border-none font-bold" placeholder="E.g. Dr. Alexander Pierce" required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional E-Mail</label>
                    <input name="email" type="email" className="input-field h-14 bg-slate-50 border-none font-bold" placeholder="alex.p@facility.com" required />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Role</label>
                       <select name="role" className="input-field h-14 bg-slate-50 border-none font-black uppercase tracking-widest text-[10px]" required>
                          <option value="Admin">Admin</option>
                          <option value="Doctor">Doctor</option>
                          <option value="Nurse">Nurse</option>
                          <option value="Front Office">Front Office</option>
                          <option value="Lab">Lab</option>
                          <option value="Pharmacy">Pharmacy</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temporary Password</label>
                       <input name="password" type="password" className="input-field h-14 bg-slate-50 border-none font-bold" placeholder="••••••••" required />
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Abort Access</button>
                    <button type="submit" className="flex-[2] clinical-btn bg-slate-900 text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-widest">Commit Identity</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <main className="glass-panel p-0 overflow-hidden">
        <div className="premium-table-container overflow-x-hidden">
          <table className="premium-table table-fixed w-full">
            <thead>
              <tr>
                <th>Personnel Identity</th>
                <th>System Domain</th>
                <th>Operational Role</th>
                <th>Access Audit</th>
                <th style={{ textAlign: 'right' }}>Security Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState 
                      title="No personnel identities found" 
                      subtitle="The security registry returned no matching records for the current identity filter."
                      icon={UserX}
                    />
                  </td>
                </tr>
              ) : pagedUsers.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors slide-up" style={{ animationDelay: `${idx * 20}ms` }}>
                  <td className="max-w-[240px]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs shadow-lg border border-white/10">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 tracking-tight truncate">{user.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                           <Terminal className="w-2.5 h-2.5" /> ID-{user.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[260px]">
                    <div className="flex items-center gap-2 group">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 truncate">{user.email || 'NO_DOMAIN'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50">
                      <ShieldCheck className={`w-3.5 h-3.5 ${
                        user.role === 'Admin' ? 'text-indigo-600' :
                        user.role === 'Doctor' ? 'text-[var(--primary)]' :
                        'text-emerald-600'
                      }`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">{user.role}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Access</span>
                       </div>
                       <div className="text-[9px] font-medium text-slate-400 pl-4">{user.lastLogin || 'Recent Session'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-[var(--primary)] hover:border-[var(--primary)]/20 hover:bg-[var(--primary-soft)] transition-all shadow-sm"
                        title="Security Audit & Reset"
                        onClick={() => onResetPassword && onResetPassword(user.id)}
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                        title="Suspend Authorization"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Showing {filteredUsers.length === 0 ? 0 : pageStart + 1}–{Math.min(pageEnd, filteredUsers.length)} of {filteredUsers.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-40"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            Prev
          </button>
          <div className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
            Page {safePage} / {totalPages}
          </div>
          <button
            className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-40"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 glass-panel border-l-4 border-l-amber-500 flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
           <Shield className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Global Authorization Guidelines</h4>
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-4xl">
            Personnel access is governed by the facility shard's global security policy. Role updates take immediate effect across all terminal clusters. Suspending an authorization will terminate all active clinical sessions for the subject identity. Ensure compliance with data privacy regulations before manual identity modification.
          </p>
        </div>
      </div>
    </div>
  );
}
