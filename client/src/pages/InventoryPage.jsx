import { ShieldCheck } from 'lucide-react';
import { useToast } from '../hooks/useToast.jsx';
import MetricCard from '../components/MetricCard';

export default function InventoryPage({ inventory, onAddItem, onRestock }) {
  const { showToast } = useToast();

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter((item) => Number(item.stock) <= Number(item.reorder)).length;

  return (
    <div className="page-shell-premium animate-fade-in">
      <header className="page-header-premium mb-10 pb-6 border-b border-gray-100">
        <div>
           <h1 className="flex items-center gap-3">
              Asset Logistics & Supply Chain
              <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter font-black">Inventory Node</span>
           </h1>
           <p className="dim-label">Monitor clinical inventory, reorder thresholds, and asset registration with high-fidelity logistics tracking.</p>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-indigo-500" /> Operational Readiness • Supply Chain oversight active
           </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <MetricCard
          label="Stock Registry"
          value={totalItems}
          icon="inventory"
          accent="teal"
          trend="Validated nomenclature"
        />
        <MetricCard
          label="Threshold Alerts"
          value={lowStockItems}
          icon="appointments"
          accent="amber"
          trend="Low-stock review queue"
        />
        <MetricCard
          label="Audit Integrity"
          value="Secure"
          icon="insurance"
          accent="emerald"
          trend="Sequential ledger active"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-12">
        <aside className="xl:col-span-4">
          <article className="glass-panel p-8 h-full">
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Registration</p>
              <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">Register supply item</h2>
              <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">
                Add new supplies, medicines, consumables, or diagnostics into the facility inventory ledger.
              </p>
            </div>

            <form onSubmit={onAddItem} className="space-y-6">
              <div className="space-y-1.5 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Institutional Identifier
                </label>
                <input
                  name="code"
                  placeholder="MED-721-X"
                  className="input-field py-4 px-5 bg-white font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Nomenclature (Asset Name)
                </label>
                <input
                  name="name"
                  placeholder="Sterile Saline 500ml"
                  className="input-field py-4 px-5 bg-white font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5 transition-all">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Category Classification
                </label>
                <select name="category" className="input-field h-[56px] px-5 bg-white font-bold text-slate-800" required>
                  <option value="Pharmaceuticals">Pharmaceuticals</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Surgical">Surgical</option>
                  <option value="General">General Supply</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Stock Volume
                  </label>
                  <input
                    name="stock"
                    type="number"
                    placeholder="0"
                    className="input-field py-4 px-5 font-mono bg-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Critical Point
                  </label>
                  <input
                    name="reorder"
                    type="number"
                    placeholder="10"
                    className="input-field py-4 px-5 font-mono bg-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-5 text-[10px] uppercase tracking-[0.2em] shadow-xl">
                  Commit to Institutional Registry
                </button>
              </div>
            </form>
          </article>
        </aside>

        <main className="xl:col-span-8">
          <article className="premium-panel overflow-hidden">
            <div className="panel-header-standard">
              <div>
                <h3 className="panel-title-text font-bold">Global Stock Ledger</h3>
                <p className="panel-subtitle-text font-medium mt-1">Inventory availability and logistics status</p>
              </div>
              <input
                type="text"
                placeholder="Filter clinical items..."
                className="input-field py-3 w-72 bg-white"
              />
            </div>

            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Nomenclature</th>
                    <th>Availability</th>
                    <th>Logistics Status</th>
                    <th style={{ textAlign: 'right' }}>Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-24 text-slate-400 italic font-medium">
                        No inventory units identified in the facility registry.
                      </td>
                    </tr>
                  ) : inventory.map((item) => {
                    const isLow = Number(item.stock) <= Number(item.reorder);
                    const stockPct = Math.min(100, (Number(item.stock) / (Number(item.reorder) * 3 || 1)) * 100);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="w-32">
                          <code className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 group-hover:bg-white px-2.5 py-1 rounded border border-slate-100 transition-colors">
                            {item.code}
                          </code>
                        </td>
                        <td>
                          <div className="font-bold text-slate-900 text-sm leading-tight">{item.name}</div>
                          <div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mt-1">
                            {item.category || 'General Supply'}
                          </div>
                        </td>
                        <td className="w-56">
                          <div className="space-y-2">
                            <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-800">{item.stock} UNITS</span>
                              <span className="text-slate-400 text-[9px]">CRIT: {item.reorder}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${isLow ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}
                                style={{ width: `${stockPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest border border-slate-100 whitespace-nowrap shadow-sm ${
                            isLow ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                            {isLow ? 'Reorder Needed' : 'Optimal Stock'}
                          </div>
                        </td>
                        <td className="text-right">
                          <button
                            className="px-4 py-2 bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all border border-[var(--primary)]/10 shadow-sm active:scale-95"
                            onClick={() => onRestock(item.id)}
                          >
                            Initiate Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </main>
      </section>
    </div>
  );
}
