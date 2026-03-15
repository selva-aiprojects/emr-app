import { 
  Users, 
  Building2, 
  Terminal, 
  Calendar, 
  Activity, 
  Users2, 
  Pill, 
  FlaskConical, 
  Package, 
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const iconMap = {
  patients: Users,
  tenants: Building2,
  employees: Users2,
  appointments: Calendar,
  pharmacy: Pill,
  lab: FlaskConical,
  inventory: Package,
  billing: Activity,
  insurance: ShieldCheck,
  default: Terminal
};

const bgColors = {
  blue: 'bg-medical-blue/10 text-medical-blue border-medical-blue/20',
  green: 'bg-success/10 text-success border-success/20',
  amber: 'bg-warning/10 text-warning border-warning/20',
  red: 'bg-error/10 text-error border-error/20',
  info: 'bg-medical-blue/10 text-medical-blue border-medical-blue/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  teal: 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]/20',
  emerald: 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20',
};

export default function MetricCard({ label, value, accent = 'blue', icon, change, trend }) {
  const Icon = typeof icon === 'string' ? (iconMap[icon] || iconMap.default) : icon;
  const isDirectionalTrend = trend === 'up' || trend === 'down' || trend === 'neutral';
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-error';
    return 'text-clinical-muted';
  };

  return (
    <div className="metric-card-pro bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all duration-300">
      {/* Header with icon and change indicator */}
      <div className="flex justify-center items-center mb-3 relative min-h-[40px]">
        <div className={`p-2.5 rounded-xl ${bgColors[accent] || bgColors.blue} border`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {change && (
          <div className={`absolute right-0 top-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${bgColors[accent] || bgColors.blue}`}>
            {getTrendIcon()}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      {/* Value and label */}
      <div className="space-y-1 text-center">
        <div className="metric-value-pro text-2xl font-bold text-slate-800 tracking-tight">
          {value}
        </div>
        <div className="metric-label-pro text-xs font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </div>
      </div>

      {/* Optional trend indicator */}
      {trend && (
        isDirectionalTrend ? (
          <div className={`mt-4 flex items-center justify-center gap-1.5 text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>vs last period</span>
          </div>
        ) : (
          <div className="mt-4 text-center text-xs font-medium text-clinical-muted">
            {trend}
          </div>
        )
      )}
    </div>
  );
}
