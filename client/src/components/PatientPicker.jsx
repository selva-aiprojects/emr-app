import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../api.js';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock,
  List,
  Filter,
  Loader2,
  User,
  Activity,
  Calendar,
  Zap,
  ShieldCheck,
  MapPin,
  Phone,
  Hash,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import '../styles/critical-care.css';

/**
 * High-Visibility Patient Selection Terminal
 * Redesigned for maximum readability and immediate search feedback.
 */
export default function PatientPicker({ 
  tenantId, 
  patients: initialPatients = [], 
  encounters = [],
  onSelect, 
  onRegister,
  initialPatientId,
  title = 'Select Patient',
  isOpen: controlledIsOpen,
  onClose: controlledOnClose
}) {
  // State management
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState(initialPatients);
  const [loading, setLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const toggleOpen = useCallback((val) => {
    if (controlledOnClose && val === false) {
      controlledOnClose();
    } else {
      setInternalIsOpen(val);
    }
  }, [controlledOnClose]);

  // Categorize patients based on encounters
  const categorizedPatients = useMemo(() => {
    const activePatientIds = new Set();
    const recentPatientIds = new Set();
    
    if (encounters && Array.isArray(encounters)) {
      encounters.forEach(encounter => {
        if (encounter.patientId) {
          if (encounter.status === 'open' || encounter.status === 'active' || encounter.status === 'triaged') {
            activePatientIds.add(encounter.patientId);
          }
          const encounterDate = new Date(encounter.createdAt || encounter.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (encounterDate > thirtyDaysAgo) {
            recentPatientIds.add(encounter.patientId);
          }
        }
      });
    }

    return {
      active: patients.filter(p => activePatientIds.has(p.id)),
      recent: patients.filter(p => recentPatientIds.has(p.id)),
      all: patients,
      inactive: patients.filter(p => !activePatientIds.has(p.id))
    };
  }, [patients, encounters]);

  const [currentPage, setCurrentPage] = useState(0);
  const [newPatient, setNewPatient] = useState({ 
    firstName: '', 
    lastName: '', 
    phone: '', 
    dob: '', 
    gender: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const PATIENTS_PER_PAGE = 12;

  useEffect(() => {
    if (initialPatients && Array.isArray(initialPatients)) {
      setPatients(initialPatients);
    }
  }, [initialPatients]);

  useEffect(() => {
    if (initialPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === initialPatientId);
      if (patient && onSelect) {
        onSelect(patient);
      }
    }
  }, [initialPatientId, patients, onSelect]);

  useEffect(() => {
    const handleOpenEvent = () => {
      toggleOpen(true);
      setActiveTab('active');
      setCurrentPage(0);
    };
    window.addEventListener('openPatientPicker', handleOpenEvent);
    return () => window.removeEventListener('openPatientPicker', handleOpenEvent);
  }, [toggleOpen]);

  const getCurrentPatients = useCallback(() => {
    if (searchQuery.trim() && activeTab !== 'new') {
        return patients;
    }
    switch (activeTab) {
      case 'active': return categorizedPatients.active;
      case 'recent': return categorizedPatients.recent;
      case 'all': return categorizedPatients.all;
      default: return categorizedPatients.active;
    }
  }, [activeTab, categorizedPatients, patients, searchQuery]);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setPatients(initialPatients);
      setCurrentPage(0);
      return;
    }
    setLoading(true);
    try {
      const results = await api.searchPatients(tenantId, { text: query });
      setPatients(Array.isArray(results) ? results : []);
      setCurrentPage(0);
    } catch (error) {
      console.error('Search failed:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, initialPatients]);

  useEffect(() => {
    // Only search if query is empty (to reset) or at least 3 characters
    if (searchQuery.trim().length > 0 && searchQuery.trim().length < 3) return;

    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500); // Higher debounce for better performance in clinical environment
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const selectPatient = useCallback((patient) => {
    if (!patient) return;
    setSelectedPatientId(patient.id);
    toggleOpen(false);
    if (onSelect) onSelect(patient);
  }, [onSelect, toggleOpen]);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!tenantId || !newPatient.firstName || !newPatient.lastName) return;
    setIsRegistering(true);
    try {
      const patientData = await api.createPatient({
        tenantId,
        firstName: newPatient.firstName.trim(),
        lastName: newPatient.lastName.trim(),
        phone: newPatient.phone.trim(),
        dob: newPatient.dob,
        gender: newPatient.gender
      });
      if (patientData) {
        selectPatient(patientData);
        setNewPatient({ firstName: '', lastName: '', phone: '', dob: '', gender: '' });
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const currentPatients = getCurrentPatients();
  const totalPages = Math.ceil(currentPatients.length / PATIENTS_PER_PAGE);
  const startIndex = currentPage * PATIENTS_PER_PAGE;
  const currentPagePatients = currentPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE);

  const goToPage = (page) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10 bg-slate-900/40 backdrop-blur-[10px] animate-fade-in">
      <div 
        ref={modalRef}
        className="bg-slate-50 w-full max-w-6xl h-[80vh] flex flex-col shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-white relative rounded-[28px]"
      >
        {/* Header - High Visibility */}
        <div className="bg-slate-900 px-10 py-8 text-white relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full -mr-20 -mt-20"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{title}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/80 mt-2">Unified Patient Registry Access</p>
              </div>
            </div>
            <button
              onClick={() => toggleOpen(false)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 group active:scale-95"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="relative z-10 group">
            <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center">
              <div className={`absolute left-6 transition-colors ${loading ? 'text-blue-400' : 'text-slate-400'}`}>
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type Name, MRN, or Phone Number to Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-6 bg-white border-2 border-slate-700/30 rounded-[22px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold uppercase tracking-wider text-base shadow-2xl"
              />
              {searchQuery && (
                <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
              )}
            </div>
            {loading && (
                <div className="absolute -bottom-6 left-6 text-[9px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
                    Scanning Clinical Database...
                </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs - High Contrast */}
        <div className="bg-white px-8 py-1 flex items-center gap-1 border-b border-slate-200">
          {[
            { id: 'active', label: 'Active Consultation', icon: Activity, count: categorizedPatients.active.length, color: 'text-emerald-600' },
            { id: 'recent', label: 'Recent Visits', icon: Clock, count: categorizedPatients.recent.length, color: 'text-blue-600' },
            { id: 'all', label: 'Full Registry', icon: List, count: categorizedPatients.all.length, color: 'text-slate-600' },
            { id: 'new', label: 'Register New', icon: UserPlus, color: 'text-indigo-600' }
          ].map(({ id, label, icon: Icon, count, color }) => (
            <button
              key={id}
              onClick={() => {
                  setActiveTab(id);
                  if (id !== 'new') setSearchQuery(''); 
              }}
              className={`
                flex items-center gap-3 px-6 py-5 transition-all relative group
                ${activeTab === id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              <Icon size={18} className={activeTab === id ? color : 'text-current'} />
              <span className="text-[11px] font-black uppercase tracking-[0.1em]">{label}</span>
              {count !== undefined && !searchQuery && (
                <span className={`
                  px-2 py-0.5 text-[9px] font-black rounded-md ml-1
                  ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}
                `}>
                  {count}
                </span>
              )}
              {activeTab === id && (
                <span className="absolute bottom-0 left-4 right-4 h-1 bg-slate-900 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area - Light Theme */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
          {activeTab === 'new' ? (
            <div className="max-w-4xl mx-auto animate-slide-up">
               <div className="bg-white border border-slate-200 rounded-[32px] p-12 shadow-sm">
                 <div className="flex items-center gap-5 mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                       <UserPlus size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Onboard New Patient</h3>
                       <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">Initialize Secure Clinical Record</p>
                    </div>
                 </div>

                 <form onSubmit={handleRegisterPatient} className="space-y-10">
                   <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">First Name</label>
                       <input
                         type="text"
                         value={newPatient.firstName}
                         onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                         className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-lg"
                         placeholder="Enter first name"
                         required
                       />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Last Name</label>
                       <input
                         type="text"
                         value={newPatient.lastName}
                         onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                         className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-lg"
                         placeholder="Enter last name"
                         required
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                       <div className="relative">
                         <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input
                           type="tel"
                           value={newPatient.phone}
                           onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                           className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-lg"
                           placeholder="000 000 0000"
                         />
                       </div>
                     </div>
                     <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Date of Birth</label>
                       <div className="relative">
                         <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input
                           type="date"
                           value={newPatient.dob}
                           onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                           className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-lg"
                         />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Gender Identification</label>
                     <div className="grid grid-cols-3 gap-6">
                       {['Male', 'Female', 'Other'].map(g => (
                         <button
                           key={g}
                           type="button"
                           onClick={() => setNewPatient({ ...newPatient, gender: g })}
                           className={`
                             py-5 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all
                             ${newPatient.gender === g 
                               ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' 
                               : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                           `}
                         >
                           {g}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="flex gap-6 pt-10">
                     <button
                       type="submit"
                       disabled={isRegistering}
                       className="flex-1 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
                     >
                       {isRegistering ? <Loader2 className="animate-spin" /> : <ShieldCheck size={22} />}
                       Authorize & Register Subject
                     </button>
                     <button
                       type="button"
                       onClick={() => setNewPatient({ firstName: '', lastName: '', phone: '', dob: '', gender: '' })}
                       className="px-12 h-20 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border border-slate-200"
                     >
                       Clear
                     </button>
                   </div>
                 </form>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPatients.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-24 h-24 rounded-[32px] bg-slate-100 border border-slate-200 flex items-center justify-center mb-8">
                     <Search size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Matching Records</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-4 max-w-sm leading-relaxed">
                    We couldn't find a record matching "{searchQuery || activeTab}". Check for spelling errors or try the global registry.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                    className="mt-10 px-8 py-3 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    View Global Registry
                  </button>
                </div>
              ) : (
                currentPatients.map((patient, idx) => (
                  <PatientHighVisCard
                    key={patient.id}
                    patient={patient}
                    idx={idx}
                    isSelected={selectedPatientId === patient.id}
                    onSelect={() => selectPatient(patient)}
                    isActive={categorizedPatients.active.find(ap => ap.id === patient.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white px-10 py-5 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Database Sync Active</span>
                </div>
                <div className="h-4 w-[1px] bg-slate-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Version: CLN-H-4.2</span>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                NHGL HEALTHCARE SYSTEM • IDENTITY MANAGEMENT TERMINAL
            </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PatientHighVisCard({ patient, idx, isSelected, onSelect, isActive }) {
  const hasName = patient.firstName || patient.lastName;
  const fullName = hasName ? `${patient.firstName} ${patient.lastName}` : (patient.mrn || 'UNKNOWN SUBJECT');
  const initials = hasName ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase() : 'PT';
  
  return (
    <button
      onClick={onSelect}
      style={{ animationDelay: `${idx * 40}ms` }}
      className={`
        relative group flex flex-col p-8 rounded-[32px] border-2 transition-all animate-slide-up text-left overflow-hidden
        ${isSelected 
          ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' 
          : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl'}
      `}
    >
      {isActive && !isSelected && (
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Consulting</span>
          </div>
      )}

      <div className="flex items-center gap-5 mb-8">
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner transition-all
          ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-blue-600 border border-slate-100 group-hover:scale-110'}
        `}>
          {initials}
        </div>
        <div>
            <h4 className={`text-lg font-black uppercase tracking-tight leading-none mb-2 truncate max-w-[180px] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {fullName}
            </h4>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                {patient.mrn || 'NO-MRN-RECORDED'}
            </div>
        </div>
      </div>

      <div className={`mt-auto pt-6 border-t ${isSelected ? 'border-white/10' : 'border-slate-100'} flex items-center justify-between`}>
         <div className="flex items-center gap-8">
            <div className="flex flex-col">
               <span className={`text-[9px] uppercase font-black tracking-widest mb-1 ${isSelected ? 'text-white/40' : 'text-slate-400'}`}>Age</span>
               <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{patient.age || '--'} Yrs</span>
            </div>
            <div className="flex flex-col">
               <span className={`text-[9px] uppercase font-black tracking-widest mb-1 ${isSelected ? 'text-white/40' : 'text-slate-400'}`}>Sex</span>
               <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{patient.gender || '??'}</span>
            </div>
         </div>
         <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center transition-all
            ${isSelected ? 'bg-white text-slate-900' : 'bg-slate-50 text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50'}
         `}>
            <ArrowRight size={20} />
         </div>
      </div>
    </button>
  );
}
