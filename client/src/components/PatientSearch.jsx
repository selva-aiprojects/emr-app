
import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export default function PatientSearch({ tenantId, onSelect, onRegister, initialPatientId }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const wrapperRef = useRef(null);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);

    // Sync initialPatientId
    useEffect(() => {
        if (initialPatientId && (!selectedPatient || selectedPatient.id !== initialPatientId)) {
            const p = patients.find(x => x.id === initialPatientId);
            if (p) {
                setSelectedPatient(p);
            } else {
                // If not in current search results, fetch it
                api.getPatient(initialPatientId, tenantId).then(res => {
                    if (res) setSelectedPatient(res);
                }).catch(err => console.error("Failed to sync patient:", err));
            }
        }
    }, [initialPatientId, patients, selectedPatient, tenantId]);

    const handleSearch = async (term = searchTerm, date = dateFilter, type = typeFilter, status = statusFilter) => {
        if (!term && !date && !type && !status) {
            setPatients([]);
            return;
        }
        setLoading(true);
        try {
            const results = await api.searchPatients(tenantId, { text: term, date, type, status });
            console.log(`[SEARCH_FORENSIC] Term: "${term}", Results: ${results?.length || 0}`);
            let finalResults = results || [];
            
            // --- EMERGENCY RECOVERY: INJECT RECENT REGISTRATION ---
            try {
                const lastPatient = JSON.parse(localStorage.getItem('LAST_CREATED_PATIENT_SYNC') || 'null');
                const now = Date.now();
                if (lastPatient && (now - lastPatient.timestamp < 300000)) { // 5 min window
                    const isNameMatch = (lastPatient.lastName || '').toLowerCase().includes(term.toLowerCase()) || 
                                     (lastPatient.firstName || '').toLowerCase().includes(term.toLowerCase());
                    const isMrnMatch = (lastPatient.mrn || '').toLowerCase().includes(term.toLowerCase());
                    
                    if ((isNameMatch || isMrnMatch) && !finalResults.find(p => p.id === lastPatient.id)) {
                        console.log('[SEARCH_RECOVERY] Injecting recent patient into results:', lastPatient.lastName);
                        finalResults = [lastPatient, ...finalResults];
                    }
                }
            } catch (recoveryErr) {
                console.warn('[SEARCH_RECOVERY] Failed to inject from vault:', recoveryErr);
            }

            setPatients(finalResults);
            setIsOpen(true);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm || dateFilter || typeFilter || statusFilter) {
                handleSearch();
            } else {
                setPatients([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, dateFilter, typeFilter, statusFilter]);

    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        setIsOpen(false);
        if (onSelect) onSelect(patient);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {/* Form integration: hidden input for patientId */}
            <input type="hidden" name="patientId" value={selectedPatient?.id || ""} />
            
            {/* Selected Patient Token */}
            {selectedPatient && (
                <div className="flex items-center justify-between p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl">
                    <div className="flex-1 min-w-0">
                        <strong className="block text-sm text-[var(--primary-dark)] truncate">{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                        <span className="block text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">{selectedPatient.mrn}</span>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSelectedPatient(null); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors shrink-0"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Search Input Group */}
            {!selectedPatient && (
                <div className="flex flex-col gap-3 w-full relative">
                    <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                        <input
                            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-sm bg-white"
                            type="text"
                            placeholder="Search by Name, MRN, or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsOpen(true)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Context</label>
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option value="">Any</option>
                                <option value="OPD">OPD</option>
                                <option value="IPD">IPD</option>
                                <option value="emergency">ER</option>
                            </select>
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Arrival</label>
                            <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Search Dropdown */}
            {isOpen && !selectedPatient && (searchTerm || patients.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {loading && <div className="p-4 text-center text-sm text-slate-500">🔍 Scouring clinical records...</div>}

                    {!loading && patients.length === 0 && searchTerm && (
                        <div className="p-6 text-center">
                            <p className="text-sm text-slate-500 mb-4">
                                No match found for "<strong>{searchTerm}</strong>"
                            </p>
                            {onRegister && (
                                <button
                                    type="button"
                                    onClick={() => onRegister(searchTerm)}
                                    className="clinical-btn bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all border-none"
                                >
                                    Register New Patient
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && patients.map((p) => (
                        <div
                            key={p.id}
                            data-testid="search-result"
                            data-patient-name={`${p.firstName} ${p.lastName}`}
                            onClick={() => selectPatient(p)}
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">{(p.firstName || 'P')[0]}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate">{p.firstName} {p.lastName}</div>
                                <div className="text-xs text-slate-500 truncate">
                                    {p.mrn} • {new Date().getFullYear() - new Date(p.dob).getFullYear()}Y • {p.gender}
                                </div>
                            </div>
                            <div className="shrink-0">
                                {p.latest_encounter_type && (
                                    <span className={`px-2 py-1 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600`}>
                                        {p.latest_encounter_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

</div>
    );
}


