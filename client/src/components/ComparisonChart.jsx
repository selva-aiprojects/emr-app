export default function ComparisonChart({ title, data, dataKey, color, type = "line", formatValue = (v) => v }) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-placeholder">
                <p>Generating insights...</p>
            </div>
        );
    }

    const values = data.map(d => d[dataKey]);
    const max = Math.max(...values, 1) * 1.1; 
    const currentMonth = data[data.length - 1];
    const previousMonth = data.length > 1 ? data[data.length - 2] : null;

    const change = previousMonth
        ? ((currentMonth[dataKey] - previousMonth[dataKey]) / Math.max(previousMonth[dataKey], 1) * 100).toFixed(1)
        : 0;

    const chartHeight = 100;
    const chartWidth = 300;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const innerWidth = chartWidth - padding.left - padding.right;

    const getX = (i) => padding.left + (i / (data.length - 1 || 1)) * innerWidth;
    const getY = (v) => chartHeight - padding.bottom - (v / max) * innerHeight;

    // Line Chart Paths
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d[dataKey]) }));
    
    const catmullRom2bezier = (points) => {
        if (points.length < 2) return `M ${points[0]?.x || 0},${points[0]?.y || 0}`;
        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 === points.length ? i + 1 : i + 2];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }
        return d;
    };

    const curvePath = type === "line" ? catmullRom2bezier(points) : "";
    const areaPath = type === "line" ? `${curvePath} L ${points[points.length - 1].x},${chartHeight - padding.bottom} L ${points[0].x},${chartHeight - padding.bottom} Z` : "";

    const gridLines = [0, 0.25, 0.5, 0.75, 1];

    return (
        <div className="analytics-widget-v2">
            <div className="chart-header-v2" style={{ marginBottom: '8px' }}>
                <div className="chart-info-v2">
                    <h4 className="chart-title-v2" style={{ fontSize: '0.75rem' }}>{title}</h4>
                    <div className="chart-meta-v2" style={{ marginTop: '2px' }}>
                        <span className={`change-pill ${parseFloat(change) >= 0 ? 'up' : 'down'}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                            {parseFloat(change) >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                        </span>
                        <span className="total-label" style={{ fontSize: '0.6rem' }}>Trend: {parseFloat(change) >= 0 ? 'Positive' : 'Focus'}</span>
                    </div>
                </div>
            </div>

            <div className="chart-content-v2">
                <div className="svg-container-v2">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" className="svg-chart-v2">
                        <defs>
                            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Grid */}
                        {gridLines.map((g, i) => (
                            <line 
                                key={i} 
                                x1={padding.left} 
                                y1={chartHeight - padding.bottom - g * innerHeight} 
                                x2={chartWidth - padding.right} 
                                y2={chartHeight - padding.bottom - g * innerHeight} 
                                className="chart-grid-line"
                            />
                        ))}

                        {/* Line Chart Body */}
                        {type === "line" && (
                            <>
                                <path d={areaPath} fill={`url(#gradient-${dataKey})`} />
                                <path d={curvePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </>
                        )}

                        {/* Bar Chart Body */}
                        {type === "bar" && data.map((d, i) => {
                            const barWidth = (innerWidth / data.length) * 0.7;
                            const x = getX(i) - barWidth / 2;
                            const h = (d[dataKey] / max) * innerHeight;
                            const y = chartHeight - padding.bottom - h;
                            return (
                                <rect 
                                    key={i}
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={h}
                                    fill={color}
                                    rx="2"
                                    opacity={i === data.length - 1 ? 1 : 0.7}
                                    className={i === data.length - 1 ? "pulse-bar" : ""}
                                />
                            );
                        })}

                        {/* Points (for line) or Top Labels (for bar) */}
                        {data.map((d, i) => {
                            const isLast = i === data.length - 1;
                            const p = points[i];
                            
                            if (type === "line") {
                                if (!isLast && i % 2 !== 0 && data.length > 8) return null;
                                return (
                                    <g key={i}>
                                        {isLast && (
                                            <circle cx={p.x} cy={p.y} r="6" fill={color} opacity="0.2" className="pulse-slow" />
                                        )}
                                        <circle 
                                            cx={p.x} 
                                            cy={p.y} 
                                            r={isLast ? "3.5" : "2"} 
                                            fill={isLast ? color : "white"} 
                                            stroke={color} 
                                            strokeWidth="1.5" 
                                            filter={isLast ? "url(#glow)" : ""}
                                        />
                                        {isLast && (
                                            <text x={p.x + 8} y={p.y + 4} className="chart-val-label">{formatValue(d[dataKey])}</text>
                                        )}
                                    </g>
                                );
                            } else if (type === "bar" && isLast) {
                                return (
                                    <text key={i} x={p.x} y={p.y - 6} textAnchor="middle" className="chart-val-label">{formatValue(d[dataKey])}</text>
                                );
                            }
                            return null;
                        })}

                        {/* Date Labels */}
                        {data.map((d, i) => {
                            if (data.length > 10 && i % 3 !== 0 && i !== data.length - 1) return null;
                            const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : (d.month || i);
                            return (
                                <text 
                                    key={i} 
                                    x={getX(i)} 
                                    y={chartHeight - 8} 
                                    textAnchor="middle" 
                                    className="chart-axis-label"
                                >
                                    {dateStr}
                                </text>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
