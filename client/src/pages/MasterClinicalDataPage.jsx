import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Activity, 
  Filter, 
  ChevronRight, 
  X,
  Stethoscope,
  BookOpen,
  Syringe,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import '../styles/critical-care.css';

const CONFIGS = {
  specialities: {
    title: 'Clinical Specialities',
    subtitle: 'Medical specializations and departmental classifications.',
    icon: Stethoscope,
    endpoint: '/api/clinical-masters/specialities',
    fields: [
      { name: 'name', label: 'Speciality Name', type: 'text', placeholder: 'e.g. Cardiology', required: true },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Functional scope...' }
    ],
    displayFields: ['name', 'description']
  },
  diseases: {
    title: 'Disease Registry',
    subtitle: 'Standardized disease database with clinical codes.',
    icon: BookOpen,
    endpoint: '/api/clinical-masters/diseases',
    fields: [
      { name: 'code', label: 'ICD Code', type: 'text', placeholder: 'e.g. ICD-10-I10', required: true },
      { name: 'name', label: 'Disease Name', type: 'text', placeholder: 'e.g. Hypertension', required: true },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Circulatory' },
      { name: 'description', label: 'Description', type: 'textarea' }
    ],
    displayFields: ['code', 'name', 'category']
  },
  treatments: {
    title: 'Treatment Registry',
    subtitle: 'Standardized clinical protocols and procedures.',
    icon: Syringe,
    endpoint: '/api/clinical-masters/treatments',
    fields: [
      { name: 'code', label: 'Procedure Code', type: 'text', placeholder: 'e.g. PROC-001', required: true },
      { name: 'name', label: 'Treatment Name', type: 'text', placeholder: 'e.g. CBC Test', required: true },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Laboratory' },
      { name: 'base_cost', label: 'Base Cost (₹)', type: 'number', placeholder: '500' }
    ],
    displayFields: ['code', 'name', 'category', 'base_cost']
  }
};

export default function MasterClinicalDataPage({ type = 'specialities', onBack, tenant }) {
  const config = CONFIGS[type] || CONFIGS.specialities;
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(config.endpoint);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
      showToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    
    try {
      if (editingItem) {
        await api.put(`${config.endpoint}/${editingItem.id}`, payload);
        showToast({ message: 'Entry updated successfully', type: 'success' });
      } else {
        await api.post(config.endpoint, payload);
        showToast({ message: 'Entry created successfully', type: 'success' });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      showToast({ message: 'Save failed: ' + err.message, type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this master record?')) return;
    try {
      await api.del(`${config.endpoint}/${id}`);
      showToast({ message: 'Entry deleted', type: 'success' });
      fetchData();
    } catch (err) {
      showToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const Icon = config.icon;

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="flex items-center gap-3">
              {config.title}
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Master Registry</span>
            </h1>
            <p className="dim-label">{config.subtitle} Configured for {tenant?.name}.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            className="clinical-btn bg-slate-900 text-white px-8 !rounded-2xl shadow-xl shadow-slate-900/10"
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Entry
          </button>
        </div>
      </header>

      <div className="action-bar-premium mb-8">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}...`}
            className="input-field pl-12 bg-white/50"
          />
        </div>
        <div className="flex items-center gap-2 px-6 border-l border-slate-200 ml-4">
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Entries:</div>
           <div className="text-xs font-black text-slate-900">{data.length} Registry Items</div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
           <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Master Registry...</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-slate-100 rounded-[2rem] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {config.displayFields.map(f => (
                  <th key={f} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">{f.replace('_', ' ')}</th>
                ))}
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  {config.displayFields.map(f => (
                    <td key={f} className="px-8 py-6">
                      {f === 'base_cost' ? (
                        <span className="font-black text-slate-900 tabular-nums">₹{item[f]}</span>
                      ) : f === 'code' ? (
                        <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100/50">{item[f]}</span>
                      ) : (
                        <span className="text-sm font-bold text-slate-700">{item[f]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon className="text-slate-200 w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No records found</h3>
              <p className="text-sm text-slate-400 mt-2">The clinical registry is currently empty for this category.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay-premium active animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-container-premium max-w-lg slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {editingItem ? 'Edit Entry' : 'New Master Entry'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Standard Config</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="text-slate-400" size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              {config.fields.map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea 
                      name={field.name}
                      defaultValue={editingItem ? editingItem[field.name] : ''}
                      placeholder={field.placeholder}
                      className="input-field py-4 min-h-[100px] resize-none"
                      required={field.required}
                    />
                  ) : (
                    <input 
                      name={field.name}
                      type={field.type}
                      defaultValue={editingItem ? editingItem[field.name] : ''}
                      placeholder={field.placeholder}
                      className="input-field"
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-14 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  <Save size={16} />
                  {editingItem ? 'Commit Changes' : 'Create Registry Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
