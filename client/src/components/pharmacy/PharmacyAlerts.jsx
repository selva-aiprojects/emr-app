import { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function PharmacyAlerts({ tenant }) {
    const [lowStock, setLowStock] = useState([]);
    const [expiring, setExpiring] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reordering, setReordering] = useState(null); // batchId being reordered
    const [lowStockAlertType, setLowStockAlertType] = useState('normal');
    const [lowStockAlertMsg, setLowStockAlertMsg] = useState('Inventory levels optimal');

    useEffect(() => {
        if (lowStock.length > 0) {
            const hasCritical = lowStock.some(i => i.alertLevel === 'CRITICAL');
            setLowStockAlertType(hasCritical ? 'critical' : 'warning');
            setLowStockAlertMsg(hasCritical ? 'Critical Stock depletion detected' : 'Stock replenishment advised');
        } else {
            setLowStockAlertType('normal');
            setLowStockAlertMsg('Inventory levels optimal');
        }
    }, [lowStock]);

    useEffect(() => {
        loadAlerts();
    }, [tenant]);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const [stockRes, expiringRes, vendorRes] = await Promise.all([
                api.getLowStockAlerts(tenant.id),
                api.getExpiringStockAlerts(tenant.id, 90),
                api.getPharmacyVendors(tenant.id)
            ]);
            setLowStock(stockRes.data || []);
            setExpiring(expiringRes.data || []);
            setVendors(vendorRes.data || []);
        } catch (err) {
            console.error('Failed to load pharmacy alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = async (item) => {
        // Pick the first active vendor or prompt user if none exist
        if (vendors.length === 0) {
            alert('No vendors registered. Please add a vendor in the Vendors tab first.');
            return;
        }
        const vendor = vendors[0]; // auto-select first vendor; could be a modal for multi-vendor
        setReordering(item.batchId);
        try {
            const poNumber = `PO-${Date.now()}`;
            await api.createPharmacyPO(tenant.id, {
                vendorId: vendor.vendor_id,
                poNumber,
                items: [{
                    drugId: item.drugId,
                    quantity: item.suggestedOrderQuantity,
                    unitPrice: 0
                }],
                totalAmount: 0
            });
            alert(`✅ Draft PO ${poNumber} created for ${item.drugName} (Qty: ${item.suggestedOrderQuantity}) via ${vendor.vendor_name}. Review it in the Procurement tab.`);
        } catch (err) {
            alert('Reorder Error: ' + err.message);
        } finally {
            setReordering(null);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p>Loading Inventory Alerts...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {/* Low Stock Alerts */}
            <article className="clinical-card p-0 overflow-hidden shadow-xl">
                <div className={`px-4 py-8 flex items-center justify-between transition-all border-b ${
                    lowStockAlertType === 'critical' ? 'bg-red-50/50 border-red-100' : 
                    lowStockAlertType === 'warning' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${
                            lowStockAlertType === 'critical' ? 'bg-red-500 shadow-red-500/50' : 
                            lowStockAlertType === 'warning' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-blue-500'
                        }`}></div>
                        <div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${
                                lowStockAlertType === 'critical' ? 'text-red-700' : 
                                lowStockAlertType === 'warning' ? 'text-amber-700' : 'text-slate-500'
                            }`}>{lowStockAlertMsg}</span>
                            <h3 className="font-bold text-slate-900">Inventory Depletion</h3>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                        lowStockAlertType === 'critical' ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-600/20' : 
                        'bg-white text-slate-700 border-slate-200'
                    }`}>{lowStock.length} Alerts</div>
                </div>
                <div className="p-2">
                    {lowStock.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">✅ Inventory levels optimal</div>
                    ) : (
                        <div className="space-y-2">
                            {lowStock.map(item => (
                                <div key={item.batchId} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">{item.drugName}</div>
                                        <div className="text-xs text-slate-500">Loc: {item.location} • Threshold: {item.reorderThreshold}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${item.alertLevel === 'CRITICAL' ? 'text-amber-700' : 'text-amber-500'}`}>
                                            {item.quantityRemaining} left
                                        </div>
                                        <button
                                            onClick={() => handleReorder(item)}
                                            disabled={reordering === item.batchId}
                                            className="text-[10px] text-blue-600 font-bold uppercase hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {reordering === item.batchId ? 'Creating PO...' : `Reorder ${item.suggestedOrderQuantity}`}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </article>

            {/* Expiring Stock Alerts */}
            <article className="clinical-card p-0 overflow-hidden shadow-xl">
                <div className="px-5 py-8 border-b border-amber-100 bg-amber-50/30 flex justify-between items-center">
                    <div>
                        <span className="text-[10px] text-amber-700 font-black uppercase tracking-[0.2em] block mb-1">Stock Volatility</span>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Expiring Batches</h3>
                        <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">Threshold: 90 Days</p>
                    </div>
                    <div className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/20">{expiring.length} Alerts</div>
                </div>
                <div className="p-2">
                    {expiring.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">✅ No items expiring soon</div>
                    ) : (
                        <div className="space-y-2">
                            {expiring.map(item => (
                                <div key={item.batchId} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">{item.drugName} <span className="text-xs font-normal text-slate-500">({item.batchNumber})</span></div>
                                        <div className="text-xs text-slate-500">Qty: {item.quantityRemaining} • Loc: {item.location}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${item.daysUntilExpiry <= 30 ? 'text-amber-700' : 'text-amber-600'}`}>
                                            {item.daysUntilExpiry} Days
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(item.expiryDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
