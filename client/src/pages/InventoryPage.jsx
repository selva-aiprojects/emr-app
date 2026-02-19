export default function InventoryPage({ inventory, onAddItem, onRestock }) {
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Asset Logistics & Inventory</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">Institutional oversight of {inventory.length} active inventory units</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="premium-panel flex items-center gap-4 mb-0">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-xl">📦</div>
          <div>
            <div className="font-bold text-slate-900">Stock Registry</div>
            <p className="text-xs text-muted font-bold">Validated nomenclature</p>
          </div>
        </div>
        <div className="premium-panel flex items-center gap-4 mb-0">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg text-xl">⚠️</div>
          <div>
            <div className="font-bold text-slate-900">Threshold Logic</div>
            <p className="text-xs text-muted font-bold">{inventory.filter(i => i.stock <= i.reorder).length} Critical depletion alerts</p>
          </div>
        </div>
        <div className="premium-panel flex items-center gap-4 mb-0">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xl">🛡️</div>
          <div>
            <div className="font-bold text-slate-900">Audit Integrity</div>
            <p className="text-xs text-muted font-bold">Sequential ledger active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1.5rem' }}>
        <aside style={{ gridColumn: 'span 4' }}>
          <article className="premium-panel">
            <div className="panel-header">
              <div className="panel-title">Asset Registration</div>
            </div>

            <form onSubmit={onAddItem} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase">Asset Identifier</label>
                <input name="code" placeholder="E.g. MED-721-X" className="premium-input" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase">Nomenclature</label>
                <input name="name" placeholder="E.g. Sterile Saline 500ml" className="premium-input" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase">Category</label>
                <select name="category" className="premium-select" required>
                  <option value="Pharmaceuticals">Pharmaceuticals</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Surgical">Surgical</option>
                  <option value="General">General Supply</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted uppercase">Initial Volume</label>
                  <input name="stock" type="number" placeholder="0" className="premium-input" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted uppercase">Reorder Point</label>
                  <input name="reorder" type="number" placeholder="10" className="premium-input" required />
                </div>
              </div>
              <button type="submit" className="premium-btn btn-primary mt-2">Commit to Registry</button>
            </form>
          </article>
        </aside>

        <main style={{ gridColumn: 'span 8' }}>
          <article className="premium-panel p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="panel-title">Global Stock Ledger</div>
              <input type="text" placeholder="Filter clinical items..." className="premium-input py-1 w-48 text-xs" />
            </div>

            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Nomenclature / Dept</th>
                    <th>Availability</th>
                    <th>Logistics Status</th>
                    <th style={{ textAlign: 'right' }}>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-12 text-muted">
                        <div className="text-4xl opacity-20 mb-2">📦</div>
                        <h3>Registry Idle</h3>
                        <p>No inventory units identified in the master registry.</p>
                      </td>
                    </tr>
                  ) : inventory.map((i) => {
                    const isLow = i.stock <= i.reorder;
                    const stockPct = Math.min(100, (i.stock / (i.reorder * 3)) * 100);

                    return (
                      <tr key={i.id}>
                        <td><code className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600 font-mono border border-slate-200">{i.code}</code></td>
                        <td>
                          <div className="font-bold text-slate-900">{i.name}</div>
                          <span className="text-xs text-muted font-bold">{i.category || 'General Supply'}</span>
                        </td>
                        <td>
                          <div className="w-32">
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-slate-900">{i.stock} Units</span>
                              <span className="text-muted">Crit: {i.reorder}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${stockPct}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${isLow ? 'danger' : 'success'}`}>
                            {isLow ? 'CRITICAL / LOW' : 'OPTIMAL'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="premium-btn btn-ghost border border-slate-200 text-xs py-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => onRestock(i.id)}>
                            RESTOCK
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
      </div>
    </section>
  );
}
