export default function ComparisonChart({ title, data, dataKey, color, todayValue, formatValue = (v) => v }) {
    if (!data || data.length === 0) {
        return (
            <div className="oversight-section chart-placeholder">
                <p className="chart-placeholder-copy">Insight generation in progress...</p>
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

            <div className="chart-inner">
                <div className="chart-stats-row">
                    <div className="stat-pill">
                        <span className="label">Terminal Period</span>
                        <span className="value">{formatValue(currentMonth[dataKey])}</span>
                    </div>
                    <div className="stat-pill">
                        <span className="label">Cumulative Velocity</span>
                        <span className="value value-muted">{formatValue(total)}</span>
                    </div>
                </div>

                <div className="chart-viewport" style={{ height: `${chartHeight}px` }}>
                    <svg width="100%" height="100%" className="chart-svg">
                        {data.map((item, index) => {
                            const h = (item[dataKey] / max) * chartHeight;
                            const basePos = (index * (100 / data.length));
                            const x = basePos + '%';
                            const textX = (basePos + barWidth / 2) + '%';
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
                                        x={textX}
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
        </div>
    );
}
