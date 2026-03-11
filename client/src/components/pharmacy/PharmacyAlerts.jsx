import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function PharmacyAlerts({ tenant }) {
    const [lowStock, setLowStock] = useState([]);
    const [expiring, setExpiring] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
    }, [tenant]);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const [stockRes, expiringRes] = await Promise.all([
                api.getLowStockAlerts(tenant.id),
                api.getExpiringStockAlerts(tenant.id, 90)
            ]);
            setLowStock(stockRes.data || []);
            setExpiring(expiringRes.data || []);
        } catch (err) {
            console.error('Failed to load pharmacy alerts:', err);
        } finally {
            setLoading(false);
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
        <div className="grid grid-cols-2 gap-6 p-4">
            {/* Low Stock Alerts */}
            <article className="premium-panel p-0 overflow-hidden">
                <div className="p-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-lg text-red-900">Critical Low Stock</div>
                        <div className="text-xs text-red-700 font-bold mt-1">Items below reorder threshold</div>
                    </div>
                    <div className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold">{lowStock.length} Alerts</div>
                </div>
                <div className="p-2">
                    {lowStock.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Inventory levels optimal</div>
                    ) : (
                        <div className="space-y-2">
                            {lowStock.map(item => (
                                <div key={item.batchId} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">{item.drugName}</div>
                                        <div className="text-xs text-slate-500">Loc: {item.location} • Threshold: {item.reorderThreshold}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${item.alertLevel === 'CRITICAL' ? 'text-red-600' : 'text-amber-500'}`}>
                                            {item.quantityRemaining} left
                                        </div>
                                        <button className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Reorder {item.suggestedOrderQuantity}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </article>

            {/* Expiring Stock Alerts */}
            <article className="premium-panel p-0 overflow-hidden">
                <div className="p-4 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-lg text-amber-900">Expiring Stock</div>
                        <div className="text-xs text-amber-700 font-bold mt-1">Batches expiring within 90 days</div>
                    </div>
                    <div className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold">{expiring.length} Alerts</div>
                </div>
                <div className="p-2">
                    {expiring.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No items expiring soon</div>
                    ) : (
                        <div className="space-y-2">
                            {expiring.map(item => (
                                <div key={item.batchId} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <div className="font-bold text-slate-800">{item.drugName} <span className="text-xs font-normal text-slate-500">({item.batchNumber})</span></div>
                                        <div className="text-xs text-slate-500">Qty: {item.quantityRemaining} • Loc: {item.location}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${item.daysUntilExpiry <= 30 ? 'text-red-600' : 'text-amber-600'}`}>
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
