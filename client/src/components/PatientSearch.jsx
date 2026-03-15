
import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export default function PatientSearch({ tenantId, onSelect, initialPatientId }) {
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

    const handleSearch = async (term = searchTerm, date = dateFilter, type = typeFilter, status = statusFilter) => {
        if (!term && !date && !type && !status) {
            setPatients([]);
            return;
        }
        setLoading(true);
        try {
            const results = await api.searchPatients(tenantId, { text: term, date, type, status });
            setPatients(results);
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
        <div className="premium-patient-search" ref={wrapperRef}>
            {/* Selected Patient Token */}
            {selectedPatient && (
                <div className="selection-token">
                    <div className="token-info">
                        <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                        <span>{selectedPatient.mrn}</span>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSelectedPatient(null); }}
                        className="token-close"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Search Input Group */}
            {!selectedPatient && (
                <div className="search-group">
                    <div className="main-search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Find by Name, MRN, Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsOpen(true)}
                        />
                    </div>

                    <div className="filter-row">
                        <div className="filter-item">
                            <label>Context</label>
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option value="">Any</option>
                                <option value="OPD">OPD</option>
                                <option value="IPD">IPD</option>
                                <option value="emergency">ER</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Arrival</label>
                            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Search Dropdown */}
            {isOpen && !selectedPatient && (searchTerm || patients.length > 0) && (
                <div className="search-dropdown premium-glass">
                    {loading && <div className="dropdown-status">🔍 Scouring clinical records...</div>}

                    {!loading && patients.length === 0 && searchTerm && (
                        <div className="dropdown-empty">
                            No match found for "<strong>{searchTerm}</strong>"
                        </div>
                    )}

                    {!loading && patients.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => selectPatient(p)}
                            className="result-row"
                        >
                            <div className="result-avatar">{(p.firstName || 'P')[0]}</div>
                            <div className="result-main">
                                <div className="result-name">{p.firstName} {p.lastName}</div>
                                <div className="result-meta">
                                    {p.mrn} • {new Date().getFullYear() - new Date(p.dob).getFullYear()}Y • {p.gender}
                                </div>
                            </div>
                            <div className="result-aside">
                                {p.latest_encounter_type && (
                                    <span className={`type-tag ${p.latest_encounter_type}`}>
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


