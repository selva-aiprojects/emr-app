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

    const chartHeight = 80;
    const chartWidth = 100;
    const labelRow = 18;
    const safeDenom = Math.max(data.length - 1, 1);

    const points = data.map((item, index) => {
        const x = (index / safeDenom) * chartWidth;
        const y = chartHeight - (item[dataKey] / max) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

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

                <div className="chart-viewport" style={{ height: `${chartHeight + labelRow}px` }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight + labelRow}`} className="chart-svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        <path
                            d={`M0 ${chartHeight} L ${points.replace(/ /g, ' L ')} L ${chartWidth} ${chartHeight} Z`}
                            fill="url(#chartArea)"
                        />
                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        {data.map((item, index) => {
                            const x = (index / safeDenom) * chartWidth;
                            const y = chartHeight - (item[dataKey] / max) * chartHeight;
                            const isLast = index === data.length - 1;
                            return (
                                <g key={index}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isLast ? 2.8 : 2}
                                        fill={isLast ? color : '#ffffff'}
                                        stroke={color}
                                        strokeWidth="1"
                                    />
                                    {index % 2 === 0 && (
                                        <text
                                            x={x}
                                            y={chartHeight + 14}
                                            fontSize="8"
                                            fill="var(--text-muted)"
                                            textAnchor="middle"
                                            fontWeight="700"
                                        >
                                            {item.month?.split('-')[1]?.toUpperCase()}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
