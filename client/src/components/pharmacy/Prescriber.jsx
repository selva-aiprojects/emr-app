import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function Prescriber({ tenantId, patientId, onDrugsChange, initialMeds = [] }) {
    const [items, setItems] = useState(initialMeds);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [safetyCheck, setSafetyCheck] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [overrideSafety, setOverrideSafety] = useState(false);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchQuery.length > 2) {
                performSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async (query) => {
        setIsSearching(true);
        try {
            const res = await api.searchDrugs(query);
            if (res.success) {
                setSearchResults(res.data || []);
            }
        } catch (err) {
            console.error('Drug search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const addDrug = (drug) => {
        const newItem = {
            drugId: drug.id,
            drugName: drug.genericName || drug.generic_name,
            dose: '1',
            doseUnit: 'tablet',
            frequency: 'QD',
            route: drug.route || 'Oral',
            durationDays: '7',
            quantity: 7,
            instructions: 'Take as directed'
        };
        const nextItems = [...items, newItem];
        setItems(nextItems);
        setSearchQuery('');
        setSearchResults([]);
        onDrugsChange(nextItems, { safetyCheck: null, overrideSafety: false });
        setSafetyCheck(null);
        setOverrideSafety(false);
    };

    const updateItem = (index, field, value) => {
        const next = [...items];
        next[index][field] = value;

        // Auto-calculate quantity safely
        if (field === 'durationDays' || field === 'frequency' || field === 'dose') {
            const duration = parseInt(next[index].durationDays) || 1;
            const dose = parseFloat(next[index].dose) || 1;
            let multiplier = 1;
            switch (next[index].frequency) {
                case 'BID': multiplier = 2; break;
                case 'TID': multiplier = 3; break;
                case 'QID': multiplier = 4; break;
                default: multiplier = 1; break;
            }
            next[index].quantity = Math.ceil(duration * dose * multiplier);
        }

        setItems(next);
        onDrugsChange(next, { safetyCheck, overrideSafety });
    };

    const removeItem = (index) => {
        const next = items.filter((_, i) => i !== index);
        setItems(next);
        onDrugsChange(next, { safetyCheck, overrideSafety });
    };

    const validatePrescription = async () => {
        if (items.length === 0) return;
        setIsValidating(true);
        try {
            const res = await api.validatePrescription(tenantId, {
                patientId,
                items
            });
            if (res.success) {
                setSafetyCheck(res.safetyCheck);
                onDrugsChange(items, { safetyCheck: res.safetyCheck, overrideSafety });
            }
        } catch (err) {
            alert('Safety Check Failed: ' + err.message);
        } finally {
            setIsValidating(false);
        }
    };

    const handleOverrideToggle = (e) => {
        const checked = e.target.checked;
        setOverrideSafety(checked);
        onDrugsChange(items, { safetyCheck, overrideSafety: checked });
    };

    return (
        <div className="rx-module-premium" style={{ marginBottom: '20px' }}>
            <div className="rx-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>℞ Electronic Prescribing</h4>
                <button
                    type="button"
                    className="premium-btn btn-secondary py-1 px-3 text-xs"
                    onClick={validatePrescription}
                    disabled={isValidating || items.length === 0}
                >
                    {isValidating ? 'Checking...' : '✓ Validate Safety'}
                </button>
            </div>

            {safetyCheck && (
                <div className={`p-3 mb-4 rounded-lg text-sm border ${safetyCheck.isSafe ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    <div className="font-bold flex items-center mb-1">
                        {safetyCheck.isSafe ? '✅ Safe to Prescribe' : '⚠️ Safety Interventions Required'}
                    </div>
                    {safetyCheck.alerts?.map((alert, i) => (
                        <div key={i} className="mb-2 last:mb-0 bg-white p-2 rounded border border-red-100 flex items-start text-xs">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 mt-0.5 ${alert.severity === 'CRITICAL' ? 'bg-black text-white' :
                                    alert.severity === 'MAJOR' ? 'bg-red-600 text-white' :
                                        'bg-amber-100 text-amber-800'
                                }`}>
                                {alert.severity}
                            </span>
                            <div>
                                <strong>{alert.type.replace('_', ' ')}:</strong> {alert.description || alert.message || alert.reaction}
                                {(alert.drugs || alert.drug) && <div className="text-slate-500 mt-0.5">Affected: {alert.drugs ? alert.drugs.join(', ') : alert.drug}</div>}
                            </div>
                        </div>
                    ))}
                    {!safetyCheck.isSafe && (
                        <div className="mt-2 pt-2 border-t border-red-200 flex items-center">
                            <label className="flex items-center text-red-900 font-bold cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={overrideSafety}
                                    onChange={handleOverrideToggle}
                                />
                                Override and Proceed (Clinical Responsibility Assumed)
                            </label>
                        </div>
                    )}
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: '15px' }}>
                <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Search drug catalog (e.g. Ibuprofen, Amoxicillin)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {isSearching && <span className="absolute right-3 top-2 text-slate-400 text-sm animate-pulse">Searching...</span>}

                {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map(drug => (
                            <div
                                key={drug.id}
                                className="p-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                onClick={() => addDrug(drug)}
                            >
                                <div>
                                    <div className="font-bold text-slate-800">{drug.generic_name || drug.genericName} {drug.strength}</div>
                                    <div className="text-xs text-slate-500">{drug.dosage_form} • {drug.route} {(drug.brand_names || []).join(', ')}</div>
                                </div>
                                {drug.highAlertFlag && <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded font-bold">HIGH ALERT</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rx-lines">
                {items.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 text-sm">No medications added</div>
                ) : items.map((m, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2 relative">
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-slate-400 hover:text-red-500 font-bold"
                            onClick={() => removeItem(i)}
                        >✕</button>
                        <div className="font-bold text-emerald-700 mb-2 pb-2 border-b border-slate-200">
                            {m.drugName} <div className="text-amber-600 font-bold uppercase text-xs">Critical</div> <span className="text-xs font-normal text-slate-500 bg-emerald-50 px-1 rounded ml-1">ID: {m.drugId.slice(0, 8)}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-2">
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Dose</label>
                                <input className="w-full text-sm p-1 border rounded" value={m.dose} onChange={e => updateItem(i, 'dose', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Unit</label>
                                <input className="w-full text-sm p-1 border rounded" value={m.doseUnit} onChange={e => updateItem(i, 'doseUnit', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Frequency</label>
                                <select className="w-full text-sm p-1 border rounded bg-white" value={m.frequency} onChange={e => updateItem(i, 'frequency', e.target.value)}>
                                    <option value="QD">QD (Daily)</option>
                                    <option value="BID">BID (2x/day)</option>
                                    <option value="TID">TID (3x/day)</option>
                                    <option value="QID">QID (4x/day)</option>
                                    <option value="PRN">PRN (As needed)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Days</label>
                                <input className="w-full text-sm p-1 border rounded" type="number" min="1" value={m.durationDays} onChange={e => updateItem(i, 'durationDays', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-3">
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Instructions / Sig</label>
                                <input className="w-full text-sm p-1 border rounded bg-white" value={m.instructions} onChange={e => updateItem(i, 'instructions', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Dispense Qty</label>
                                <input className="w-full text-sm p-1 border rounded bg-white" type="number" value={m.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
