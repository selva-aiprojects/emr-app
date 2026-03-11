import { useState } from 'react';

export default function LabPage({ tenant }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    return (
        <section>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Diagnostic Intelligence</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Laboratory results and pathology reports</p>
                </div>
                <div className="badge success">CENTRAL LAB ONLINE</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <article className="premium-panel p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg text-slate-700">Pending Test Requests</div>
                                <div className="text-xs text-muted uppercase font-bold mt-1">Awaiting Sample Collection / Analysis</div>
                            </div>
                        </div>

                        <div className="p-12 text-center text-slate-400">
                            <div className="text-4xl mb-4 opacity-20">🔬</div>
                            <h3 className="font-bold text-slate-600">No Pending Requests</h3>
                            <p className="text-sm">All diagnostic directives have been processed.</p>
                        </div>
                    </article>
                </div>

                <aside className="space-y-6">
                    <article className="premium-panel">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Lab Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-xs font-bold text-slate-500 uppercase">Turnaround Time</span>
                                <span className="text-sm font-bold text-slate-900">1.2 hrs</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-xs font-bold text-slate-500 uppercase">Critical Values</span>
                                <span className="text-sm font-bold text-red-600">0</span>
                            </div>
                        </div>
                    </article>

                    <article className="premium-panel bg-indigo-600 text-white">
                        <h3 className="font-bold mb-2">Sample Tracking</h3>
                        <p className="text-xs text-indigo-100 mb-4">Register new clinical specimens for analysis.</p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-bold transition">
                            Open Sample Log
                        </button>
                    </article>
                </aside>
            </div>
        </section>
    );
}
