import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.jsx';
import axios from 'axios';
import { 
  Shield, 
  Plus, 
  RefreshCcw, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Clock,
  Briefcase,
  Users,
  ChevronRight,
  Info
} from 'lucide-react';
import '../styles/critical-care.css';

export default function RoleManagementPage({ tenant, activeUser }) {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/roles');
      setRoles(response.data);
    } catch (err) {
      setError('Failed to load roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      if (editingRole) {
        await axios.put(`/api/roles/${editingRole.id}`, roleData);
      } else {
        await axios.post('/api/roles', roleData);
      }
      fetchRoles();
      setShowCreateModal(false);
      setEditingRole(null);
      showToast({ message: editingRole ? 'Role updated successfully!' : 'Role created successfully!', type: 'success', title: 'Roles' });
    } catch (err) {
      setError('Failed to save role');
      console.error('Error saving role:', err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this operational role? This will impact all assigned identities.')) return;

    try {
      await axios.delete(`/api/roles/${roleId}`);
      fetchRoles();
      showToast({ message: 'Role deleted.', type: 'success', title: 'Roles' });
    } catch (err) {
      setError('Failed to delete role');
      console.error('Error deleting role:', err);
    }
  };

  const getPermissionDescription = (permission) => {
    const descriptions = {
      'permission-core_engine-access': 'Fundamental clinical operations',
      'permission-hr_payroll-access': 'Personnel & payroll governance',
      'permission-accounts-access': 'Financial ledger & audit streams',
      'permission-customer_support-access': 'Patient experience & support queue'
    };
    return descriptions[permission] || 'Restricted system protocol';
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-shell-premium animate-fade-in">
      {/* HEADER SECTION */}
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Role Governance & Access Control
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Security Node</span>
           </h1>
           <p className="dim-label">Access control, operational permissions, and institutional role definitions for {tenant?.name || 'Authorized Facility'}.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Security Integrity Validated • Permissions sync operational
           </p>
        </div>
        <div className="flex gap-3">
          <button
            className="clinical-btn bg-slate-900 text-white px-8 !rounded-2xl shadow-xl shadow-slate-900/10"
            onClick={() => {
              setEditingRole(null);
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Provision New Protocol
          </button>
          <button
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
            onClick={fetchRoles}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="action-bar-premium mb-8">
         <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by role name or operational domain..."
              className="input-field pl-12 bg-white/50 border-slate-200/60"
            />
         </div>
         <div className="flex items-center gap-2 px-4 border-l border-slate-200 ml-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registry:</div>
            <div className="text-xs font-black text-slate-900 tabular-nums">{roles.length} Roles Authorized</div>
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
           <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--primary)] rounded-full animate-spin"></div>
           <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Authorization Data...</p>
        </div>
      ) : error ? (
        <div className="glass-panel border-l-4 border-l-red-500 p-8 flex items-center gap-5">
           <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
           </div>
           <div>
              <h4 className="text-sm font-bold text-slate-900">Governance Sync Error</h4>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRoles.map((role, idx) => (
            <article 
              key={role.id} 
              className="clinical-card group hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden" 
              onClick={() => setSelectedRole(role)}
            >
              {/* TOP STRIP BASED ON ROLE TYPE */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                role.name.toLowerCase().includes('admin') ? 'bg-indigo-500' :
                role.name.toLowerCase().includes('doctor') ? 'bg-[var(--primary)]' :
                role.name.toLowerCase().includes('nurse') ? 'bg-emerald-500' :
                'bg-slate-400'
              }`}></div>

              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{role.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`w-2 h-2 rounded-full ${role.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {role.is_active ? 'Global Active' : 'Suspended Path'}
                       </span>
                    </div>
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRole(role);
                        setShowCreateModal(true);
                      }}
                    >
                       <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                    >
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>

              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 h-10 overflow-hidden text-ellipsis line-clamp-2">
                {role.description || 'No operational description defined for this governance protocol.'}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {role.permissions.map(permission => (
                  <span key={permission} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-tighter text-slate-600">
                    {permission.replace('permission-', '').replace('-access', '').replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                       {[...Array(Math.min(3, role.user_count || 1))].map((_, i) => (
                         <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black">
                            {String.fromCharCode(65 + i)}
                         </div>
                       ))}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {role.user_count || 0} Identit{role.user_count === 1 ? 'y' : 'ies'} Authorized
                    </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="mt-12 p-8 glass-panel border-l-4 border-l-indigo-500 flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
           <Info className="w-7 h-7" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900">Protocol Governance Standards</h4>
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-5xl mt-1">
            Role modifications audit all active sessions globally. Adding or removing permissions from a role will take effect immediately upon the next sequential terminal handshake. Ensure institutional compliance with security protocols before elevating operational access for sensitive domains.
          </p>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay-premium active animate-fade-in">
          <div className="modal-container-premium max-w-2xl slide-up">
            <div className="modal-header">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
                     {editingRole ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">{editingRole ? 'Update Governance Protocol' : 'Register New Protocol Role'}</h2>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Role Definition & Permission Scope</p>
                  </div>
               </div>
               <button className="p-2 hover:bg-slate-100 rounded-xl transition-all" onClick={() => setShowCreateModal(false)}>
                  <XCircle className="w-5 h-5 text-slate-400" />
               </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const roleData = {
                name: formData.get('name'),
                description: formData.get('description'),
                permissions: formData.getAll('permissions'),
                is_active: formData.get('is_active') === 'on'
              };
              handleCreateRole(roleData);
            }} className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-group flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Protocol Name</label>
                    <input
                      name="name"
                      defaultValue={editingRole?.name || ''}
                      placeholder="e.g. Senior Medical Consultant"
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="form-group flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status</label>
                    <div className="bg-slate-50 p-2 rounded-xl flex items-center gap-4 border border-slate-100 h-[52px]">
                       <label className="flex items-center gap-2 cursor-pointer ml-2">
                          <input
                            type="checkbox"
                            name="is_active"
                            className="w-4 h-4 rounded-md border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                            defaultChecked={editingRole?.is_active !== false}
                          />
                          <span className="text-[11px] font-bold text-slate-600">Authorized & Active</span>
                       </label>
                    </div>
                  </div>
                </div>

                <div className="form-group flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Scope Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Describe the operational boundaries and clinical responsibilities of this role..."
                    defaultValue={editingRole?.description || ''}
                    className="input-field py-4 min-h-[100px] resize-none"
                  />
                </div>

                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-4">Operational Permissions Registry</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'permission-core_engine-access', label: 'Core Engine Access', icon: Activity },
                      { id: 'permission-hr_payroll-access', label: 'Personnel & HR', icon: Users },
                      { id: 'permission-accounts-access', label: 'Financial Governance', icon: Briefcase },
                      { id: 'permission-customer_support-access', label: 'Patient Experience', icon: Shield }
                    ].map(perm => (
                      <label key={perm.id} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer bg-white group hover:shadow-sm">
                        <div className="mt-1">
                           <input 
                             type="checkbox" 
                             name="permissions" 
                             value={perm.id} 
                             className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                             defaultChecked={editingRole?.permissions?.includes(perm.id)} 
                           />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <perm.icon className="w-3 h-3 text-slate-400" />
                              <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{perm.label}</div>
                           </div>
                           <div className="text-[10px] text-slate-400 font-medium leading-normal">{getPermissionDescription(perm.id)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <button type="button" className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-900 transition-all" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-premium px-8">
                  {editingRole ? 'Commit Protocol Changes' : 'Authorize New Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS VIEW SIDEBAR/MODAL */}
      {selectedRole && !showCreateModal && (
        <div className="modal-overlay-premium active animate-fade-in">
           <div className="modal-container-premium max-w-md slide-up">
              <div className="p-8">
                 <div className="flex text-right justify-end mb-4">
                    <button onClick={() => setSelectedRole(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                       <XCircle className="w-5 h-5 text-slate-300" />
                    </button>
                 </div>
                 
                 <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-900/30 border-4 border-white">
                       <Shield className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedRole.name}</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mt-4">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest">{selectedRole.is_active ? 'Authorized' : 'Suspended'}</span>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Scope & Responsibilities</h4>
                       <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                          "{selectedRole.description || 'No formal scope defined for this operational role.'}"
                       </p>
                    </div>

                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Authorized Permissions ({selectedRole.permissions.length})</h4>
                       <div className="space-y-3">
                          {selectedRole.permissions.map(perm => (
                            <div key={perm} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-4 h-4" />
                               </div>
                               <div>
                                  <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{perm.replace('permission-', '').replace('-access', '').replace('_', ' ')}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">{getPermissionDescription(perm)}</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                       <button 
                         className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-all border border-slate-100"
                         onClick={() => {
                           setEditingRole(selectedRole);
                           setShowCreateModal(true);
                           setSelectedRole(null);
                         }}
                       >
                          <Edit3 className="w-4 h-4" /> Edit Protocol
                       </button>
                       <button 
                         className="flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold text-xs hover:bg-red-100 transition-all border border-red-100"
                         onClick={() => {
                            handleDeleteRole(selectedRole.id);
                            setSelectedRole(null);
                         }}
                       >
                          <Trash2 className="w-4 h-4" /> Delete Role
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

