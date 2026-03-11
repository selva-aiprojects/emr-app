import { useState } from 'react';
import { api } from '../../api.js';

export default function PharmacyVendors({ tenant }) {
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddVendor = async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.target);
        try {
            await api.addPharmacyVendor(tenant.id, {
                name: fd.get('name'),
                contactPerson: fd.get('contact'),
                email: fd.get('email'),
                phone: fd.get('phone'),
                address: fd.get('address'),
                status: 'active'
            });
            setShowAdd(false);
            alert('Vendor integrated successfully.');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
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
                            <button disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition">
                                {loading ? 'Processing...' : 'finalize Integration'}
                            </button>
                        </div>
                    </form>
                </article>
            )}

            <article className="premium-panel p-0 overflow-hidden">
                <div className="p-12 text-center text-slate-400">
                    <div className="text-4xl mb-4 opacity-20">🏥</div>
                    <p className="font-medium">No verified supply partners identified in your registry.</p>
                </div>
            </article>
        </div>
    );
}
