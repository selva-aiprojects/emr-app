import { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function PharmacyVendors({ tenant }) {
    const [vendors, setVendors] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadVendors();
    }, [tenant]);

    const loadVendors = async () => {
        setLoading(true);
        try {
            const res = await api.getPharmacyVendors(tenant.id);
            setVendors(res.data || []);
        } catch (err) {
            console.error('Failed to load vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVendor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData(e.target);
        try {
            await api.addPharmacyVendor(tenant.id, {
                vendor_name: fd.get('name'),
                contact_person: fd.get('contact'),
                email: fd.get('email'),
                phone: fd.get('phone'),
                address: fd.get('address'),
                status: 'active'
            });
            setShowAdd(false);
            loadVendors();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div>
                    <h3 className="font-bold text-slate-800">Supply Chain Partners</h3>
                    <p className="text-xs text-slate-500 font-medium">Manage medical vendors and procurement contracts</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                >
                    Add New Partner
                </button>
            </div>

            {showAdd && (
                <article className="premium-panel animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold text-slate-800 mb-4">Partner Onboarding</h4>
                    <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Vendor Name</label>
                            <input name="name" required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Global Pharma Corp" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Contact Person</label>
                            <input name="contact" required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. John Doe" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Email Dispatch</label>
                            <input name="email" type="email" required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="procurement@vendor.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Communication Line</label>
                            <input name="phone" required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Physical Logistics Base (Address)</label>
                            <textarea name="address" required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" rows="3" placeholder="Operations HQ..."></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition">Abort</button>
                            <button disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition">
                                {submitting ? 'Processing...' : 'Finalize Integration'}
                            </button>
                        </div>
                    </form>
                </article>
            )}

            {loading ? (
                <article className="premium-panel text-center p-12">
                    <div className="animate-spin text-2xl mb-2">⏳</div>
                    <p className="text-slate-400">Loading procurement partners...</p>
                </article>
            ) : (
                <article className="premium-panel p-0 overflow-hidden">
                    {vendors.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="text-4xl mb-4 opacity-20">🏥</div>
                            <p className="font-medium">No verified supply partners identified in your registry.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-bold">Partner Name</th>
                                        <th className="px-4 py-2 text-left font-bold">Contact Person</th>
                                        <th className="px-4 py-2 text-left font-bold">Contact Info</th>
                                        <th className="px-4 py-2 text-center font-bold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {vendors.map(v => (
                                        <tr key={v.vendor_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-800">{v.vendor_name}</td>
                                            <td className="px-4 py-3">{v.contact_person}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-semibold text-slate-700">{v.email}</div>
                                                <div className="text-xs text-slate-500">{v.phone}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="badge success">{v.status.toUpperCase()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            )}
        </div>
    );
}
