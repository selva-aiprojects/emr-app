import { useState, useMemo } from 'react';
import { ShieldCheck, Mail, Shield, UserX, UserCheck, Search, Filter, MoreVertical, Terminal, Key } from 'lucide-react';
import { userName } from '../utils/format.js';

export default function UsersPage({ users = [], activeUser, tenant, onUpdateUserRole, onResetPassword }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

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

  return (
    <div className="page-shell-premium animate-fade-in">
      <div className="page-header-premium">
        <div>
          <h1>Identity Registry</h1>
          <p>Access Control & Personnel Authorization</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
             <div className="px-4 py-2 text-xs font-black uppercase text-[var(--primary)]">{filteredUsers.length} Identities Authorized</div>
          </div>
        </div>
      </div>

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
           {/* Add user button could go here, currently handled in AdminPage but could move here */}
        </div>
      </div>

      <main className="glass-panel p-0 overflow-hidden">
        <div className="premium-table-container">
          <table className="premium-table">
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
                <tr><td colSpan="5" className="text-center py-24 text-slate-400 italic">No personnel identified in the registry matching the current filters.</td></tr>
              ) : filteredUsers.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors slide-up" style={{ animationDelay: `${idx * 20}ms` }}>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs shadow-lg border border-white/10">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 tracking-tight">{user.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                           <Terminal className="w-2.5 h-2.5" /> ID-{user.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 group">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{user.email || 'NO_DOMAIN'}</span>
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
