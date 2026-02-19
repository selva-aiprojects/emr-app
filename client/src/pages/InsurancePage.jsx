import { useState, useMemo } from 'react';

export default function InsurancePage({ providers = [], claims = [], onCreateProvider, onCreateClaim }) {
    const [showRegister, setShowRegister] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProviders = useMemo(() => {
        if (!searchTerm) return providers;
        return providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [providers, searchTerm]);

    const stats = useMemo(() => [
        { label: 'Active Providers', value: providers.length, trend: 'Registered Units', color: 'bg-blue-50 text-blue-600' },
        { label: 'Pending Claims', value: claims.filter(c => c.status === 'Pending').length, trend: 'High Priority', color: 'bg-amber-50 text-amber-600' },
        { label: 'Realized Claims', value: `₹${(claims.reduce((s, c) => s + (Number(c.amount) || 0), 0) / 100000).toFixed(1)}L`, trend: 'Total Volume', color: 'bg-emerald-50 text-emerald-600' }
    ], [providers, claims]);

    return (
        <section>
            <header className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Insurance & Claims Registry</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Corporate coverage management and clinical claim oversight</p>
                </div>
                <button className="premium-btn btn-primary" onClick={() => setShowRegister(true)}>
                    <span>➕</span> Register New Provider
                </button>
            </header>

            <div className="grid grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="premium-panel flex items-center gap-4 mb-0">
                        <div className={`p-4 rounded-xl ${stat.color} font-bold text-xl h-12 w-12 flex items-center justify-center`}>
                            {idx === 0 ? '🏥' : idx === 1 ? '⏳' : '💰'}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-muted uppercase tracking-wider">{stat.label}</div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="text-xs font-bold text-slate-500">{stat.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            <article className="premium-panel p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="font-bold text-lg text-slate-700">Provider Registry</div>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        <input
                            type="text"
                            placeholder="Filter providers..."
                            className="premium-input pl-10 py-2 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Provider Identity</th>
                                <th>Category</th>
                                <th>Coverage Limit</th>
                                <th>Registry Status</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProviders.length > 0 ? filteredProviders.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{p.name}</div>
                                                <div className="text-xs text-slate-500 font-semibold">{p.contact_person || 'No Contact'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge secondary">{p.type}</span></td>
                                    <td className="font-bold text-slate-700 text-sm">₹{(Number(p.coverage_limit) / 100000).toFixed(1)}L Limit</td>
                                    <td>
                                        <span className={`badge ${p.status === 'Active' ? 'success' : 'warning'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="premium-btn btn-ghost py-1 px-3 text-xs border border-slate-200 hover:border-blue-500 hover:text-blue-600">Details</button>
                                        <button className="premium-btn btn-ghost py-1 px-3 text-xs border border-slate-200 hover:border-blue-500 hover:text-blue-600 ml-2" onClick={() => alert('Claim management coming soon')}>Claims</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-12 text-muted">
                                        No insurance providers registered yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </article>

            {showRegister && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                        <header className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Register Insurance Provider</h3>
                            <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-slate-600 font-bold text-2xl">×</button>
                        </header>
                        <form onSubmit={(e) => { onCreateProvider(e); setShowRegister(false); }}>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex flex-col gap-2 col-span-2">
                                    <label className="text-xs font-bold text-muted uppercase">Provider Name</label>
                                    <input className="premium-input" name="name" required placeholder="e.g. Star Health Assurance" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-muted uppercase">Type</label>
                                    <select className="premium-select" name="type">
                                        <option value="Private">Private</option>
                                        <option value="Government">Government</option>
                                        <option value="Corporate">Corporate</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-muted uppercase">Limit (₹)</label>
                                    <input className="premium-input" name="coverageLimit" type="number" required defaultValue="500000" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-muted uppercase">Contact Person</label>
                                    <input className="premium-input" name="contactPerson" required placeholder="Full Name" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-muted uppercase">Phone</label>
                                    <input className="premium-input" name="phone" required placeholder="+91 ..." />
                                </div>
                                <div className="flex flex-col gap-2 col-span-2">
                                    <label className="text-xs font-bold text-muted uppercase">Email</label>
                                    <input className="premium-input" name="email" type="email" required placeholder="corporate@provider.com" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" className="premium-btn btn-ghost" onClick={() => setShowRegister(false)}>Cancel</button>
                                <button type="submit" className="premium-btn btn-primary">Complete Registration</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
