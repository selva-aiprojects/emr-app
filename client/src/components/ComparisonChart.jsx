export default function ComparisonChart({ title, data, dataKey, color, todayValue, formatValue = (v) => v }) {
    if (!data || data.length === 0) {
        return (
            <div className="oversight-section" style={{ minHeight: '200px', display: 'grid', placeItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Insight generation in progress...</p>
            </div>
        );
    }

    const values = data.map(d => d[dataKey]);
    const total = values.reduce((sum, val) => sum + val, 0);
    const max = Math.max(...values, 1);
    const currentMonth = data[data.length - 1];
    const previousMonth = data.length > 1 ? data[data.length - 2] : null;

    const monthChange = previousMonth
        ? ((currentMonth[dataKey] - previousMonth[dataKey]) / previousMonth[dataKey] * 100).toFixed(1)
        : 0;

    const chartHeight = 160;
    const barWidth = (100 / data.length) - 4;

    return (
        <div className="oversight-section charting-widget">
            <div className="section-head-premium">
                <div className="head-text">
                    <h3>{title}</h3>
                    <p>Monthly performance delta: <span className={monthChange >= 0 ? 'text-success' : 'text-danger'}>
                        {monthChange >= 0 ? '+' : ''}{monthChange}%
                    </span></p>
                </div>
            </div>

            <div style={{ padding: '24px' }}>
                <div className="chart-stats-row" style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
                    <div className="stat-pill">
                        <span className="label">Terminal Period</span>
                        <span className="value">{formatValue(currentMonth[dataKey])}</span>
                    </div>
                    <div className="stat-pill">
                        <span className="label">Cumulative Velocity</span>
                        <span className="value" style={{ color: 'var(--text-secondary)' }}>{formatValue(total)}</span>
                    </div>
                </div>

                <div className="chart-viewport" style={{ position: 'relative', height: `${chartHeight}px` }}>
                    <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                        {data.map((item, index) => {
                            const h = (item[dataKey] / max) * chartHeight;
                            const x = (index * (100 / data.length)) + '%';
                            const isLast = index === data.length - 1;

                            return (
                                <g key={index}>
                                    <rect
                                        x={x}
                                        y={chartHeight - h}
                                        width={`${barWidth}%`}
                                        height={h}
                                        fill={isLast ? color : 'var(--border-light)'}
                                        rx="6"
                                        style={{ transition: 'all 0.4s ease' }}
                                    />
                                    <text
                                        x={`calc(${x} + ${barWidth / 2}%)`}
                                        y={chartHeight + 18}
                                        fontSize="10"
                                        fill="var(--text-muted)"
                                        textAnchor="middle"
                                        fontWeight="700"
                                    >
                                        {item.month?.split('-')[1]?.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <style>{`
        .charting-widget { border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
        .text-success { color: var(--medical-success); font-weight: 700; }
        .text-danger { color: var(--medical-danger); font-weight: 700; }
        .stat-pill { display: flex; flex-direction: column; }
        .stat-pill .label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .stat-pill .value { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
      `}</style>
        </div>
    );
}
